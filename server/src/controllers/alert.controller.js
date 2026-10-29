import { z } from 'zod';
import prisma from '../prisma.js';
import { AlertService } from '../services/alert.service.js';

export class AlertController {
  static async list(req, res, next) {
    try {
      const { vehicleId, severity, status = 'OPEN', alertType, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {};
      if (vehicleId) where.vehicleId = vehicleId;
      if (severity) where.severity = severity;
      if (status && status !== 'ALL') where.status = status;
      if (alertType) where.alertType = alertType;

      const [total, alerts] = await Promise.all([
        prisma.alert.count({ where }),
        prisma.alert.findMany({
          where,
          include: {
            vehicle: {
              select: {
                registrationNo: true,
                make: true,
                model: true,
                currentOdometer: true,
                assignedDriver: true,
                driverContact: true,
              },
            },
            rule: {
              select: { name: true, category: true, conditionType: true },
            },
            acknowledgedBy: { select: { fullName: true } },
            resolvedBy: { select: { fullName: true } },
          },
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: Number(limit),
        }),
      ]);

      res.json({
        success: true,
        data: alerts,
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

  static async acknowledge(req, res, next) {
    try {
      const { id } = req.params;
      const alert = await AlertService.acknowledgeAlert(id, req.user.id);

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ACKNOWLEDGE_ALERT',
          entityType: 'Alert',
          entityId: id,
          details: `Acknowledged alert: ${alert.title}`,
        },
      });

      res.json({
        success: true,
        message: 'Alert acknowledged.',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resolve(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const alert = await AlertService.resolveAlert(id, req.user.id, notes);

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'RESOLVE_ALERT',
          entityType: 'Alert',
          entityId: id,
          details: `Resolved alert: ${alert.title}. Notes: ${notes || 'None'}`,
        },
      });

      res.json({
        success: true,
        message: 'Alert marked as resolved.',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  static async triggerEvaluation(req, res, next) {
    try {
      const alerts = await AlertService.evaluateFleetAlerts();
      res.json({
        success: true,
        message: `Evaluation completed. Created/updated ${alerts.length} alerts.`,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }
}

