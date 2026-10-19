function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.Auth) window.Auth.init();
  if (window.StripUploader) window.StripUploader.init();
  if (window.HistoryManager) window.HistoryManager.init();
  if (window.ResultViewer) window.ResultViewer.init();

  checkSystemHealth();

  const printBtn = document.getElementById('printReportBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }
});

async function checkSystemHealth() {
  const pill = document.getElementById('dbStatusPill');
  const dot = document.getElementById('dbDot');
  const text = document.getElementById('dbModeText');
  if (!pill || !dot || !text) return;

  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.database) {
      if (data.database.isMongoConnected) {
        dot.style.background = '#10b981';
        text.textContent = 'MongoDB Connected';
        pill.title = 'Connected to active MongoDB database instance';
      } else {
        dot.style.background = '#0284c7';
        text.textContent = 'Local database';
        pill.title = 'Running on embedded persistent data store';
      }
    }
  } catch (err) {
    dot.style.background = '#f59e0b';
    text.textContent = 'Offline';
  }
}
