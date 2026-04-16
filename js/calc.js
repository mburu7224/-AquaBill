/* ════════════════════════════════════════════
   calc.js — Billing calculation engine
   ════════════════════════════════════════════ */

const Calc = {
  /**
   * Main calculation function.
   * @param {Array}  units        - array of unit objects from setup
   * @param {Object} readings     - { unitName: { prev, curr } }
   * @param {Object} mainMeter    - { prev, curr } or null
   * @param {Object} settings     - { costPerUnit, serviceCharge }
   * @returns {{ results: Array, error: string|null }}
   */
  calculate(units, readings, mainMeter, settings) {
    const errors = [];

    // --- STEP 1: Validate metered units ---
    const meteredUnits = units.filter(u => u.hasMeter);
    for (const u of meteredUnits) {
      const r = readings[u.unitName];
      if (!r || r.prev === '' || r.prev == null || r.curr === '' || r.curr == null) {
        errors.push(`Missing readings for: ${u.unitName}`);
        continue;
      }
      const prev = parseFloat(r.prev);
      const curr = parseFloat(r.curr);
      if (isNaN(prev) || isNaN(curr)) {
        errors.push(`Invalid readings for: ${u.unitName}`);
        continue;
      }
      if (curr < prev) {
        errors.push(`Current reading < previous for: ${u.unitName}`);
      }
    }

    if (errors.length) return { results: null, error: errors.join('\n') };

    // --- STEP 2: Compute metered usage ---
    const results = units.map(u => {
      if (u.hasMeter) {
        const prev = parseFloat(readings[u.unitName].prev) || 0;
        const curr = parseFloat(readings[u.unitName].curr) || 0;
        const usage = Math.max(0, curr - prev);
        const bill = (usage * settings.costPerUnit) + (settings.serviceCharge || 0);
        return {
          unitName:   u.unitName,
          tenantName: u.tenantName,
          hasMeter:   true,
          usage,
          bill,
          prev,
          curr
        };
      }
      // Placeholder for no-meter units
      return {
        unitName:   u.unitName,
        tenantName: u.tenantName,
        hasMeter:   false,
        usage:      0,
        bill:       0
      };
    });

    // --- STEP 3: Missing meter logic ---
    const noMeterUnits = units.filter(u => !u.hasMeter);
    if (noMeterUnits.length > 0 && settings.hasMainMeter && mainMeter) {
      const mainPrev = parseFloat(mainMeter.prev);
      const mainCurr = parseFloat(mainMeter.curr);

      if (!isNaN(mainPrev) && !isNaN(mainCurr) && mainCurr >= mainPrev) {
        const totalMainUsage = mainCurr - mainPrev;
        const knownUsage = results
          .filter(r => r.hasMeter)
          .reduce((sum, r) => sum + r.usage, 0);
        const missingUsage = Math.max(0, totalMainUsage - knownUsage);
        const sharePerUnit = noMeterUnits.length > 0
          ? missingUsage / noMeterUnits.length
          : 0;

        results.forEach(r => {
          if (!r.hasMeter) {
            r.usage = sharePerUnit;
            r.bill = (sharePerUnit * settings.costPerUnit) + (settings.serviceCharge || 0);
          }
        });
      }
    }

    return { results, error: null };
  },

  // Totals helpers
  totalBilled(results) {
    return results.reduce((s, r) => s + r.bill, 0);
  },
  totalUsage(results) {
    return results.reduce((s, r) => s + r.usage, 0);
  },
  totalPaid(results, payments) {
    return results
      .filter(r => payments[r.unitName] === 'paid')
      .reduce((s, r) => s + r.bill, 0);
  },
  formatCurrency(sym, val) {
    return sym + Math.round(val).toLocaleString();
  }
};
