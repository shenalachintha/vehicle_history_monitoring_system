import { z } from 'zod';
import prisma from '../prisma.js';
import { AlertService } from '../services/alert.service.js';

export const documentCreateSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    docType: z.enum([
      'INSURANCE',
      'REVENUE_LICENCE',
      'FITNESS_CERTIFICATE',
      'EMISSION_TEST',
      'REGISTRATION_CARD',
      'LEASE_AGREEMENT',
      'INVOICE',
      'INSPECTION_REPORT',
      'PHOTO',
      'OTHER',
    ]),
    title: z.string().min(2),
    documentNumber: z.string().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    warningDaysBefore: z.number().int().min(0).max(3650).default(30),
    fileUrl: z.string().default(''),
    fileSize: z.number().default(0),
    notes: z.string().optional(),
  }),
});

export const documentUpdateSchema = z.object({
  body: z.object({
    docType: documentCreateSchema.shape.body.shape.docType.optional(),
    title: z.string().min(2).optional(),
    documentNumber: z.string().optional(),
    issueDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    warningDaysBefore: z.number().int().min(0).max(3650).optional(),
    notes: z.string().optional(),
  }),
});

export class DocumentController {
  static async list(req, res, next) {
    try {
      const { vehicleId, docType, vehicleCategory, expiringSoon, expiresWithinDays } = req.query;
      const where = {};

      if (vehicleId) where.vehicleId = vehicleId;
      if (docType) where.docType = docType;
      if (vehicleCategory) {
        where.vehicle = { category: vehicleCategory };
      }

      if (expiringSoon === 'true') {
        const days = Number(expiresWithinDays);
        const thresholdDays = Number.isFinite(days) && days >= 0 ? days : 30;
        const thresholdDate = new Date(Date.now() + thresholdDays * 24 * 60 * 60 * 1000);
        where.expiryDate = { lte: thresholdDate };
      }

      const documents = await prisma.vehicleDocument.findMany({
        where,
        include: {
          vehicle: {
            select: { registrationNo: true, make: true, model: true, category: true },
          },
          createdBy: {
            select: { fullName: true },
          },
        },
        orderBy: { expiryDate: 'asc' },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const data = req.body;

      const doc = await prisma.vehicleDocument.create({
        data: {
          ...data,
          issueDate: data.issueDate ? new Date(data.issueDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          createdById: req.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPLOAD_DOCUMENT',
          entityType: 'VehicleDocument',
          entityId: doc.id,
          details: `Registered ${doc.docType} (${doc.title}) for vehicle. Expiry: ${data.expiryDate || 'N/A'}`,
        },
      });

      // Re-evaluate document alerts
      AlertService.evaluateFleetAlerts(data.vehicleId).catch(console.error);

      res.status(201).json({
        success: true,
        message: 'Document registered successfully.',
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
      try {
        const { id } = req.params;
        const data = req.body;
        const existing = await prisma.vehicleDocument.findUnique({ where: { id } });

        if (!existing) {
          return res.status(404).json({ success: false, message: 'Document not found.' });
        }

        const updated = await prisma.vehicleDocument.update({
          where: { id },
          data: {
            ...data,
            issueDate: data.issueDate === undefined ? undefined : data.issueDate ? new Date(data.issueDate) : null,
            expiryDate: data.expiryDate === undefined ? undefined : data.expiryDate ? new Date(data.expiryDate) : null,
          },
        });

        await AlertService.evaluateFleetAlerts(updated.vehicleId);

        res.json({ success: true, message: 'Document updated successfully.', data: updated });
      } catch (error) {
        next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const document = await prisma.vehicleDocument.findUnique({
        where: { id },
        select: { id: true, vehicleId: true, docType: true },
      });

      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      await prisma.$transaction([
        prisma.alert.deleteMany({
          where: {
            OR: [
              { documentId: id },
              {
                documentId: null,
                vehicleId: document.vehicleId,
                alertType: 'DOCUMENT_EXPIRY',
                title: { contains: document.docType },
              },
            ],
          },
        }),
        prisma.vehicleDocument.delete({ where: { id } }),
      ]);

      res.json({
        success: true,
        message: 'Document deleted.',
      });
    } catch (error) {
      next(error);
    }
  }
}
