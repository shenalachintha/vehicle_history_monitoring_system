import prisma from '../prisma.js';
import { MaintenanceService } from './maintenance.service.js';

export class AlertService {
  /**
   * Run comprehensive evaluation across the entire fleet or a single vehicle
   */
  static async evaluateFleetAlerts(targetVehicleId = null) {
    const where = targetVehicleId ? { id: targetVehicleId } : { status: { not: 'DECOMMISSIONED' } };
    
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        maintenanceRules: { where: { isActive: true } },
        documents: true,
        mileageReadings: {
          orderBy: { recordedDate: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();
    const createdAlerts = [];

    for (const vehicle of vehicles) {
      const currentKm = Number(vehicle.currentOdometer);

      // 1. Evaluate Maintenance Rules
      for (const rule of vehicle.maintenanceRules) {
        const evalResult = MaintenanceService.evaluateRuleStatus(rule, currentKm, now);

        if (evalResult.isDue) {
          const alertType = evalResult.isOverdue
            ? 'OVERDUE_MAINTENANCE'
            : rule.conditionType === 'MILEAGE_ONLY'
            ? 'SERVICE_DUE_MILEAGE'
            : 'SERVICE_DUE_DATE';

          const severity = evalResult.status === 'CRITICAL'
            ? 'CRITICAL'
            : evalResult.status === 'OVERDUE'
            ? 'OVERDUE'
            : 'UPCOMING';

          // Check if an open alert already exists for this vehicle and rule
          const existing = await prisma.alert.findFirst({
            where: {
              vehicleId: vehicle.id,
              ruleId: rule.id,
              status: { in: ['OPEN', 'ACKNOWLEDGED'] },
            },
          });

          if (!existing) {
            const newAlert = await prisma.alert.create({
              data: {
                vehicleId: vehicle.id,
                ruleId: rule.id,
                alertType,
                severity,
                title: `${rule.name} - ${evalResult.status}`,
                message: `${vehicle.registrationNo}: ${evalResult.reason}`,
                dueDate: rule.nextDueDate,
                dueMileage: rule.nextDueKm,
                currentMileageAtAlert: currentKm,
                status: 'OPEN',
              },
            });
            createdAlerts.push(newAlert);
          } else if (existing.severity !== severity) {
            // Escalate severity if overdue/critical
            await prisma.alert.update({
              where: { id: existing.id },
              data: {
                severity,
                title: `${rule.name} - ${evalResult.status}`,
                message: `${vehicle.registrationNo}: ${evalResult.reason}`,
              },
            });
          }
        }
      }

      // 2. Evaluate Document Expirations
      for (const doc of vehicle.documents) {
        if (doc.expiryDate) {
          const expiry = new Date(doc.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          const warningDaysBefore = Number.isFinite(Number(doc.warningDaysBefore))
            ? Number(doc.warningDaysBefore)
            : 30;

          if (diffDays <= warningDaysBefore) {
            const isExpired = diffDays < 0;
            const severity = isExpired ? (diffDays <= -15 ? 'CRITICAL' : 'OVERDUE') : 'UPCOMING';
            const title = `${doc.docType.replace(/_/g, ' ')} ${isExpired ? 'Expired' : 'Expiring Soon'}`;
            const message = isExpired
              ? `${vehicle.registrationNo}: ${doc.docType.replace(/_/g, ' ')} expired ${Math.abs(diffDays)} days ago (${expiry.toISOString().split('T')[0]}).`
              : `${vehicle.registrationNo}: ${doc.docType.replace(/_/g, ' ')} expires in ${diffDays} days (${expiry.toISOString().split('T')[0]}).`;

            const existingDocAlert = await prisma.alert.findFirst({
              where: {
                vehicleId: vehicle.id,
                documentId: doc.id,
                alertType: 'DOCUMENT_EXPIRY',
                status: { in: ['OPEN', 'ACKNOWLEDGED'] },
              },
            });

            if (!existingDocAlert) {
              const alert = await prisma.alert.create({
                data: {
                  vehicleId: vehicle.id,
                  documentId: doc.id,
                  alertType: 'DOCUMENT_EXPIRY',
                  severity,
                  title,
                  message,
                  dueDate: doc.expiryDate,
                  currentMileageAtAlert: currentKm,
                  status: 'OPEN',
                },
              });
              createdAlerts.push(alert);
            } else if (existingDocAlert.severity !== severity) {
              await prisma.alert.update({
                where: { id: existingDocAlert.id },
                data: { severity, title, message },
              });
            }
          }
        }
      }

      // 3. Evaluate Missing Weekly Mileage Updates
      if (vehicle.status === 'ACTIVE') {
        const lastReading = vehicle.mileageReadings[0];
        const lastDate = lastReading ? new Date(lastReading.recordedDate) : new Date(vehicle.createdAt);
        const daysSinceLastUpdate = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceLastUpdate > 7) {
          const existingMileageAlert = await prisma.alert.findFirst({
            where: {
              vehicleId: vehicle.id,
              alertType: 'MISSING_WEEKLY_MILEAGE',
              status: { in: ['OPEN', 'ACKNOWLEDGED'] },
            },
          });

          if (!existingMileageAlert) {
            const alert = await prisma.alert.create({
              data: {
                vehicleId: vehicle.id,
                alertType: 'MISSING_WEEKLY_MILEAGE',
                severity: daysSinceLastUpdate > 14 ? 'OVERDUE' : 'UPCOMING',
                title: `Missing Weekly Odometer Update`,
                message: `${vehicle.registrationNo} has had no mileage submission for ${daysSinceLastUpdate} days.`,
                currentMileageAtAlert: currentKm,
                status: 'OPEN',
              },
            });
            createdAlerts.push(alert);
          }
        }
      }
    }

    return createdAlerts;
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId, userId) {
    return await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  /**
   * Resolve an alert with notes
   */
  static async resolveAlert(alertId, userId, resolutionNotes = '') {
    return await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedById: userId,
        resolvedAt: new Date(),
        resolutionNotes,
      },
    });
  }
}
