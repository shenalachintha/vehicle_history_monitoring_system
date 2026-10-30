import { z } from 'zod';
import prisma from '../prisma.js';
import { MaintenanceService } from '../services/maintenance.service.js';
import { AlertService } from '../services/alert.service.js';

export const vehicleCreateSchema = z.object({
  body: z.object({
    registrationNo: z.string().min(2).max(20),
    vin: z.string().optional(),
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1950).max(2100),
    category: z.enum(['CAR', 'VAN', 'PICKUP', 'LORRY', 'BUS', 'MOTORCYCLE', 'SPECIALIZED']).default('CAR'),
    fuelType: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']).default('PETROL'),
    transmission: z.enum(['AUTOMATIC', 'MANUAL']).default('AUTOMATIC'),
    chassisNo: z.string().optional(),
    engineNo: z.string().optional(),
    status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED']).default('ACTIVE'),
    currentOdometer: z.number().min(0).default(0),
    assignedDriver: z.string().optional(),
    driverContact: z.string().optional(),
    department: z.string().optional(),
    branch: z.string().optional(),
    operationalLocation: z.string().optional(),
    currentLatitude: z.number().optional(),
    currentLongitude: z.number().optional(),
    locationStatus: z.enum(['MOVING', 'STOPPED', 'OFFLINE']).default('STOPPED'),
    purchaseDate: z.string().optional(),
    purchasePrice: z.number().optional(),
    supplier: z.string().optional(),
    warrantyDetails: z.string().optional(),
    warrantyExpiry: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export class VehicleController {
  static async list(req, res, next) {
    try {
      const { search, status, category, department, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {};

      if (search) {
        where.OR = [
          { registrationNo: { contains: search } },
          { make: { contains: search } },
          { model: { contains: search } },
          { vin: { contains: search } },
          { assignedDriver: { contains: search } },
        ];
      }

      if (status) where.status = status;
      if (category) where.category = category;
      if (department) where.department = department;

      const [total, vehicles] = await Promise.all([
        prisma.vehicle.count({ where }),
        prisma.vehicle.findMany({
          where,
          include: {
            alerts: {
              where: { status: 'OPEN' },
              select: { id: true, severity: true, title: true },
            },
            maintenanceRules: {
              where: { isActive: true },
              select: { id: true, name: true, nextDueDate: true, nextDueKm: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      res.json({
        success: true,
        data: vehicles,
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

      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          events: {
            include: {
              items: true,
              createdBy: { select: { fullName: true, email: true } },
            },
            orderBy: { eventDate: 'desc' },
          },
          mileageReadings: {
            include: {
              recordedBy: { select: { fullName: true } },
            },
            orderBy: { recordedDate: 'desc' },
            take: 20,
          },
          maintenanceRules: {
            orderBy: { createdAt: 'desc' },
          },
          documents: {
            orderBy: { expiryDate: 'asc' },
          },
          alerts: {
            where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found.',
          error: 'VEHICLE_NOT_FOUND',
        });
      }

      // Also fetch fleet-wide rules (vehicleId=null) and category-matching rules
      // so that rules created with "Fleet" or "By Category" scope also appear here
      const broadRules = await prisma.maintenanceRule.findMany({
        where: {
          isActive: true,
          OR: [
            { vehicleId: null, vehicleCategory: null }, // fleet-wide
            { vehicleId: null, vehicleCategory: vehicle.category }, // same vehicle category
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      // Merge: vehicle-specific rules first, then broad rules (avoiding duplicates)
      const vehicleRuleIds = new Set(vehicle.maintenanceRules.map(r => r.id));
      const allRules = [
        ...vehicle.maintenanceRules,
        ...broadRules.filter(r => !vehicleRuleIds.has(r.id)),
      ];

      // Compute evaluated status for each maintenance rule
      const enrichedRules = allRules.map(rule => {
        const evalInfo = MaintenanceService.evaluateRuleStatus(
          rule,
          vehicle.currentOdometer,
          new Date(),
          vehicle
        );
        return {
          ...rule,
          evaluation: evalInfo,
          // Indicate scope source for UI labelling
          scopeLabel: rule.vehicleId === id
            ? 'This Vehicle'
            : rule.vehicleCategory
              ? `All ${rule.vehicleCategory}s`
              : 'Fleet-Wide',
        };
      });

      // Calculate cost summary
      const totalExpenditure = vehicle.events.reduce(
        (sum, ev) => sum + Number(ev.totalCost || 0),
        0
      );

      res.json({
        success: true,
        data: {
          ...vehicle,
          maintenanceRules: enrichedRules,
          totalExpenditure,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const data = req.body;

      const existing = await prisma.vehicle.findUnique({
        where: { registrationNo: data.registrationNo },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Vehicle registration '${data.registrationNo}' is already registered.`,
          error: 'DUPLICATE_REGISTRATION',
        });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          ...data,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
          odometerLastUpdated: new Date(),
        },
      });

      // Log initial mileage reading
      await prisma.mileageReading.create({
        data: {
          vehicleId: vehicle.id,
          odometerReading: data.currentOdometer || 0,
          distanceTravelled: 0,
          recordedDate: new Date(),
          weekNumber: 1,
          year: new Date().getFullYear(),
          recordedById: req.user.id,
        },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_VEHICLE',
          entityType: 'Vehicle',
          entityId: vehicle.id,
          details: `Registered vehicle ${vehicle.registrationNo} (${vehicle.make} ${vehicle.model})`,
        },
      });

      // Re-evaluate fleet alerts for the vehicle without false overdue warnings
      AlertService.evaluateFleetAlerts(vehicle.id).catch(console.error);

      res.status(201).json({
        success: true,
        message: 'Vehicle registered successfully.',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          ...data,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_VEHICLE',
          entityType: 'Vehicle',
          entityId: vehicle.id,
          details: `Updated vehicle ${vehicle.registrationNo}`,
        },
      });

      // Trigger alert evaluation after vehicle details/mileage/category update
      AlertService.evaluateFleetAlerts(vehicle.id).catch(console.error);

      res.json({
        success: true,
        message: 'Vehicle updated successfully.',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: { status: 'DECOMMISSIONED' },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DECOMMISSION_VEHICLE',
          entityType: 'Vehicle',
          entityId: id,
          details: `Decommissioned vehicle ${vehicle.registrationNo}`,
        },
      });

      res.json({
        success: true,
        message: 'Vehicle status updated to DECOMMISSIONED.',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }
}

