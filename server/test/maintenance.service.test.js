import { describe, it, expect } from 'vitest';
import { MaintenanceService } from '../src/services/maintenance.service.js';

describe('MaintenanceService - Dual Criteria Calculations', () => {
  it('calculates next due conditions for DATE_OR_MILEAGE rule', () => {
    const rule = {
      intervalMonths: 6,
      intervalKm: 5000,
      conditionType: 'DATE_OR_MILEAGE',
    };
    const baseDate = new Date('2025-01-01T00:00:00Z');
    const baseKm = 50000;

    const { nextDueDate, nextDueKm } = MaintenanceService.calculateNextDue(rule, baseDate, baseKm);

    expect(nextDueKm).toBe(55000);
    expect(nextDueDate.getMonth()).toBe(6); // 6 months later -> July
    expect(nextDueDate.getFullYear()).toBe(2025);
  });

  it('evaluates DATE_OR_MILEAGE rule as UPCOMING when mileage approaches threshold', () => {
    const rule = {
      conditionType: 'DATE_OR_MILEAGE',
      warningKmBefore: 500,
      warningDaysBefore: 30,
      nextDueKm: 55000,
      nextDueDate: new Date('2025-07-01'),
    };
    // Current km is 54,600 (within 500 km warning threshold)
    const currentKm = 54600;
    const currentDate = new Date('2025-01-10');

    const result = MaintenanceService.evaluateRuleStatus(rule, currentKm, currentDate);

    expect(result.status).toBe('UPCOMING');
    expect(result.isDue).toBe(true);
    expect(result.isOverdue).toBe(false);
  });

  it('evaluates DATE_OR_MILEAGE rule as OVERDUE when mileage exceeds due target', () => {
    const rule = {
      conditionType: 'DATE_OR_MILEAGE',
      warningKmBefore: 500,
      warningDaysBefore: 30,
      criticalOverdueKm: 200,
      nextDueKm: 55000,
      nextDueDate: new Date('2025-07-01'),
    };
    // Current km is 55,050 (> 55,000 km)
    const currentKm = 55050;
    const currentDate = new Date('2025-01-10');

    const result = MaintenanceService.evaluateRuleStatus(rule, currentKm, currentDate);

    expect(result.status).toBe('OVERDUE');
    expect(result.isOverdue).toBe(true);
  });

  it('evaluates rule as CRITICAL when overdue exceeds critical threshold', () => {
    const rule = {
      conditionType: 'MILEAGE_ONLY',
      criticalOverdueKm: 200,
      nextDueKm: 50000,
    };
    // Current km is 50,300 (exceeds target by 300 km, critical threshold is 200 km)
    const currentKm = 50300;

    const result = MaintenanceService.evaluateRuleStatus(rule, currentKm, new Date());

    expect(result.status).toBe('CRITICAL');
    expect(result.isOverdue).toBe(true);
  });

  it('evaluates DATE_AND_MILEAGE rule: does not trigger overdue until BOTH date and mileage exceed limits', () => {
    const rule = {
      conditionType: 'DATE_AND_MILEAGE',
      warningDaysBefore: 15,
      warningKmBefore: 300,
      nextDueDate: new Date('2025-06-01'),
      nextDueKm: 60000,
    };

    // Date is past due, but mileage is only 52,000 (not reached)
    const currentDate = new Date('2025-06-15');
    const currentKm = 52000;

    const result = MaintenanceService.evaluateRuleStatus(rule, currentKm, currentDate);

    // Because it's DATE_AND_MILEAGE, it shouldn't be OVERDUE yet since mileage hasn't reached target!
    expect(result.isOverdue).toBe(false);
  });
});

