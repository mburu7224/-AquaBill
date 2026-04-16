/* ════════════════════════════════════════════
   storage.js — localStorage persistence layer
   ════════════════════════════════════════════ */

const STORAGE_KEY = 'aquabill_v1';

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('AquaBill: failed to load data', e);
      return null;
    }
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('AquaBill: failed to save data', e);
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Default empty state
  defaults() {
    return {
      isSetupComplete: false,
      settings: {},
      units: [],
      readings: [],
      payments: {}
    };
  }
};
