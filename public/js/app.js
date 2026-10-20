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

  const printBtn = document.getElementById('printReportBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  initNavIsland();
  initFooter();
  initReveal();
  initCopyables();
  initPasswordToggles();
  initHomeDemo();
  initCalibLegend();
  initPaperHover();
  initTilt();
});

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

window.countTo = function countTo(el, value, opts = {}) {
  const suffix = opts.suffix || '';
  const target = Number(value) || 0;
  if (prefersReducedMotion()) {
    el.textContent = `${target}${suffix}`;
    return;
  }
  const start = 0;
  const duration = 700;
  const startAt = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - startAt) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = `${current}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

function initReveal() {
  const nodes = document.querySelectorAll('.reveal');
  if (!nodes.length) return;
  if (prefersReducedMotion()) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }
  nodes.forEach((el, i) => {
    el.style.setProperty('--delay', `${(i % 6) * 60}ms`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
  nodes.forEach((el) => io.observe(el));
}

async function copyText(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (err) {
    return false;
  }
}

function initCopyables() {
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-copy]');
    if (!el) return;
    const value = el.getAttribute('data-copy') || el.textContent.trim();
    const ok = await copyText(value);
    if (ok) {
      el.classList.add('copied');
      showToast(`${value} copied.`, 'success');
      setTimeout(() => el.classList.remove('copied'), 1200);
    }
  });
}

function initPasswordToggles() {
  document.querySelectorAll('[data-password-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-password-toggle'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });
}

function initHomeDemo() {
  const card = document.getElementById('homeDemo');
  if (!card) return;
  const toggle = () => {
    card.classList.toggle('is-flipped');
    const flipped = card.classList.contains('is-flipped');
    card.setAttribute('aria-label', flipped ? 'Flip back to NEGATIVE sample' : 'Flip to POSITIVE sample');
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
}

function initCalibLegend() {
  const row = document.getElementById('calibLegend');
  if (!row) return;
  const chips = row.querySelectorAll('[data-pane]');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-on');
      const showPure = row.querySelector('[data-pane="pure"]').classList.contains('is-on');
      const showAdult = row.querySelector('[data-pane="adult"]').classList.contains('is-on');
      document.querySelectorAll('.color-pane').forEach((pane) => {
        const adult = pane.classList.contains('color-pane-adult');
        pane.classList.toggle('is-dim', adult ? !showAdult : !showPure);
      });
    });
  });
}

function initPaperHover() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.paper-hover').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - box.left}px`);
      card.style.setProperty('--my', `${e.clientY - box.top}px`);
    });
  });
}

function initTilt() {
  if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.js-tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const box = card.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width;
      const y = (e.clientY - box.top) / box.height;
      const rx = ((0.5 - y) * 6).toFixed(2);
      const ry = ((x - 0.5) * 6).toFixed(2);
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function initNavIsland() {
  const island = document.querySelector('.nav-container');
  const list = document.getElementById('navLinks');
  const reduce = prefersReducedMotion();

  if (island) {
    island.addEventListener('pointermove', (e) => {
      const box = island.getBoundingClientRect();
      island.style.setProperty('--nx', `${e.clientX - box.left}px`);
    });
    const onScroll = () => {
      island.classList.toggle('is-compact', window.scrollY > 18);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (!list || window.matchMedia('(max-width: 900px)').matches) return;

  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  list.insertBefore(indicator, list.firstChild);

  const links = [...list.querySelectorAll('a')];
  const active = list.querySelector('a.active');
  let lastX = 0;
  let hot = active;

  const moveTo = (link, squash) => {
    hot = link || active;
    links.forEach((a) => a.classList.toggle('is-hot', a === hot));
    if (!hot) {
      indicator.style.width = '0px';
      return;
    }
    const listBox = list.getBoundingClientRect();
    const linkBox = hot.getBoundingClientRect();
    const x = linkBox.left - listBox.left;
    const dist = Math.abs(x - lastX);
    lastX = x;
    indicator.style.width = `${linkBox.width}px`;
    if (!reduce && squash && dist > 40) {
      indicator.style.transform = `translateX(${x}px) scaleY(0.7)`;
      requestAnimationFrame(() => {
        indicator.style.transform = `translateX(${x}px) scaleY(1)`;
      });
    } else {
      indicator.style.transform = `translateX(${x}px) scaleY(1)`;
    }
  };

  requestAnimationFrame(() => moveTo(active, false));

  links.forEach((link) => {
    link.addEventListener('mouseenter', () => moveTo(link, true));
    link.addEventListener('focus', () => moveTo(link, true));
    if (reduce || window.matchMedia('(pointer: coarse)').matches) return;
    link.addEventListener('pointermove', (e) => {
      const box = link.getBoundingClientRect();
      const dx = (e.clientX - (box.left + box.width / 2)) * 0.18;
      const dy = (e.clientY - (box.top + box.height / 2)) * 0.22;
      link.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    link.addEventListener('pointerleave', () => {
      link.style.transform = '';
    });
  });

  list.addEventListener('mouseleave', () => {
    links.forEach((a) => { a.style.transform = ''; });
    moveTo(active, true);
  });
}

function initFooter() {
  document.querySelectorAll('.footer-std-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name || 'Standard';
      const text = `${name}: normal ${btn.dataset.pure} · adulterated ${btn.dataset.adult}`;
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${name} hex pair copied.`, 'success');
      } catch (err) {
        showToast(text, 'info');
      }
    });
  });

  const verdict = document.getElementById('footerVerdict');
  const copy = document.getElementById('footerVerdictCopy');
  if (verdict && copy) {
    const tabs = verdict.querySelectorAll('[data-term]');
    const lines = {
      negative: 'NEGATIVE — pad matches the normal standard. Milk is treated as pure for this analyte.',
      positive: 'POSITIVE — pad matches the adulterated standard. Treat the sample as unsafe.'
    };
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.toggle('is-on', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        copy.textContent = lines[tab.dataset.term] || lines.negative;
      });
    });
  }

  const topBtn = document.getElementById('footerTopBtn');
  if (topBtn) {
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

