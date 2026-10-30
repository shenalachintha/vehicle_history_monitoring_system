import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/system-settings.json');

const defaultSettings = {
  companyName: 'El-Toro Roofing Products Ltd.',
  timezone: 'Asia/Colombo (GMT+05:30)',
  currency: 'LKR',
  distanceUnit: 'km',
  warningDays: 30,
  warningKm: 500,
  criticalDays: 15,
  criticalKm: 200,
  anomalyDistanceLimit: 3000,
  weeklyAuditDay: 'Monday',
  emailNotifications: true,
};

// Helper to ensure data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const getSystemSettings = () => {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error reading settings file, using defaults:', error);
  }
  return defaultSettings;
};

export class SettingsController {
  static async get(req, res, next) {
    try {
      const settings = getSystemSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const current = getSystemSettings();
      const updated = {
        ...current,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      ensureDataDir();
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');

      res.json({
        success: true,
        message: 'Settings updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

