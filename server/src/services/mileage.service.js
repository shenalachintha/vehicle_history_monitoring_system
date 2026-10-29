import prisma from '../prisma.js';
import { AlertService } from './alert.service.js';

export class MileageService {
  /**
   * Helper to get ISO week number
   */
  static getWeekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  /**
   * Record a single odometer reading for a vehicle
   */
  static async recordMileage({
    vehicleId,
    odometerReading,
    recordedDate = new Date(),
    isCorrection = false,
    correctionReason = null,
    userId,
  }) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        mileageReadings: {
          orderBy: { recordedDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!vehicle) {
      throw new Error(`Vehicle with ID ${vehicleId} not found.`);
    }

    const newKm = Number(odometerReading);
    if (isNaN(newKm) || newKm < 0) {
      throw new Error('Odometer reading must be a positive number.');
    }

    const previousKm = Number(vehicle.currentOdometer);
    const distanceTravelled = newKm - previousKm;

    // Validate negative distance
    if (distanceTravelled < 0) {
      if (!isCorrection) {
        throw new Error(
          `Unexplained odometer decrease from ${previousKm.toLocaleString()} km to ${newKm.toLocaleString()} km. Negative distance is rejected unless marked as an authorized correction with a detailed reason.`
        );
      }
      if (!correctionReason || correctionReason.trim().length < 5) {
        throw new Error('A legitimate correction reason (e.g. meter replacement, instrument cluster repair, typo correction) is required for odometer rollbacks.');
      }
    }

    // Flag anomalies (> 3000 km in 1 week or negative distance correction)
    let isFlagged = false;
    let flagReason = null;
    if (distanceTravelled > 3000) {
      isFlagged = true;
      flagReason = `High distance anomaly: ${distanceTravelled.toLocaleString()} km recorded in this period.`;
    } else if (distanceTravelled < 0 && isCorrection) {
      isFlagged = true;
      flagReason = `Authorized odometer correction/rollback: ${correctionReason}`;
    }

    const dateObj = new Date(recordedDate);
    const weekNumber = this.getWeekNumber(dateObj);
    const year = dateObj.getFullYear();

    // Perform database transaction
    const [reading, updatedVehicle] = await prisma.$transaction([
      prisma.mileageReading.create({
        data: {
          vehicleId,
          recordedDate: dateObj,
          odometerReading: newKm,
          distanceTravelled: distanceTravelled >= 0 ? distanceTravelled : 0,
          isCorrection,
          correctionReason,
          isFlagged,
          flagReason,
          weekNumber,
          year,
          recordedById: userId,
        },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          currentOdometer: newKm,
          odometerLastUpdated: dateObj,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: isCorrection ? 'ODOMETER_CORRECTION' : 'MILEAGE_UPDATE',
          entityType: 'Vehicle',
          entityId: vehicleId,
          details: `Updated odometer from ${previousKm} km to ${newKm} km. Delta: ${distanceTravelled} km.`,
        },
      }),
    ]);

    // Asynchronously trigger maintenance alert evaluation for this vehicle
    AlertService.evaluateFleetAlerts(vehicleId).catch(err => {
      console.error('[ALERT EVAL ERROR]', err);
    });

    return { reading, vehicle: updatedVehicle };
  }

  /**
   * Bulk submit weekly readings for multiple vehicles
   */
  static async bulkRecordMileage(readingsArray, userId) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const item of readingsArray) {
      try {
        const res = await this.recordMileage({
          vehicleId: item.vehicleId,
          odometerReading: item.odometerReading,
          recordedDate: item.recordedDate || new Date(),
          isCorrection: item.isCorrection || false,
          correctionReason: item.correctionReason || null,
          userId,
        });
        results.successful.push({
          vehicleId: item.vehicleId,
          registrationNo: res.vehicle.registrationNo,
          odometer: res.vehicle.currentOdometer,
        });
      } catch (err) {
        results.failed.push({
          vehicleId: item.vehicleId,
          error: err.message,
        });
      }
    }

    return results;
  }
}

