import app from './app.js';
import { config } from './config/index.js';
import prisma from './prisma.js';
import { initCronJobs } from './cron/scheduler.js';

const startServer = async () => {
  try {
    // Attempt DB connection check
    try {
      await prisma.$connect();
      console.log('✅ [DATABASE] Connected to MySQL successfully via Prisma.');
    } catch (dbErr) {
      console.warn('⚠️ [DATABASE] MySQL connection not established yet:', dbErr.message);
      console.warn('ℹ️ Ensure DATABASE_URL is configured with your Aiven or MySQL credentials.');
    }

    // Initialize background cron schedules
    initCronJobs();

    app.listen(config.port, () => {
      console.log(`🚀 [SERVER] FleetGuard Pro API running on http://localhost:${config.port}`);
      console.log(`📡 [HEALTH] Healthcheck: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

