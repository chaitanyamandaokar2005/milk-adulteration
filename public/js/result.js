const ResultViewer = {
  init() {
    const raw = sessionStorage.getItem('puremilk_last_result');
    if (!raw) return;

    try {
      this.displayResults(JSON.parse(raw));
    } catch (err) {
      console.warn('Could not parse stored result', err);
    }
  },

  displayResults(result) {
    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'block';

    const labReportId = document.getElementById('labReportId');
    const labReportDate = document.getElementById('labReportDate');

    if (labReportId) {
      labReportId.textContent = result.reportId
        ? `Report #${result.reportId}`
        : `Report #MW-${Date.now().toString().slice(-6)}`;
    }
    if (labReportDate) {
      const dateVal = result.createdAt ? new Date(result.createdAt) : new Date();
      labReportDate.textContent = dateVal.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || '—';
    };
    const analyst = result.user?.fullName || result.user?.username || 'MilkWise analyst';
    setText('reportSampleName', result.sampleName);
    setText('reportMilkSource', result.milkSource);
    setText('reportAnalyte', result.adulterant?.name);
    setText('reportAnalyst', analyst);
    setText('reportAnalystSign', analyst);

    const isPositive = result.labTerminology === 'POSITIVE' || result.detectedStatus === 'ADULTERATED';
    const banner = document.getElementById('statusBanner');
    const statusHeading = document.getElementById('statusHeading');
    const statusSubtitle = document.getElementById('statusSubtitle');
    const statusIcon = document.getElementById('statusIcon');
    const confidencePill = document.getElementById('confidencePill');
    const terminologyBadge = document.getElementById('terminologyBadge');
    const termBarLabel = document.getElementById('termBarLabel');
    const termBarDesc = document.getElementById('termBarDesc');

    if (isPositive) {
      if (banner) banner.className = 'status-banner adulterated';
      if (statusIcon) statusIcon.textContent = '🚫';
      if (statusHeading) statusHeading.textContent = 'POSITIVE — ADULTERATED MILK';
      if (statusSubtitle) {
        statusSubtitle.textContent = `Reaction matches adulterated standard for ${result.adulterant.name}. Unsafe for human consumption.`;
      }
      if (terminologyBadge) {
        terminologyBadge.textContent = 'POSITIVE';
        terminologyBadge.className = 'result-terminology-badge positive-badge';
      }
      if (termBarLabel) termBarLabel.textContent = 'POSITIVE';
      if (termBarDesc) termBarDesc.textContent = 'Adulterant detected. Unsafe for human consumption per FSSAI limits.';
    } else {
      if (banner) banner.className = 'status-banner pure';
      if (statusIcon) statusIcon.textContent = '✓';
      if (statusHeading) statusHeading.textContent = 'NEGATIVE — PURE MILK';
      if (statusSubtitle) {
        statusSubtitle.textContent = `No adulterant detected. Reaction pad matches calibrated pure control for ${result.adulterant.name}.`;
      }
      if (terminologyBadge) {
        terminologyBadge.textContent = 'NEGATIVE';
        terminologyBadge.className = 'result-terminology-badge negative-badge';
      }
      if (termBarLabel) termBarLabel.textContent = 'NEGATIVE';
      if (termBarDesc) termBarDesc.textContent = 'No adulterant detected. Sample complies with FSSAI pure milk standards.';
    }

    if (confidencePill) confidencePill.textContent = `${result.confidenceScore}% Confidence`;

    const sampledSwatchBox = document.getElementById('sampledSwatchBox');
    const sampledHexText = document.getElementById('sampledHexText');
    const pureSwatchBox = document.getElementById('pureSwatchBox');
    const pureHexText = document.getElementById('pureHexText');
    const pureDistMetric = document.getElementById('pureDistMetric');
    const adultSwatchBox = document.getElementById('adultSwatchBox');
    const adultHexText = document.getElementById('adultHexText');
    const adultDistMetric = document.getElementById('adultDistMetric');

    if (sampledSwatchBox) sampledSwatchBox.style.backgroundColor = result.sampledColor?.hex || '#ccc';
    if (sampledHexText) {
      sampledHexText.textContent = result.sampledColor?.hex || '#ccc';
      sampledHexText.dataset.copy = result.sampledColor?.hex || '';
    }
    if (pureSwatchBox) pureSwatchBox.style.backgroundColor = result.adulterant?.pureColor?.hex || '#ccc';
    if (pureHexText) {
      pureHexText.textContent = result.adulterant?.pureColor?.hex || '#ccc';
      pureHexText.dataset.copy = result.adulterant?.pureColor?.hex || '';
    }
    if (pureDistMetric) {
      pureDistMetric.textContent = `ΔE: ${result.distanceToPure ?? '-'} (${result.pureMatchPct ?? '-'}% match)`;
    }
    if (adultSwatchBox) adultSwatchBox.style.backgroundColor = result.adulterant?.adulteratedColor?.hex || '#ccc';
    if (adultHexText) {
      adultHexText.textContent = result.adulterant?.adulteratedColor?.hex || '#ccc';
      adultHexText.dataset.copy = result.adulterant?.adulteratedColor?.hex || '';
    }
    if (adultDistMetric) {
      adultDistMetric.textContent = `ΔE: ${result.distanceToAdulterated ?? '-'} (${result.adultMatchPct ?? '-'}% match)`;
    }

    const all4Grid = document.getElementById('all4RefGrid');
    if (all4Grid && result.all4Comparisons && result.all4Comparisons.length) {
      all4Grid.innerHTML = '';
      result.all4Comparisons.forEach((item) => {
        const isMatched = item.slug === result.adulterant.slug;
        const card = document.createElement('div');
        card.className = `all4-card ${isMatched ? 'matched' : ''}`;
        const isItemPure = item.status === 'PURE';
        const bestPct = isItemPure ? item.pureMatchPct : item.adultMatchPct;

        card.innerHTML = `
          <div class="all4-card-header">
            <span class="all4-card-title">${item.name}</span>
            <span class="all4-badge ${isItemPure ? 'pure' : 'adulterated'}">
              ${isItemPure ? '✓ NEGATIVE (PURE)' : '⚠ POSITIVE (ADULT)'}
            </span>
          </div>
          <div class="all4-swatches">
            <div class="all4-swatch-box">
              <span class="all4-mini-dot" style="background:${item.pureColor.hex}"></span>
              <span>Normal: ${item.pureColor.hex}</span>
            </div>
            <div class="all4-swatch-box">
              <span class="all4-mini-dot" style="background:${item.adulteratedColor.hex}"></span>
              <span>Adulterated: ${item.adulteratedColor.hex}</span>
            </div>
          </div>
          <div class="all4-similarity-row">
            <span>Calibrated match:</span>
            <strong>${bestPct}% (${item.status})</strong>
          </div>
          <div class="all4-progress-bg">
            <div class="all4-progress-fill" style="width: ${bestPct}%; background: ${isItemPure ? '#10b981' : '#ef4444'}"></div>
          </div>
        `;
        all4Grid.appendChild(card);
      });
    }

    if (result.chemicalReport) {
      const repPurpose = document.getElementById('reportPurpose');
      const repSnf = document.getElementById('reportSnf');
      const repDensity = document.getElementById('reportDensity');
      const repMechanism = document.getElementById('reportMechanism');
      const repFssai = document.getElementById('reportFssai');

      if (repPurpose) repPurpose.textContent = result.chemicalReport.purpose;
      if (repSnf) repSnf.textContent = result.chemicalReport.snfImpact;
      if (repDensity) repDensity.textContent = result.chemicalReport.densityImpact;
      if (repMechanism) repMechanism.textContent = result.chemicalReport.chemicalMechanism;
      if (repFssai) repFssai.textContent = result.chemicalReport.fssaiLimit;

      const hazardsList = document.getElementById('reportHazards');
      if (hazardsList) {
        hazardsList.innerHTML = '';
        (result.chemicalReport.healthHazards || []).forEach((h) => {
          const li = document.createElement('li');
          li.textContent = h;
          hazardsList.appendChild(li);
        });
      }
    }

    this.fillPrintSheet(result, isPositive, analyst);
  },

  fillPrintSheet(result, isPositive, analyst) {
    const sheet = document.getElementById('printSheet');
    if (!sheet) return;

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || '—';
    };
    const paint = (id, color) => {
      const el = document.getElementById(id);
      if (el) el.style.background = color || '#ddd';
    };

    const dateVal = result.createdAt ? new Date(result.createdAt) : new Date();
    set('psSerial', result.reportId || `MW-${Date.now().toString().slice(-6)}`);
    set('psIssued', dateVal.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }));
    set('psSample', result.sampleName);
    set('psSource', result.milkSource);
    set('psAnalyte', result.adulterant?.name);
    set('psConfidence', result.confidenceScore != null ? `${result.confidenceScore}% match` : '—');

    const wrap = document.getElementById('psVerdictWrap');
    const stamp = document.getElementById('psStamp');
    if (isPositive) {
      if (wrap) wrap.className = 'ps-verdict is-positive';
      set('psVerdict', 'POSITIVE');
      set('psVerdictMean', `Adulterant indicated for ${result.adulterant?.name || 'this test'}. Treat as unsafe.`);
      if (stamp) stamp.textContent = 'FAIL';
    } else {
      if (wrap) wrap.className = 'ps-verdict is-negative';
      set('psVerdict', 'NEGATIVE');
      set('psVerdictMean', `No adulterant indicated. Pad matches the normal standard for ${result.adulterant?.name || 'this test'}.`);
      if (stamp) stamp.textContent = 'PASS';
    }

    paint('psChipSampled', result.sampledColor?.hex);
    paint('psChipPure', result.adulterant?.pureColor?.hex);
    paint('psChipAdult', result.adulterant?.adulteratedColor?.hex);
    set('psHexSampled', result.sampledColor?.hex);
    set('psHexPure', result.adulterant?.pureColor?.hex);
    set('psHexAdult', result.adulterant?.adulteratedColor?.hex);
    set('psDePure', `ΔE ${result.distanceToPure ?? '—'} · ${result.pureMatchPct ?? '—'}%`);
    set('psDeAdult', `ΔE ${result.distanceToAdulterated ?? '—'} · ${result.adultMatchPct ?? '—'}%`);
    const finding = result.chemicalReport?.chemicalMechanism || result.chemicalReport?.purpose || '';
    set('psFinding', finding.length > 220 ? `${finding.slice(0, 217).trim()}…` : finding);
    set('psFssai', result.chemicalReport?.fssaiLimit ? `FSSAI: ${result.chemicalReport.fssaiLimit}` : '');
  }
};

window.ResultViewer = ResultViewer;
