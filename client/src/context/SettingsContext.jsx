import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const SETTINGS_KEY = 'fleetguard_settings';

export const defaultSettings = {
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

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    return defaultSettings;
  });

  // Sync with backend on startup
  useEffect(() => {
    let isMounted = true;
    api.get('/settings')
      .then((res) => {
        if (isMounted && res.data?.data) {
          const merged = { ...defaultSettings, ...res.data.data };
          setSettings(merged);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => {
        // Fallback to local storage if API is offline
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));

    try {
      await api.put('/settings', merged);
    } catch (error) {
      console.warn('Backend sync failed, stored locally:', error.message);
    }
    return merged;
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'LKR':
        return 'Rs.';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'USD':
      default:
        return '$';
    }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    const symbol = getCurrencySymbol();
    const formattedNum = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (settings.currency === 'LKR') {
      return `Rs. ${formattedNum}`;
    }
    return `${symbol}${formattedNum}`;
  };

  const formatDistance = (km) => {
    const num = Number(km || 0);
    if (settings.distanceUnit === 'miles') {
      const miles = Math.round(num * 0.621371);
      return `${miles.toLocaleString()} mi`;
    }
    return `${num.toLocaleString()} km`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        formatCurrency,
        formatDistance,
        currencySymbol: getCurrencySymbol(),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

