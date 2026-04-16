/* ════════════════════════════════════════════
   dashboard.js — Main dashboard
   Tabs: Meter Entry | Results & Payment
   ════════════════════════════════════════════ */

const Dashboard = {
  appData: null,
  readings: {},       // { unitName: { prev, curr } }
  mainMeter: { prev: '', curr: '' },
  results: null,
  payments: {},
  activeTab: 'entry',

  // ── Entry point ──────────────────────────────
  render(container, appData) {
    this.appData  = appData;
    this.readings = {};
    this.mainMeter = { prev: '', curr: '' };
    this.results  = null;
    this.payments = appData.payments || {};
    this.activeTab = 'entry';

    container.innerHTML = `<div class="page-wrap" id="dashWrap"></div>`;
    this.updateTopbar();
    this.renderDash();
  },

  updateTopbar() {
    const el = document.getElementById('topbarRight');
    el.innerHTML = `
      <span class="prop-name-tag">${this.appData.settings.propertyName}</span>
      <button class="btn btn-ghost" id="resetBtn" style="font-size:12px;padding:6px 14px">Reset Setup</button>
    `;
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset all setup data and start over?')) {
        Storage.clear();
        App.init();
      }
    });
  },

  renderDash() {
    const wrap = document.getElementById('dashWrap');
    const sym  = this.appData.settings.currency;
    const units = this.appData.units;

    // Stats (show only if results exist)
    let statsHtml = '';
    if (this.results) {
      const billed = Calc.totalBilled(this.results);
      const paid   = Calc.totalPaid(this.results, this.payments);
      const usage  = Calc.totalUsage(this.results);
      statsHtml = `
        <div class="stat-grid">
          <div class="stat-card blue">
            <div class="stat-label">Total Billed</div>
            <div class="stat-value blue">${Calc.formatCurrency(sym, billed)}</div>
            <div class="stat-sub">${this.results.length} units</div>
          </div>
          <div class="stat-card green">
            <div class="stat-label">Total Paid</div>
            <div class="stat-value green">${Calc.formatCurrency(sym, paid)}</div>
            <div class="stat-sub">${this.results.filter(r => this.payments[r.unitName] === 'paid').length} units cleared</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-label">Total Usage</div>
            <div class="stat-value amber">${parseFloat(usage.toFixed(1)).toLocaleString()}</div>
            <div class="stat-sub">cubic metres (m³)</div>
          </div>
        </div>
      `;
    }

    // Nav tabs
    const tabsHtml = `
      <div class="nav-tabs">
        <button class="nav-tab ${this.activeTab === 'entry' ? 'active' : ''}" id="tabEntry">Meter Entry</button>
        ${this.results ? `<button class="nav-tab ${this.activeTab === 'results' ? 'active' : ''}" id="tabResults">Results & Payment</button>` : ''}
      </div>
    `;

    wrap.innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:1rem">
        <div>
          <h1 class="page-title">${this.appData.settings.propertyName}</h1>
          <p class="page-subtitle">${units.length} units &middot; ${units.filter(u=>u.hasMeter).length} metered &middot; ${this.appData.settings.currency}</p>
        </div>
      </div>
      ${statsHtml}
      ${tabsHtml}
      <div id="tabContent"></div>
    `;

    // Tab events
    document.getElementById('tabEntry')?.addEventListener('click', () => {
      this.activeTab = 'entry';
      this.renderDash();
    });
    document.getElementById('tabResults')?.addEventListener('click', () => {
      this.activeTab = 'results';
      this.renderDash();
    });

    // Tab content
    if (this.activeTab === 'entry') this.renderMeterEntry();
    if (this.activeTab === 'results' && this.results) this.renderResults();
  },

  // ══════════════════════════════════════════════
  // METER ENTRY TAB
  // ══════════════════════════════════════════════
  renderMeterEntry() {
    const content = document.getElementById('tabContent');
    const { settings, units } = this.appData;

    let mainMeterHtml = '';
    if (settings.hasMainMeter) {
      const prevVal = this.mainMeter.prev;
      const currVal = this.mainMeter.curr;
      const diff = (prevVal !== '' && currVal !== '') ? (parseFloat(currVal) - parseFloat(prevVal)) : null;
      mainMeterHtml = `
        <div class="main-meter-panel">
          <div class="main-meter-header">
            <div class="main-meter-icon">🔵</div>
            Main / Master Meter
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Previous Reading (m³)</label>
              <input type="number" id="mainPrev" value="${prevVal}" placeholder="e.g. 1200" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label class="field-label">Current Reading (m³)</label>
              <input type="number" id="mainCurr" value="${currVal}" placeholder="e.g. 1350" min="0" step="0.01" />
            </div>
          </div>
          ${diff !== null && diff >= 0 ? `<div class="main-meter-total">↳ Total consumption this period: <strong>${diff.toFixed(1)} m³</strong></div>` : ''}
        </div>
      `;
    }

    // Unit meter cards
    const cardsHtml = units.map(u => {
      const r = this.readings[u.unitName] || { prev: '', curr: '' };
      const usagePrev = parseFloat(r.prev);
      const usageCurr = parseFloat(r.curr);
      const hasPreview = !isNaN(usagePrev) && !isNaN(usageCurr) && r.prev !== '' && r.curr !== '';
      const usageVal = hasPreview ? (usageCurr - usagePrev).toFixed(1) : null;

      return `
        <div class="meter-card">
          <div class="meter-card-header">
            <div>
              <div class="meter-unit-name">${u.unitName}</div>
              <div class="meter-tenant">${u.tenantName}</div>
            </div>
            <span class="badge ${u.hasMeter ? 'badge-blue' : 'badge-amber'}">${u.hasMeter ? '📡 Metered' : '⚠ No Meter'}</span>
          </div>
          ${u.hasMeter && u.meterNumber && u.meterNumber !== 'MISSING_METER' ? `<div class="meter-number">Meter #: ${u.meterNumber}</div>` : ''}
          ${u.hasMeter ? `
            <div class="form-group">
              <label class="field-label">Previous Reading (m³)</label>
              <input type="number" class="reading-inp" data-unit="${u.unitName}" data-field="prev" value="${r.prev}" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label class="field-label">Current Reading (m³)</label>
              <input type="number" class="reading-inp" data-unit="${u.unitName}" data-field="curr" value="${r.curr}" placeholder="0.00" min="0" step="0.01" />
            </div>
            ${usageVal !== null ? `<div class="usage-preview">Usage: ${usageVal} m³</div>` : ''}
          ` : `
            <div class="auto-calculated">
              <span class="auto-calculated-label">AUTO CALCULATED</span>
              <span class="auto-calculated-sub">Usage derived from main meter</span>
            </div>
          `}
        </div>
      `;
    }).join('');

    content.innerHTML = `
      ${mainMeterHtml}
      <div class="meter-grid" id="meterGrid">
        ${cardsHtml}
      </div>
      <div id="calcError"></div>
      <div class="calc-action">
        <button class="btn btn-primary btn-lg" id="calcBtn">⚡ Calculate Bills</button>
      </div>
    `;

    // Main meter live update
    if (settings.hasMainMeter) {
      const update = () => {
        this.mainMeter.prev = document.getElementById('mainPrev').value;
        this.mainMeter.curr = document.getElementById('mainCurr').value;
        // Live diff display
        const prev = parseFloat(this.mainMeter.prev);
        const curr = parseFloat(this.mainMeter.curr);
        let totalEl = content.querySelector('.main-meter-total');
        if (!totalEl) {
          const panel = content.querySelector('.main-meter-panel');
          totalEl = document.createElement('div');
          totalEl.className = 'main-meter-total';
          panel.appendChild(totalEl);
        }
        if (!isNaN(prev) && !isNaN(curr) && curr >= prev) {
          totalEl.textContent = `↳ Total consumption this period: ${(curr - prev).toFixed(1)} m³`;
        } else {
          totalEl.textContent = '';
        }
      };
      document.getElementById('mainPrev').addEventListener('input', update);
      document.getElementById('mainCurr').addEventListener('input', update);
    }

    // Reading inputs
    content.querySelectorAll('.reading-inp').forEach(inp => {
      inp.addEventListener('input', e => {
        const unit  = e.target.dataset.unit;
        const field = e.target.dataset.field;
        if (!this.readings[unit]) this.readings[unit] = { prev: '', curr: '' };
        this.readings[unit][field] = e.target.value;

        // Live usage preview
        const r = this.readings[unit];
        const prev = parseFloat(r.prev);
        const curr = parseFloat(r.curr);
        const card = e.target.closest('.meter-card');
        let prevEl = card.querySelector('.usage-preview');
        if (!isNaN(prev) && !isNaN(curr) && r.prev !== '' && r.curr !== '') {
          if (!prevEl) {
            prevEl = document.createElement('div');
            prevEl.className = 'usage-preview';
            e.target.closest('.form-group').after(prevEl);
          }
          prevEl.textContent = `Usage: ${(curr - prev).toFixed(1)} m³`;
        } else if (prevEl) {
          prevEl.textContent = '';
        }
      });
    });

    // Calculate button
    document.getElementById('calcBtn').addEventListener('click', () => this.doCalculate());
  },

  // ══════════════════════════════════════════════
  // CALCULATION
  // ══════════════════════════════════════════════
  doCalculate() {
    const errEl = document.getElementById('calcError');
    errEl.innerHTML = '';

    const mainMeter = this.appData.settings.hasMainMeter ? this.mainMeter : null;
    const { results, error } = Calc.calculate(
      this.appData.units,
      this.readings,
      mainMeter,
      this.appData.settings
    );

    if (error) {
      errEl.innerHTML = `<div class="info-box error" style="margin-bottom:1rem"><span>⚠️</span><span>${error.replace(/\n/g,'<br>')}</span></div>`;
      return;
    }

    this.results = results;
    this.payments = {};
    this.appData.payments = {};
    Storage.save({ ...this.appData, payments: {} });

    Toast.show('Bills calculated successfully!', 'success');
    this.activeTab = 'results';
    this.renderDash();
  },

  // ══════════════════════════════════════════════
  // RESULTS TAB
  // ══════════════════════════════════════════════
  renderResults() {
    const content = document.getElementById('tabContent');
    const { settings } = this.appData;
    const sym = settings.currency;

    const rows = this.results.map(r => {
      const status = this.payments[r.unitName];
      const isPaid  = status === 'paid';
      const isProc  = status === 'processing';

      let actionBtn;
      if (isPaid) {
        actionBtn = `<span class="btn-paid">✓ Paid</span>`;
      } else if (isProc) {
        actionBtn = `<span class="btn-processing"><span class="spinner"></span> Processing</span>`;
      } else {
        actionBtn = `<button class="btn btn-success btn-pay" data-unit="${r.unitName}">PAY</button>`;
      }

      let statusBadge;
      if (isPaid)  statusBadge = `<span class="badge badge-green">✓ PAID</span>`;
      else if (isProc) statusBadge = `<span class="badge badge-amber">PROCESSING</span>`;
      else statusBadge = `<span class="badge badge-red">UNPAID</span>`;

      return `
        <tr class="${isPaid ? 'paid-row' : ''}">
          <td>
            <span class="td-unit-name">${r.unitName}</span>
            ${!r.hasMeter ? `<span class="badge badge-amber" style="margin-left:6px">auto</span>` : ''}
          </td>
          <td>${r.tenantName}</td>
          <td style="font-variant-numeric:tabular-nums">${r.usage.toFixed(1)}</td>
          <td><span class="td-amount">${Calc.formatCurrency(sym, r.bill)}</span></td>
          <td>${statusBadge}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');

    const billed = Calc.totalBilled(this.results);
    const paid   = Calc.totalPaid(this.results, this.payments);
    const outstanding = billed - paid;

    content.innerHTML = `
      <div class="results-card">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Tenant</th>
                <th>Usage (m³)</th>
                <th>Bill (${sym})</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="resultsBody">
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
      <div class="results-footer">
        <div class="outstanding-box">
          <div class="outstanding-label">Outstanding Balance</div>
          <div class="outstanding-val">${Calc.formatCurrency(sym, outstanding)}</div>
        </div>
        <button class="btn btn-ghost" id="backToEntry">← New Readings</button>
      </div>
    `;

    // Pay buttons
    content.querySelectorAll('.btn-pay').forEach(btn => {
      btn.addEventListener('click', e => this.simulatePay(e.target.dataset.unit));
    });

    document.getElementById('backToEntry').addEventListener('click', () => {
      this.activeTab = 'entry';
      this.renderDash();
    });
  },

  // ══════════════════════════════════════════════
  // PAYMENT SIMULATION
  // ══════════════════════════════════════════════
  simulatePay(unitName) {
    this.payments[unitName] = 'processing';
    this.renderResults();

    setTimeout(() => {
      this.payments[unitName] = 'paid';
      this.appData.payments = { ...this.appData.payments, [unitName]: 'paid' };
      Storage.save(this.appData);
      Toast.show(`Payment successful for ${unitName}! ✓`, 'success');
      this.renderDash(); // refresh stats + table
    }, 1200);
  }
};
