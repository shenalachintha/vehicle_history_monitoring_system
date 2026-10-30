import prisma from '../prisma.js';

/**
 * Maintenance Engine for FleetGuard Pro
 * Handles dual-criteria scheduling (Date OR Mileage, Date AND Mileage),
 * warning windows, and overdue escalation.
 */
export class MaintenanceService {
  /**
   * Calculate next due date and next due mileage for a rule given base date and km
   */
  static calculateNextDue(rule, baseDate = new Date(), baseKm = 0) {
    let nextDueDate = null;
    let nextDueKm = null;

    const baseKmNum = Number(baseKm) || 0;
    const baseDateObj = baseDate ? new Date(baseDate) : new Date();

    if (rule.intervalMonths && rule.intervalMonths > 0) {
      nextDueDate = new Date(baseDateObj);
      nextDueDate.setMonth(nextDueDate.getMonth() + Number(rule.intervalMonths));
    }

    if (rule.intervalKm && Number(rule.intervalKm) > 0) {
      nextDueKm = baseKmNum + Number(rule.intervalKm);
    }

    return { nextDueDate, nextDueKm };
  }

  /**
   * Evaluate rule status against current vehicle odometer and current date
   * Returns: { status: 'OK' | 'UPCOMING' | 'DUE' | 'OVERDUE' | 'CRITICAL', reason: string, isDue: boolean, isOverdue: boolean }
   */
  static evaluateRuleStatus(rule, currentKm, currentDate = new Date(), vehicleContext = null) {
    const currentKmNum = Number(currentKm) || 0;
    const now = new Date(currentDate);

    let nextDueDate = rule.nextDueDate ? new Date(rule.nextDueDate) : null;
    let nextDueKm = rule.nextDueKm ? Number(rule.nextDueKm) : null;

    // If this is a fleet-wide/category rule (vehicleId=null) OR a newly registered vehicle
    // with no prior service records, dynamically calculate target due based on vehicle's baseline
    if (!rule.vehicleId || (vehicleContext && !rule.lastCompletedDate && !rule.lastCompletedKm)) {
      const baseKm = (rule.lastCompletedKm !== null && rule.lastCompletedKm !== undefined)
        ? Number(rule.lastCompletedKm)
        : currentKmNum;
      const baseDate = rule.lastCompletedDate ? new Date(rule.lastCompletedDate) : now;

      if (rule.intervalKm && Number(rule.intervalKm) > 0) {
        nextDueKm = baseKm + Number(rule.intervalKm);
      }
      if (rule.intervalMonths && Number(rule.intervalMonths) > 0) {
        nextDueDate = new Date(baseDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + Number(rule.intervalMonths));
      }
    }

    const warningDays = Number(rule.warningDaysBefore) || 30;
    const warningKm = Number(rule.warningKmBefore) || 500;
    const criticalDays = Number(rule.criticalOverdueDays) || 15;
    const criticalKm = Number(rule.criticalOverdueKm) || 200;

    // Date calculations
    let dateDiffDays = null;
    let isDateUpcoming = false;
    let isDateDue = false;
    let isDateOverdue = false;
    let isDateCritical = false;

    if (nextDueDate) {
      const diffTime = nextDueDate.getTime() - now.getTime();
      dateDiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // positive if future, negative if past
      if (dateDiffDays <= -criticalDays) {
        isDateCritical = true;
        isDateOverdue = true;
        isDateDue = true;
      } else if (dateDiffDays < 0) {
        isDateOverdue = true;
        isDateDue = true;
      } else if (dateDiffDays === 0) {
        isDateDue = true;
      } else if (dateDiffDays <= warningDays) {
        isDateUpcoming = true;
      }
    }

    // Mileage calculations
    let kmRemaining = null;
    let isKmUpcoming = false;
    let isKmDue = false;
    let isKmOverdue = false;
    let isKmCritical = false;

    if (nextDueKm !== null) {
      kmRemaining = nextDueKm - currentKmNum;
      if (kmRemaining <= -criticalKm) {
        isKmCritical = true;
        isKmOverdue = true;
        isKmDue = true;
      } else if (kmRemaining < 0) {
        isKmOverdue = true;
        isKmDue = true;
      } else if (kmRemaining === 0) {
        isKmDue = true;
      } else if (kmRemaining <= warningKm) {
        isKmUpcoming = true;
      }
    }

    let status = 'OK';
    let reason = 'Maintenance is within normal operating thresholds.';
    let isDue = false;
    let isOverdue = false;

    switch (rule.conditionType) {
      case 'DATE_ONLY':
        if (isDateCritical) {
          status = 'CRITICAL';
          reason = `Critical: Overdue by ${Math.abs(dateDiffDays)} days (due ${nextDueDate.toISOString().split('T')[0]})`;
          isDue = true;
          isOverdue = true;
        } else if (isDateOverdue) {
          status = 'OVERDUE';
          reason = `Overdue by ${Math.abs(dateDiffDays)} days`;
          isDue = true;
          isOverdue = true;
        } else if (isDateDue || isDateUpcoming) {
          status = isDateDue ? 'DUE' : 'UPCOMING';
          reason = `Due in ${dateDiffDays} days (${nextDueDate.toISOString().split('T')[0]})`;
          isDue = true;
        }
        break;

      case 'MILEAGE_ONLY':
        if (isKmCritical) {
          status = 'CRITICAL';
          reason = `Critical: Overdue by ${Math.abs(kmRemaining).toLocaleString()} km (target ${nextDueKm.toLocaleString()} km, current ${currentKmNum.toLocaleString()} km)`;
          isDue = true;
          isOverdue = true;
        } else if (isKmOverdue) {
          status = 'OVERDUE';
          reason = `Overdue by ${Math.abs(kmRemaining).toLocaleString()} km`;
          isDue = true;
          isOverdue = true;
        } else if (isKmDue || isKmUpcoming) {
          status = isKmDue ? 'DUE' : 'UPCOMING';
          reason = `Due in ${kmRemaining.toLocaleString()} km (at ${nextDueKm.toLocaleString()} km)`;
          isDue = true;
        }
        break;

      case 'DATE_OR_MILEAGE':
        // Whichever triggers first
        if (isDateCritical || isKmCritical) {
          status = 'CRITICAL';
          reason = isKmCritical
            ? `Critical: Mileage overdue by ${Math.abs(kmRemaining).toLocaleString()} km`
            : `Critical: Date overdue by ${Math.abs(dateDiffDays)} days`;
          isDue = true;
          isOverdue = true;
        } else if (isDateOverdue || isKmOverdue) {
          status = 'OVERDUE';
          reason = isKmOverdue
            ? `Overdue by mileage: ${currentKmNum.toLocaleString()} / ${nextDueKm?.toLocaleString()} km`
            : `Overdue by date: ${Math.abs(dateDiffDays)} days overdue`;
          isDue = true;
          isOverdue = true;
        } else if (isDateDue || isKmDue) {
          status = 'DUE';
          reason = isKmDue ? `Reached target mileage of ${nextDueKm?.toLocaleString()} km` : `Reached target date`;
          isDue = true;
        } else if (isDateUpcoming || isKmUpcoming) {
          status = 'UPCOMING';
          const parts = [];
          if (isDateUpcoming && dateDiffDays !== null) parts.push(`${dateDiffDays} days remaining`);
          if (isKmUpcoming && kmRemaining !== null) parts.push(`${kmRemaining.toLocaleString()} km remaining`);
          reason = `Upcoming service: ${parts.join(' or ')}`;
          isDue = true;
        }
        break;

      case 'DATE_AND_MILEAGE':
        // Both conditions must be met
        if (isDateCritical && isKmCritical) {
          status = 'CRITICAL';
          reason = `Critical: Both date (${Math.abs(dateDiffDays)} days) and mileage (${Math.abs(kmRemaining)} km) overdue`;
          isDue = true;
          isOverdue = true;
        } else if (isDateOverdue && isKmOverdue) {
          status = 'OVERDUE';
          reason = `Both date and mileage thresholds exceeded`;
          isDue = true;
          isOverdue = true;
        } else if ((isDateDue || isDateOverdue) && (isKmDue || isKmOverdue)) {
          status = 'DUE';
          reason = `Both date and mileage targets reached`;
          isDue = true;
        } else if ((isDateUpcoming || isDateOverdue) && (isKmUpcoming || isKmOverdue)) {
          status = 'UPCOMING';
          reason = `Approaching combined criteria: ${dateDiffDays} days, ${kmRemaining} km remaining`;
          isDue = true;
        }
        break;
    }

    return {
      status,
      reason,
      isDue,
      isOverdue,
      dateDiffDays,
      kmRemaining,
      nextDueDate,
      nextDueKm,
    };
  }

  /**
   * Complete a maintenance rule when a service event is logged
   */
  static async completeRuleMaintenance(ruleId, completedDate, completedKm) {
    const rule = await prisma.maintenanceRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new Error('Maintenance rule not found.');

    const { nextDueDate, nextDueKm } = this.calculateNextDue(rule, completedDate, completedKm);

    return await prisma.maintenanceRule.update({
      where: { id: ruleId },
      data: {
        lastCompletedDate: new Date(completedDate),
        lastCompletedKm: Number(completedKm),
        nextDueDate,
        nextDueKm,
      },
    });
  }
}

