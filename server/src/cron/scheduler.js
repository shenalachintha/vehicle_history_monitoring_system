import cron from 'node-cron';
import { AlertService } from '../services/alert.service.js';

export const initCronJobs = () => {
  // Daily maintenance & document expiry check at 06:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Running daily fleet maintenance & document expiry audit...');
    try {
      const alerts = await AlertService.evaluateFleetAlerts();
      console.log(`[CRON] Daily audit complete. Evaluated/created ${alerts.length} alerts.`);
    } catch (err) {
      console.error('[CRON ERROR] Daily audit failed:', err);
    }
  });

  // Monday morning weekly mileage audit at 08:00 AM
  cron.schedule('0 8 * * 1', async () => {
    console.log('[CRON] Running weekly mileage audit for company vehicles...');
    try {
      const alerts = await AlertService.evaluateFleetAlerts();
      console.log(`[CRON] Weekly mileage audit complete. Generated ${alerts.length} alerts.`);
    } catch (err) {
      console.error('[CRON ERROR] Weekly mileage audit failed:', err);
    }
  });

  console.log('[CRON] Scheduled fleet monitoring jobs initialized successfully.');
};

