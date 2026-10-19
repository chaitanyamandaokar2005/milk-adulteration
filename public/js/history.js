// User Test History Table & Profile Dashboard Manager

const HistoryManager = {
  init() {
    this.bindEvents();
    this.loadDashboard();
    this.loadHistory();
  },

  bindEvents() {
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    if (refreshHistoryBtn) {
      refreshHistoryBtn.addEventListener('click', () => {
        this.loadHistory();
        this.loadDashboard();
      });
    }

    const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
    if (refreshDashboardBtn) {
      refreshDashboardBtn.addEventListener('click', () => {
        this.loadDashboard();
        this.loadHistory();
      });
    }
  },

  async loadDashboard() {
    if (!window.Auth || !window.Auth.token) {
      return;
    }

    try {
      const res = await fetch('/api/analyze/dashboard', {
        headers: {
          'Authorization': `Bearer ${window.Auth.token}`
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      const stats = data.stats || {};
      const user = data.user || {};

      // Populate user info
      const dashAvatar = document.getElementById('dashAvatar');
      const dashFullName = document.getElementById('dashFullName');
      const dashEmail = document.getElementById('dashEmail');

      const name = user.fullName || user.username || 'User';
      if (dashFullName) dashFullName.textContent = name;
      if (dashEmail) dashEmail.textContent = user.email || '';
      if (dashAvatar) dashAvatar.textContent = name.charAt(0).toUpperCase();

      // Populate stats counters
      const totalTestsEl = document.getElementById('dashTotalTests');
      const pureCountEl = document.getElementById('dashPureCount');
      const adultCountEl = document.getElementById('dashAdultCount');
      const avgConfidenceEl = document.getElementById('dashAvgConfidence');

      if (totalTestsEl) totalTestsEl.textContent = stats.totalTests ?? 0;
      if (pureCountEl) pureCountEl.textContent = stats.pureCount ?? 0;
      if (adultCountEl) adultCountEl.textContent = stats.adulteratedCount ?? 0;
      if (avgConfidenceEl) avgConfidenceEl.textContent = `${stats.avgConfidence ?? 0}%`;
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    }
  },

  async loadHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (!window.Auth || !window.Auth.token) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:28px; color:var(--text-muted);">
            Please sign in to view your test history.
          </td>
        </tr>
      `;
      return;
    }

    try {
      const res = await fetch('/api/analyze/history', {
        headers: {
          'Authorization': `Bearer ${window.Auth.token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Failed to load history records.</td></tr>`;
        return;
      }

      const items = data.history || [];
      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; padding:28px; color:var(--text-muted);">
              No strip tests recorded yet. Run a test from the Test Strip page.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = items.map(item => {
        const isPositive = item.labTerminology === 'POSITIVE' || item.detectedStatus === 'ADULTERATED';
        const badgeHtml = isPositive
          ? '<span class="badge-adulterated">🚫 POSITIVE</span>'
          : '<span class="badge-pure">✓ NEGATIVE</span>';

        const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const milkSourceDisplay = item.milkSource
          ? `<span class="source-tag">${escapeHtml(item.milkSource)}</span>`
          : `<span style="color:#94a3b8; font-size:0.8rem;">Unspecified</span>`;

        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="width:22px; height:22px; border-radius:6px; background:${item.sampledColorHex}; border:1px solid #cbd5e1; display:inline-block;"></span>
                <span style="font-family:ui-monospace,monospace; font-size:0.8rem;">${item.sampledColorHex}</span>
              </div>
            </td>
            <td><strong>${escapeHtml(item.sampleName || 'Milk Sample')}</strong></td>
            <td>${milkSourceDisplay}</td>
            <td>${escapeHtml(item.adulterantName || '')}</td>
            <td>${badgeHtml}</td>
            <td><strong>${item.confidenceScore}%</strong></td>
            <td style="font-size:0.8rem; color:#64748b;">${dateStr}</td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="HistoryManager.deleteRecord('${item._id}')" title="Delete record" style="color:#ef4444; padding:4px 8px;">
                Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Error loading history.</td></tr>`;
    }
  },

  async deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this test record?')) return;

    try {
      const headers = {};
      if (window.Auth && window.Auth.token) {
        headers['Authorization'] = `Bearer ${window.Auth.token}`;
      }

      const res = await fetch(`/api/analyze/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        showToast('Record deleted.', 'info');
        this.loadHistory();
        this.loadDashboard();
      } else {
        const err = await res.json();
        showToast(err.error || 'Could not delete record.', 'error');
      }
    } catch (err) {
      showToast('Error deleting record.', 'error');
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.HistoryManager = HistoryManager;
