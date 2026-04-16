/* ════════════════════════════════════════════
   wizard.js — Progressive Setup Wizard
   All 5 steps, append-only (never clears prev)
   ════════════════════════════════════════════ */

const CURRENCY_MAP = {
  'Kenya':        { symbol: 'KSh', code: 'KES' },
  'Nigeria':      { symbol: '₦',   code: 'NGN' },
  'Ghana':        { symbol: 'GH₵', code: 'GHS' },
  'South Africa': { symbol: 'R',   code: 'ZAR' },
  'Uganda':       { symbol: 'USh', code: 'UGX' },
  'Tanzania':     { symbol: 'TSh', code: 'TZS' },
  'Ethiopia':     { symbol: 'Br',  code: 'ETB' },
  'Rwanda':       { symbol: 'RF',  code: 'RWF' },
  'United States':{ symbol: '$',   code: 'USD' },
  'United Kingdom':{ symbol: '£',  code: 'GBP' },
  'India':        { symbol: '₹',   code: 'INR' },
  'Other':        { symbol: '$',   code: 'USD' }
};

const COUNTRIES = Object.keys(CURRENCY_MAP);

const Wizard = {
  // In-progress state
  state: {
    propertyName: '',
    country: 'Kenya',
    currency: 'KSh',
    hasBlocks: null,
    blockNames: [''],
    numberOfUnits: 4,
    units: [],
    costPerUnit: '',
    serviceCharge: '0',
    billingType: 'meter',
    hasMainMeter: null
  },

  completedSteps: [],   // [1, 2, 3 ...]
  currentStep: 1,
  onComplete: null,

  // ── Entry point ──────────────────────────────
  render(container, onComplete) {
    this.onComplete = onComplete;
    this.completedSteps = [];
    this.currentStep = 1;
    this.state = {
      propertyName: '', country: 'Kenya', currency: 'KSh',
      hasBlocks: null, blockNames: [''], numberOfUnits: 4,
      units: [], costPerUnit: '', serviceCharge: '0',
      billingType: 'meter', hasMainMeter: null
    };

    container.innerHTML = `
      <div class="page-wrap">
        <div class="page-header">
          <h1 class="page-title">Property Setup</h1>
          <p class="page-subtitle">Configure your property once. This takes about 2 minutes.</p>
        </div>
        <div id="wizardProgress" class="wizard-progress"></div>
        <div id="wizardSteps"></div>
      </div>
    `;

    this.updateProgress();
    this.renderStep1();
  },

  // ── Progress bar ─────────────────────────────
  updateProgress() {
    const el = document.getElementById('wizardProgress');
    if (!el) return;
    const total = 5;
    let html = '';
    for (let i = 1; i <= total; i++) {
      const done   = this.completedSteps.includes(i);
      const active = this.currentStep === i && !done;
      html += `<div class="progress-dot ${done ? 'done' : active ? 'active' : ''}"></div>`;
      if (i < total) html += `<div class="progress-line"></div>`;
    }
    el.innerHTML = html;
  },

  // ── Append a new step card ────────────────────
  appendStep(id, html) {
    const container = document.getElementById('wizardSteps');
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // ── Replace a step card with its locked summary ──
  lockStep(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  },

  // ══════════════════════════════════════════════
  // STEP 1 — Property Info
  // ══════════════════════════════════════════════
  renderStep1() {
    const countryOptions = COUNTRIES.map(c =>
      `<option value="${c}">${c}</option>`
    ).join('');

    this.appendStep('wizStep1', `
      <div class="wizard-step">
        <div class="step-badge">Step 1 of 5</div>
        <div class="step-title">Property Information</div>
        <div class="step-subtitle">Basic details about your property</div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Property Name</label>
            <input type="text" id="s1_propName" placeholder="e.g. Sunrise Apartments" value="${this.state.propertyName}" />
          </div>
          <div class="form-group">
            <label class="field-label">Country</label>
            <select id="s1_country">${countryOptions}</select>
          </div>
        </div>
        <div class="form-group" style="max-width:260px">
          <label class="field-label">Currency Symbol (auto-filled, editable)</label>
          <input type="text" id="s1_currency" value="${this.state.currency}" placeholder="KSh" />
        </div>
        <button class="btn btn-primary" id="s1_next">Next →</button>
      </div>
    `);

    // Auto-fill currency on country change
    document.getElementById('s1_country').addEventListener('change', e => {
      const sym = CURRENCY_MAP[e.target.value]?.symbol || '$';
      document.getElementById('s1_currency').value = sym;
    });

    document.getElementById('s1_next').addEventListener('click', () => {
      const name = document.getElementById('s1_propName').value.trim();
      const country = document.getElementById('s1_country').value;
      const currency = document.getElementById('s1_currency').value.trim();

      if (!name) return Toast.show('Please enter a property name', 'error');
      if (!currency) return Toast.show('Please enter a currency symbol', 'error');

      this.state.propertyName = name;
      this.state.country      = country;
      this.state.currency     = currency;

      this.lockStep('wizStep1', `
        <div class="wizard-step">
          <div class="step-badge">✓ Step 1 — Property Information</div>
          <div class="summary-block">
            <div class="summary-item"><span class="summary-label">Property</span><span class="summary-value">${name}</span></div>
            <div class="summary-item"><span class="summary-label">Country</span><span class="summary-value">${country}</span></div>
            <div class="summary-item"><span class="summary-label">Currency</span><span class="summary-value">${currency}</span></div>
          </div>
        </div>
      `);

      this.completedSteps.push(1);
      this.currentStep = 2;
      this.updateProgress();
      this.renderStep2();
    });
  },

  // ══════════════════════════════════════════════
  // STEP 2 — Structure
  // ══════════════════════════════════════════════
  renderStep2() {
    this.appendStep('wizStep2', `
      <div class="wizard-step">
        <div class="step-badge">Step 2 of 5</div>
        <div class="step-title">Property Structure</div>
        <div class="step-subtitle">How is your property organized?</div>
        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">Do you have named blocks or sections?</p>
        <div class="toggle-group" id="s2_toggles">
          <button class="toggle-btn" data-val="yes" id="s2_yes">Yes, I have blocks</button>
          <button class="toggle-btn" data-val="no"  id="s2_no">No, just units</button>
        </div>
        <div id="s2_extra"></div>
        <button class="btn btn-primary" id="s2_next" disabled>Next →</button>
      </div>
    `);

    document.getElementById('s2_yes').addEventListener('click', () => {
      this.state.hasBlocks = true;
      document.getElementById('s2_yes').classList.add('active');
      document.getElementById('s2_no').classList.remove('active');
      this.renderBlockInputs();
    });

    document.getElementById('s2_no').addEventListener('click', () => {
      this.state.hasBlocks = false;
      document.getElementById('s2_no').classList.add('active');
      document.getElementById('s2_yes').classList.remove('active');
      this.renderUnitCountInput();
    });
  },

  renderBlockInputs() {
    const el = document.getElementById('s2_extra');
    el.innerHTML = `
      <div style="margin-bottom:1rem">
        <label class="field-label" style="display:block;margin-bottom:8px">Block Names</label>
        <div id="blockInputsList"></div>
        <button class="add-block-btn" id="addBlockBtn">+ Add another block</button>
      </div>
    `;
    this.state.blockNames = [''];
    this.refreshBlockInputs();

    document.getElementById('addBlockBtn').addEventListener('click', () => {
      this.state.blockNames.push('');
      this.refreshBlockInputs();
    });

    document.getElementById('s2_next').disabled = false;
    document.getElementById('s2_next').addEventListener('click', () => this.finishStep2());
  },

  refreshBlockInputs() {
    const list = document.getElementById('blockInputsList');
    list.innerHTML = '';
    this.state.blockNames.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'block-input-row';
      row.innerHTML = `
        <input type="text" placeholder="e.g. Block A, Wing 1" value="${name}" data-idx="${i}" class="block-name-inp" />
        ${this.state.blockNames.length > 1 ? `<button class="btn btn-danger-ghost remove-block" data-idx="${i}">✕</button>` : ''}
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('.block-name-inp').forEach(inp => {
      inp.addEventListener('input', e => {
        this.state.blockNames[parseInt(e.target.dataset.idx)] = e.target.value;
      });
    });

    list.querySelectorAll('.remove-block').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        this.state.blockNames.splice(idx, 1);
        this.refreshBlockInputs();
      });
    });
  },

  renderUnitCountInput() {
    const el = document.getElementById('s2_extra');
    el.innerHTML = `
      <div class="form-group" style="max-width:200px">
        <label class="field-label">Number of Units</label>
        <input type="number" id="s2_unitCount" value="${this.state.numberOfUnits}" min="1" max="100" />
      </div>
    `;
    document.getElementById('s2_unitCount').addEventListener('input', e => {
      this.state.numberOfUnits = parseInt(e.target.value) || 1;
    });

    document.getElementById('s2_next').disabled = false;
    document.getElementById('s2_next').addEventListener('click', () => this.finishStep2());
  },

  finishStep2() {
    let count, display;
    if (this.state.hasBlocks) {
      const names = this.state.blockNames.filter(b => b.trim());
      if (!names.length) return Toast.show('Add at least one block name', 'error');
      this.state.blockNames = names;
      count = names.length;
      display = `${count} block${count > 1 ? 's' : ''}`;
    } else {
      const n = parseInt(this.state.numberOfUnits);
      if (!n || n < 1) return Toast.show('Enter a valid number of units', 'error');
      this.state.numberOfUnits = n;
      count = n;
      display = `${count} unit${count > 1 ? 's' : ''}`;
    }

    // Build initial unit list for step 3
    this.state.units = [];
    if (this.state.hasBlocks) {
      this.state.blockNames.forEach(b => {
        this.state.units.push({ id: Math.random().toString(36).slice(2,8), unitName: b, tenantName: '', hasMeter: true, meterNumber: '' });
      });
    } else {
      for (let i = 1; i <= this.state.numberOfUnits; i++) {
        this.state.units.push({ id: Math.random().toString(36).slice(2,8), unitName: `Unit ${i}`, tenantName: '', hasMeter: true, meterNumber: '' });
      }
    }

    this.lockStep('wizStep2', `
      <div class="wizard-step">
        <div class="step-badge">✓ Step 2 — Property Structure</div>
        <div class="summary-block">
          <div class="summary-item"><span class="summary-label">Structure</span><span class="summary-value">${this.state.hasBlocks ? 'Has Blocks' : 'Direct Units'}</span></div>
          <div class="summary-item"><span class="summary-label">Count</span><span class="summary-value">${display}</span></div>
        </div>
      </div>
    `);

    this.completedSteps.push(2);
    this.currentStep = 3;
    this.updateProgress();
    this.renderStep3();
  },

  // ══════════════════════════════════════════════
  // STEP 3 — Units Setup
  // ══════════════════════════════════════════════
  renderStep3() {
    this.appendStep('wizStep3', `
      <div class="wizard-step">
        <div class="step-badge">Step 3 of 5</div>
        <div class="step-title">Unit Details</div>
        <div class="step-subtitle">Enter tenant info and meter status for each unit</div>
        <div id="s3_unitsList"></div>
        <button class="btn btn-primary" id="s3_next">Next →</button>
      </div>
    `);

    this.renderUnitsForm();

    document.getElementById('s3_next').addEventListener('click', () => {
      // Collect current values
      const list = document.getElementById('s3_unitsList');
      const cards = list.querySelectorAll('.unit-card');
      let valid = true;

      this.state.units.forEach((u, i) => {
        const card = cards[i];
        u.unitName   = card.querySelector('.s3_unitName').value.trim();
        u.tenantName = card.querySelector('.s3_tenantName').value.trim();
        u.meterNumber = u.hasMeter ? (card.querySelector('.s3_meterNum')?.value.trim() || '') : 'MISSING_METER';

        if (!u.unitName)   { valid = false; Toast.show(`Unit ${i+1}: unit name is required`, 'error'); }
        if (!u.tenantName) { valid = false; Toast.show(`${u.unitName || 'Unit ' + (i+1)}: tenant name is required`, 'error'); }
      });

      if (!valid) return;

      const metered   = this.state.units.filter(u => u.hasMeter).length;
      const noMeter   = this.state.units.filter(u => !u.hasMeter).length;

      this.lockStep('wizStep3', `
        <div class="wizard-step">
          <div class="step-badge">✓ Step 3 — Unit Details</div>
          <div class="summary-block">
            <div class="summary-item"><span class="summary-label">Total Units</span><span class="summary-value">${this.state.units.length}</span></div>
            <div class="summary-item"><span class="summary-label">With Meters</span><span class="summary-value">${metered}</span></div>
            <div class="summary-item"><span class="summary-label">No Meter</span><span class="summary-value">${noMeter}</span></div>
          </div>
        </div>
      `);

      this.completedSteps.push(3);
      this.currentStep = 4;
      this.updateProgress();
      this.renderStep4();
    });
  },

  renderUnitsForm() {
    const list = document.getElementById('s3_unitsList');
    list.innerHTML = '';

    this.state.units.forEach((u, idx) => {
      const card = document.createElement('div');
      card.className = 'unit-card';
      card.dataset.uid = u.id;
      card.innerHTML = `
        <div class="unit-card-header">
          <span class="unit-card-title">Unit ${idx + 1}</span>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="badge ${u.hasMeter ? 'badge-blue' : 'badge-amber'}" id="meterBadge_${u.id}">
              ${u.hasMeter ? '📡 Metered' : '⚠ No Meter'}
            </span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Unit Name</label>
            <input class="s3_unitName" type="text" value="${u.unitName}" placeholder="e.g. A1, Flat 3B" />
          </div>
          <div class="form-group">
            <label class="field-label">Tenant Name</label>
            <input class="s3_tenantName" type="text" value="${u.tenantName}" placeholder="Full name" />
          </div>
        </div>
        <div style="margin-bottom:10px">
          <label class="field-label" style="display:block;margin-bottom:8px">Has Water Meter?</label>
          <div class="toggle-group">
            <button class="toggle-btn ${u.hasMeter ? 'active' : ''} meterYes" data-uid="${u.id}">Yes</button>
            <button class="toggle-btn ${!u.hasMeter ? 'active' : ''} meterNo"  data-uid="${u.id}">No Meter</button>
          </div>
        </div>
        <div class="s3_meterNumWrap" ${!u.hasMeter ? 'style="display:none"' : ''}>
          <div class="form-group">
            <label class="field-label">Meter Number</label>
            <input class="s3_meterNum" type="text" value="${u.meterNumber !== 'MISSING_METER' ? u.meterNumber : ''}" placeholder="e.g. MTR-00123" />
          </div>
        </div>
        <div class="s3_noMeterWrap" ${u.hasMeter ? 'style="display:none"' : ''}>
          <div class="info-box warn">
            <span>⚠️</span>
            <span>This unit is marked <strong>MISSING_METER</strong>. Usage will be auto-calculated from the main meter.</span>
          </div>
        </div>
      `;
      list.appendChild(card);

      card.querySelector('.meterYes').addEventListener('click', () => {
        u.hasMeter = true;
        card.querySelector('.meterYes').classList.add('active');
        card.querySelector('.meterNo').classList.remove('active');
        card.querySelector('.s3_meterNumWrap').style.display = '';
        card.querySelector('.s3_noMeterWrap').style.display = 'none';
        const badge = document.getElementById('meterBadge_' + u.id);
        badge.className = 'badge badge-blue';
        badge.textContent = '📡 Metered';
      });

      card.querySelector('.meterNo').addEventListener('click', () => {
        u.hasMeter = false;
        card.querySelector('.meterNo').classList.add('active');
        card.querySelector('.meterYes').classList.remove('active');
        card.querySelector('.s3_meterNumWrap').style.display = 'none';
        card.querySelector('.s3_noMeterWrap').style.display = '';
        const badge = document.getElementById('meterBadge_' + u.id);
        badge.className = 'badge badge-amber';
        badge.textContent = '⚠ No Meter';
      });
    });
  },

  // ══════════════════════════════════════════════
  // STEP 4 — Billing Rules
  // ══════════════════════════════════════════════
  renderStep4() {
    const sym = this.state.currency;
    this.appendStep('wizStep4', `
      <div class="wizard-step">
        <div class="step-badge">Step 4 of 5</div>
        <div class="step-title">Billing Rules</div>
        <div class="step-subtitle">Set pricing and billing method</div>
        <div class="form-row">
          <div class="form-group">
            <label class="field-label">Cost per m³ (${sym})</label>
            <input type="number" id="s4_costPerUnit" value="${this.state.costPerUnit}" placeholder="e.g. 80" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label class="field-label">Service Charge (${sym}, optional)</label>
            <input type="number" id="s4_serviceCharge" value="${this.state.serviceCharge}" placeholder="0" min="0" step="0.01" />
          </div>
        </div>
        <div style="margin-bottom:1rem">
          <label class="field-label" style="display:block;margin-bottom:8px">Billing Type</label>
          <div class="toggle-group">
            <button class="toggle-btn ${this.state.billingType === 'meter' ? 'active' : ''}" id="s4_meter">Meter Based</button>
            <button class="toggle-btn ${this.state.billingType === 'shared' ? 'active' : ''}" id="s4_shared">Shared / Flat</button>
          </div>
        </div>
        <button class="btn btn-primary" id="s4_next">Next →</button>
      </div>
    `);

    document.getElementById('s4_meter').addEventListener('click', () => {
      this.state.billingType = 'meter';
      document.getElementById('s4_meter').classList.add('active');
      document.getElementById('s4_shared').classList.remove('active');
    });

    document.getElementById('s4_shared').addEventListener('click', () => {
      this.state.billingType = 'shared';
      document.getElementById('s4_shared').classList.add('active');
      document.getElementById('s4_meter').classList.remove('active');
    });

    document.getElementById('s4_next').addEventListener('click', () => {
      const cost = parseFloat(document.getElementById('s4_costPerUnit').value);
      const svc  = parseFloat(document.getElementById('s4_serviceCharge').value) || 0;

      if (!cost || cost <= 0) return Toast.show('Enter a valid cost per m³', 'error');

      this.state.costPerUnit    = cost;
      this.state.serviceCharge  = svc;

      this.lockStep('wizStep4', `
        <div class="wizard-step">
          <div class="step-badge">✓ Step 4 — Billing Rules</div>
          <div class="summary-block">
            <div class="summary-item"><span class="summary-label">Cost/m³</span><span class="summary-value">${sym}${cost}</span></div>
            <div class="summary-item"><span class="summary-label">Service Charge</span><span class="summary-value">${sym}${svc}</span></div>
            <div class="summary-item"><span class="summary-label">Billing Type</span><span class="summary-value">${this.state.billingType}</span></div>
          </div>
        </div>
      `);

      this.completedSteps.push(4);
      this.currentStep = 5;
      this.updateProgress();
      this.renderStep5();
    });
  },

  // ══════════════════════════════════════════════
  // STEP 5 — Main Meter
  // ══════════════════════════════════════════════
  renderStep5() {
    const noMeterUnits = this.state.units.filter(u => !u.hasMeter);

    this.appendStep('wizStep5', `
      <div class="wizard-step">
        <div class="step-badge">Step 5 of 5</div>
        <div class="step-title">Main / Master Meter</div>
        <div class="step-subtitle">Does your property have a main meter?</div>
        <div class="toggle-group">
          <button class="toggle-btn" id="s5_yes">Yes, has main meter</button>
          <button class="toggle-btn" id="s5_no">No main meter</button>
        </div>
        <div id="s5_info"></div>
        <button class="btn btn-primary btn-lg btn-complete" id="s5_finish" disabled>✓ Complete Setup</button>
      </div>
    `);

    const showInfo = () => {
      const el = document.getElementById('s5_info');
      if (this.state.hasMainMeter) {
        el.innerHTML = `<div class="info-box success"><span>✅</span><span>Units without meters will use: <strong>Main Total Usage − Sum of metered units</strong>.</span></div>`;
      } else if (noMeterUnits.length > 0) {
        el.innerHTML = `<div class="info-box error"><span>⚠️</span><span>Warning: You have ${noMeterUnits.length} unit(s) without meters but no main meter. Those units cannot be auto-calculated.</span></div>`;
      } else {
        el.innerHTML = '';
      }
    };

    document.getElementById('s5_yes').addEventListener('click', () => {
      this.state.hasMainMeter = true;
      document.getElementById('s5_yes').classList.add('active');
      document.getElementById('s5_no').classList.remove('active');
      document.getElementById('s5_finish').disabled = false;
      showInfo();
    });

    document.getElementById('s5_no').addEventListener('click', () => {
      this.state.hasMainMeter = false;
      document.getElementById('s5_no').classList.add('active');
      document.getElementById('s5_yes').classList.remove('active');
      document.getElementById('s5_finish').disabled = false;
      showInfo();
    });

    document.getElementById('s5_finish').addEventListener('click', () => {
      const data = {
        isSetupComplete: true,
        settings: {
          propertyName:  this.state.propertyName,
          country:       this.state.country,
          currency:      this.state.currency,
          costPerUnit:   this.state.costPerUnit,
          serviceCharge: this.state.serviceCharge,
          billingType:   this.state.billingType,
          hasMainMeter:  this.state.hasMainMeter
        },
        units: this.state.units.map(u => ({
          unitName:   u.unitName,
          tenantName: u.tenantName,
          hasMeter:   u.hasMeter,
          meterNumber: u.hasMeter ? u.meterNumber : 'MISSING_METER'
        })),
        readings: [],
        payments: {}
      };

      Storage.save(data);
      Toast.show('Setup complete! Welcome to AquaBill 🎉', 'success');
      if (this.onComplete) this.onComplete(data);
    });
  }
};
