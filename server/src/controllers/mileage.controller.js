import { z } from 'zod';
import prisma from '../prisma.js';
import { MileageService } from '../services/mileage.service.js';

export const singleMileageSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    odometerReading: z.number().min(0),
    recordedDate: z.string().optional(),
    isCorrection: z.boolean().default(false),
    correctionReason: z.string().optional().nullable(),
  }),
});

export const bulkMileageSchema = z.object({
  body: z.object({
    readings: z.array(
      z.object({
        vehicleId: z.string().uuid(),
        odometerReading: z.number().min(0),
        recordedDate: z.string().optional(),
        isCorrection: z.boolean().default(false),
        correctionReason: z.string().optional().nullable(),
      })
    ).min(1),
  }),
});

export class MileageController {
  static async list(req, res, next) {
    try {
      const { vehicleId, year, weekNumber, isFlagged, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {};
      if (vehicleId) where.vehicleId = vehicleId;
      if (year) where.year = Number(year);
      if (weekNumber) where.weekNumber = Number(weekNumber);
      if (isFlagged !== undefined) where.isFlagged = isFlagged === 'true';

      const [total, readings] = await Promise.all([
        prisma.mileageReading.count({ where }),
        prisma.mileageReading.findMany({
          where,
          include: {
            vehicle: {
              select: { registrationNo: true, make: true, model: true, assignedDriver: true },
            },
            recordedBy: {
              select: { fullName: true, email: true },
            },
          },
          orderBy: { recordedDate: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      res.json({
        success: true,
        data: readings,
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

  static async recordSingle(req, res, next) {
    try {
      const { vehicleId, odometerReading, recordedDate, isCorrection, correctionReason } = req.body;

      const result = await MileageService.recordMileage({
        vehicleId,
        odometerReading,
        recordedDate: recordedDate ? new Date(recordedDate) : new Date(),
        isCorrection,
        correctionReason,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Mileage recorded successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordBulk(req, res, next) {
    try {
      const { readings } = req.body;
      const result = await MileageService.bulkRecordMileage(readings, req.user.id);

      res.status(200).json({
        success: true,
        message: `Processed ${readings.length} readings. ${result.successful.length} succeeded, ${result.failed.length} failed.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMissingWeekly(req, res, next) {
    try {
      const daysThreshold = Number(req.query.days) || 7;
      const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

      const vehicles = await prisma.vehicle.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { odometerLastUpdated: { lt: thresholdDate } },
            { odometerLastUpdated: null },
          ],
        },
        select: {
          id: true,
          registrationNo: true,
          make: true,
          model: true,
          assignedDriver: true,
          driverContact: true,
          department: true,
          currentOdometer: true,
          odometerLastUpdated: true,
        },
        orderBy: { odometerLastUpdated: 'asc' },
      });

      res.json({
        success: true,
        data: vehicles,
        count: vehicles.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

