import { z } from 'zod';
import prisma from '../prisma.js';
import { MaintenanceService } from '../services/maintenance.service.js';
import { AlertService } from '../services/alert.service.js';

export const eventCreateSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    eventType: z.enum([
      'ROUTINE_SERVICE',
      'REPAIR_BREAKDOWN',
      'ACCIDENT_INCIDENT',
      'RECALL',
      'INSPECTION',
      'INSURANCE',
      'REGISTRATION_LICENSING',
      'CHEMICAL_ADDITIVE',
      'DIESEL_TUNEUP',
      'ENGINE_MAINTENANCE',
      'BRAKE_MAINTENANCE',
      'TYRE_MAINTENANCE',
      'BATTERY_MAINTENANCE',
      'COOLING_MAINTENANCE',
      'ELECTRICAL_MAINTENANCE',
      'WARRANTY_CLAIM',
      'PARTS_REPLACEMENT',
      'OTHER',
    ]),
    title: z.string().min(2),
    eventDate: z.string().optional(),
    odometerAtEvent: z.union([z.number(), z.string()]).optional().nullable(),
    issueDescription: z.string().optional(),
    workPerformed: z.string().min(2),
    serviceProvider: z.string().min(1),
    technicianName: z.string().optional(),
    laborCost: z.number().min(0).default(0),
    partsCost: z.number().min(0).default(0),
    otherCost: z.number().min(0).default(0),
    currency: z.string().default('USD'),
    recommendations: z.string().optional(),
    nextServiceDate: z.string().optional(),
    nextServiceMileage: z.number().optional(),
    ruleIdToComplete: z.string().uuid().optional(),
    items: z.array(
      z.object({
        description: z.string().min(1),
        itemType: z.enum(['PART', 'FLUID', 'ADDITIVE', 'CONSUMABLE', 'LABOR', 'OTHER']).default('PART'),
        brand: z.string().optional(),
        specification: z.string().optional(),
        quantity: z.number().positive().default(1),
        unitCost: z.number().min(0).default(0),
      })
    ).optional(),
  }),
});

export class EventController {
  static async list(req, res, next) {
    try {
      const { vehicleId, eventType, startDate, endDate, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {};
      if (vehicleId) where.vehicleId = vehicleId;
      if (eventType) where.eventType = eventType;
      if (startDate || endDate) {
        where.eventDate = {};
        if (startDate) where.eventDate.gte = new Date(startDate);
        if (endDate) where.eventDate.lte = new Date(endDate);
      }

      const [total, events] = await Promise.all([
        prisma.vehicleEvent.count({ where }),
        prisma.vehicleEvent.findMany({
          where,
          include: {
            vehicle: {
              select: { registrationNo: true, make: true, model: true, category: true },
            },
            createdBy: {
              select: { fullName: true, email: true },
            },
            items: true,
          },
          orderBy: { eventDate: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      res.json({
        success: true,
        data: events,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const event = await prisma.vehicleEvent.findUnique({
        where: { id },
        include: {
          vehicle: true,
          createdBy: { select: { fullName: true, email: true, role: true } },
          items: true,
        },
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle event not found.',
          error: 'NOT_FOUND',
        });
      }

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const {
        vehicleId,
        eventType,
        title,
        eventDate = new Date(),
        odometerAtEvent,
        issueDescription,
        workPerformed,
        serviceProvider,
        technicianName,
        laborCost = 0,
        partsCost = 0,
        otherCost = 0,
        currency = 'USD',
        recommendations,
        nextServiceDate,
        nextServiceMileage,
        ruleIdToComplete,
        items = [],
      } = req.body;

      // Fetch vehicle to validate and get fallback odometer if omitted
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found.' });
      }

      // If odometerAtEvent was omitted or blank, fallback to vehicle's current odometer
      const finalOdometer = (odometerAtEvent !== undefined && odometerAtEvent !== null && odometerAtEvent !== '')
        ? Number(odometerAtEvent)
        : Number(vehicle.currentOdometer || 0);

      // Calculate total item parts cost if provided
      let computedPartsCost = partsCost;
      if (items.length > 0) {
        computedPartsCost = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
      }

      const totalCost = Number(laborCost) + Number(computedPartsCost) + Number(otherCost);
      const eventDateObj = new Date(eventDate);

      const newEvent = await prisma.vehicleEvent.create({
        data: {
          vehicleId,
          eventType,
          title,
          eventDate: eventDateObj,
          odometerAtEvent: finalOdometer,
          issueDescription,
          workPerformed,
          serviceProvider,
          technicianName,
          laborCost,
          partsCost: computedPartsCost,
          otherCost,
          totalCost,
          currency,
          recommendations,
          nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
          nextServiceMileage: nextServiceMileage ? Number(nextServiceMileage) : null,
          createdById: req.user.id,
          items: {
            create: items.map(item => ({
              description: item.description,
              itemType: item.itemType || 'PART',
              brand: item.brand,
              specification: item.specification,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalPrice: item.quantity * item.unitCost,
            })),
          },
        },
        include: { items: true },
      });

      // Update vehicle current odometer if event odometer is higher
      if (finalOdometer > Number(vehicle.currentOdometer)) {
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: {
            currentOdometer: finalOdometer,
            odometerLastUpdated: eventDateObj,
          },
        });
      }

      // Determine which rule(s) this service event satisfies
      let targetRuleIds = [];
      if (ruleIdToComplete) {
        targetRuleIds.push(ruleIdToComplete);
      } else {
        // Auto-detect applicable active rules for this vehicle
        const applicableRules = await prisma.maintenanceRule.findMany({
          where: {
            isActive: true,
            OR: [
              { vehicleId },
              { vehicleId: null, vehicleCategory: null },
              { vehicleId: null, vehicleCategory: vehicle.category },
            ],
          },
        });

        // Find open alerts for this vehicle to resolve
        const openAlerts = await prisma.alert.findMany({
          where: {
            vehicleId,
            status: { in: ['OPEN', 'ACKNOWLEDGED'] },
            ruleId: { not: null },
          },
        });
        const openRuleIds = new Set(openAlerts.map(a => a.ruleId));

        for (const rule of applicableRules) {
          const ruleNameLower = (rule.name || '').toLowerCase();
          const titleLower = (title || '').toLowerCase();
          const workLower = (workPerformed || '').toLowerCase();

          const nameMatches = titleLower.includes(ruleNameLower) || ruleNameLower.includes(titleLower) ||
            workLower.includes(ruleNameLower) ||
            (titleLower.includes('oil') && ruleNameLower.includes('oil')) ||
            (titleLower.includes('service') && ruleNameLower.includes('service')) ||
            (titleLower.includes('brake') && ruleNameLower.includes('brake')) ||
            (titleLower.includes('tyre') && ruleNameLower.includes('tyre'));

          if (openRuleIds.has(rule.id) || nameMatches) {
            targetRuleIds.push(rule.id);
          }
        }

        // If still no rule matched, and it's a routine service and vehicle has exactly 1 rule, complete it
        if (targetRuleIds.length === 0 && eventType === 'ROUTINE_SERVICE' && applicableRules.length === 1) {
          targetRuleIds.push(applicableRules[0].id);
        }
      }

      // Complete all identified rules and auto-resolve associated alerts
      for (const rId of targetRuleIds) {
        try {
          await MaintenanceService.completeRuleMaintenance(
            rId,
            eventDateObj,
            finalOdometer
          );

          await prisma.alert.updateMany({
            where: {
              vehicleId,
              ruleId: rId,
              status: { in: ['OPEN', 'ACKNOWLEDGED'] },
            },
            data: {
              status: 'RESOLVED',
              resolutionNotes: `Auto-resolved: Service event logged (${title} at ${finalOdometer.toLocaleString()} km).`,
              resolvedAt: eventDateObj,
            },
          });
        } catch (e) {
          console.error(`[MAINTENANCE RULE COMPLETE ERROR] Rule ID ${rId}:`, e);
        }
      }

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOG_VEHICLE_EVENT',
          entityType: 'VehicleEvent',
          entityId: newEvent.id,
          details: `Logged ${eventType} (${title}) for vehicle. Total cost: ${currency} ${totalCost}`,
        },
      });

      // Synchronously re-evaluate fleet alerts for this vehicle so alerts and profile warnings are immediately cleared
      try {
        await AlertService.evaluateFleetAlerts(vehicleId);
      } catch (err) {
        console.error('[ALERT EVAL ERROR]', err);
      }

      res.status(201).json({
        success: true,
        message: 'Vehicle event logged successfully and maintenance alerts cleared.',
        data: newEvent,
      });
    } catch (error) {
      next(error);
    }
  }
}

