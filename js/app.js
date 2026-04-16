/* ════════════════════════════════════════════
   app.js — Entry point & Toast utility
   ════════════════════════════════════════════ */

// ── Toast Notifications ──────────────────────
const Toast = {
  _timer: null,
  show(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast${type ? ' toast-' + type : ''} show`;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      el.classList.remove('show');
    }, 3200);
  }
};

// ── App Controller ───────────────────────────
const App = {
  init() {
    const data = Storage.load();
    const appEl = document.getElementById('app');

    if (!data || !data.isSetupComplete) {
      // Show setup wizard
      document.getElementById('topbarRight').innerHTML = '';
      Wizard.render(appEl, (completedData) => {
        App.showDashboard(completedData);
      });
    } else {
      App.showDashboard(data);
    }
  },

  showDashboard(data) {
    const appEl = document.getElementById('app');
    Dashboard.render(appEl, data);
  }
};

// ── Boot ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
