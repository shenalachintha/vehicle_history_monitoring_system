import { z } from 'zod';
import prisma from '../prisma.js';
import { MaintenanceService } from '../services/maintenance.service.js';
import { AlertService } from '../services/alert.service.js';

export const ruleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    category: z.string().min(1),
    vehicleId: z.string().uuid().optional().nullable(),
    vehicleCategory: z.enum(['CAR', 'VAN', 'PICKUP', 'LORRY', 'BUS', 'MOTORCYCLE', 'SPECIALIZED']).optional().nullable(),
    conditionType: z.enum(['DATE_ONLY', 'MILEAGE_ONLY', 'DATE_OR_MILEAGE', 'DATE_AND_MILEAGE']).default('DATE_OR_MILEAGE'),
    intervalMonths: z.number().int().positive().optional().nullable(),
    intervalKm: z.number().positive().optional().nullable(),
    warningDaysBefore: z.number().int().min(0).default(30),
    warningKmBefore: z.number().min(0).default(500),
    criticalOverdueDays: z.number().int().min(0).default(15),
    criticalOverdueKm: z.number().min(0).default(200),
    lastCompletedDate: z.string().optional().nullable(),
    lastCompletedKm: z.number().optional().nullable(),
    instructions: z.string().optional(),
    responsibleDept: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

export class MaintenanceController {
  static async list(req, res, next) {
    try {
      const { vehicleId, category, isActive } = req.query;
      const where = {};

      if (vehicleId) where.vehicleId = vehicleId;
      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const rules = await prisma.maintenanceRule.findMany({
        where,
        include: {
          vehicle: {
            select: { registrationNo: true, make: true, model: true, currentOdometer: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Enrich with real-time status evaluation
      // Pass rule.vehicle as 4th arg (vehicleContext) so evaluateRuleStatus can
      // dynamically recalculate nextDueKm when lastCompletedKm is null (newly added rules).
      const enriched = rules.map(rule => {
        const vehicleKm = rule.vehicle ? rule.vehicle.currentOdometer : 0;
        const evalInfo = MaintenanceService.evaluateRuleStatus(rule, vehicleKm, new Date(), rule.vehicle);
        return {
          ...rule,
          evaluation: evalInfo,
        };
      });

      res.json({
        success: true,
        data: enriched,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const data = req.body;

      // Calculate initial next due conditions
      let baseKm = data.lastCompletedKm;
      // If lastCompletedKm is omitted for a specific vehicle, fallback to the vehicle's current odometer
      if ((baseKm === undefined || baseKm === null) && data.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: data.vehicleId },
          select: { currentOdometer: true },
        });
        if (vehicle) {
          baseKm = Number(vehicle.currentOdometer || 0);
        }
      }
      baseKm = baseKm || 0;

      const baseDate = data.lastCompletedDate ? new Date(data.lastCompletedDate) : new Date();
      const { nextDueDate, nextDueKm } = MaintenanceService.calculateNextDue(data, baseDate, baseKm);

      const rule = await prisma.maintenanceRule.create({
        data: {
          ...data,
          lastCompletedKm: data.lastCompletedKm !== undefined && data.lastCompletedKm !== null ? data.lastCompletedKm : (data.vehicleId ? baseKm : null),
          lastCompletedDate: data.lastCompletedDate ? new Date(data.lastCompletedDate) : null,
          nextDueDate,
          nextDueKm,
        },
      });

      // BUG FIX: Trigger alert evaluation for specific vehicle OR all vehicles (fleet-wide/category rule)
      if (rule.vehicleId) {
        // Vehicle-specific rule → evaluate only that vehicle
        AlertService.evaluateFleetAlerts(rule.vehicleId).catch(console.error);
      } else {
        // Fleet-wide or category rule (vehicleId=null) → evaluate ALL active vehicles
        AlertService.evaluateFleetAlerts(null).catch(console.error);
      }

      res.status(201).json({
        success: true,
        message: 'Maintenance rule created successfully.',
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const existing = await prisma.maintenanceRule.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Rule not found.' });
      }

      const baseDate = data.lastCompletedDate ? new Date(data.lastCompletedDate) : existing.lastCompletedDate || new Date();
      const baseKm = data.lastCompletedKm !== undefined ? data.lastCompletedKm : existing.lastCompletedKm || 0;
      const { nextDueDate, nextDueKm } = MaintenanceService.calculateNextDue(
        { ...existing, ...data },
        baseDate,
        baseKm
      );

      const updated = await prisma.maintenanceRule.update({
        where: { id },
        data: {
          ...data,
          lastCompletedDate: data.lastCompletedDate ? new Date(data.lastCompletedDate) : undefined,
          nextDueDate,
          nextDueKm,
        },
      });

      // BUG FIX: Same logic for update — fleet-wide rules must evaluate all vehicles
      if (updated.vehicleId) {
        AlertService.evaluateFleetAlerts(updated.vehicleId).catch(console.error);
      } else {
        AlertService.evaluateFleetAlerts(null).catch(console.error);
      }

      res.json({
        success: true,
        message: 'Maintenance rule updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const rule = await prisma.maintenanceRule.findUnique({
        where: { id },
        select: { id: true, vehicleId: true },
      });

      if (!rule) {
        return res.status(404).json({ success: false, message: 'Maintenance rule not found.' });
      }

      await prisma.$transaction([
        // Delete all open and historical alerts generated by this rule
        prisma.alert.deleteMany({ where: { ruleId: id } }),
        prisma.maintenanceRule.delete({ where: { id } }),
      ]);

      // Trigger fleet alert re-evaluation so no stale alert remains
      AlertService.evaluateFleetAlerts(rule.vehicleId || null).catch(console.error);

      res.json({
        success: true,
        message: 'Maintenance rule and all associated alerts deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
