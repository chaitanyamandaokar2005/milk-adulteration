const StripUploader = {
  selectedFile: null,
  canvas: null,
  ctx: null,
  imageObj: null,
  sampledColorHex: '#E5E5E5',
  sampledColorRgb: [229, 229, 229],
  selectedAdulterantSlug: 'formalin',
  lastSamplePoint: null,

  // Reference color standards for real-time live preview feedback
  STANDARDS: {
    formalin: {
      pure: [90, 5, 30], // Left / top: Crimson-Magenta (normal / pure milk)
      adult: [62, 26, 88] // Right / bottom: Deep Violet-Purple (adulterated)
    },
    urea: {
      pure: [182, 179, 164], // Left: Pale Off-White control (normal / pure milk)
      adult: [176, 182, 59] // Right: Vivid Lemon Yellow (adulterated)
    },
    starch: {
      pure: [89, 66, 20], // Left: Amber / Mustard Brown (normal / pure milk)
      adult: [18, 15, 11] // Right: Deep Blue-Black / Pitch Charcoal (adulterated)
    },
    detergent: {
      pure: [133, 110, 114], // Left: Light Mauve / Lavender-Pink (normal / pure milk)
      adult: [58, 59, 57] // Right: Dark Slate Charcoal (adulterated)
    }
  },

  init() {
    this.canvas = document.getElementById('stripCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.bindEvents();
  },

  bindEvents() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('stripFileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const chips = document.querySelectorAll('.chip-option');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFile(e.target.files[0]);
        }
      });
    }

    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => this.sampleColorAtEvent(e));
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedAdulterantSlug = chip.getAttribute('data-slug');
        this.evaluatePreviewMatch();
      });
    });

    if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.submitAnalysis());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetWorkspace());
  },

  handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, WebP).', 'error');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
      this.imageObj = new Image();
      this.imageObj.onload = () => {
        this.lastSamplePoint = null;
        this.renderImageToCanvas();
        const dropzone = document.getElementById('dropzone');
        const workspacePreview = document.getElementById('workspacePreview');
        const resetBtn = document.getElementById('resetBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');

        if (dropzone) dropzone.style.display = 'none';
        if (workspacePreview) workspacePreview.style.display = 'block';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (analyzeBtn) analyzeBtn.disabled = false;

        // Auto-sample initial pad with a slight delay
        setTimeout(() => this.autoSampleReactionPad(), 150);
        showToast('Image loaded. Click on the reaction pad, or use Left (Normal) / Right (Adulterated).', 'info');
      };
      this.imageObj.src = e.target.result;
    };

    reader.readAsDataURL(file);
  },

  renderImageToCanvas() {
    if (!this.imageObj || !this.canvas || !this.ctx) return;

    const maxWidth = 720;
    const maxHeight = 440;
    let width = this.imageObj.naturalWidth;
    let height = this.imageObj.naturalHeight;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(this.imageObj, 0, 0, width, height);

    // If a point was sampled, draw a visible reticle
    if (this.lastSamplePoint) {
      const { x, y } = this.lastSamplePoint;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
      this.ctx.strokeStyle = '#4f46e5';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Crosshair
      this.ctx.beginPath();
      this.ctx.moveTo(x - 14, y);
      this.ctx.lineTo(x + 14, y);
      this.ctx.moveTo(x, y - 14);
      this.ctx.lineTo(x, y + 14);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    }
  },

  sampleColorAtEvent(e) {
    if (!this.ctx || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    this.sampleAreaColor(x, y, 6);
  },

  sampleAreaColor(centerX, centerY, radius = 5) {
    if (!this.ctx || !this.canvas) return;
    const x0 = Math.max(0, centerX - radius);
    const y0 = Math.max(0, centerY - radius);
    const x1 = Math.min(this.canvas.width, centerX + radius);
    const y1 = Math.min(this.canvas.height, centerY + radius);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return;

    const imgData = this.ctx.getImageData(x0, y0, w, h).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;

    for (let i = 0; i < imgData.length; i += 4) {
      rSum += imgData[i];
      gSum += imgData[i + 1];
      bSum += imgData[i + 2];
      count++;
    }

    if (count > 0) {
      this.lastSamplePoint = { x: centerX, y: centerY };
      this.renderImageToCanvas();
      this.updateSampledColor(
        Math.round(rSum / count),
        Math.round(gSum / count),
        Math.round(bSum / count)
      );
    }
  },

  // Sample Left Pad (Normal / Pure Milk Control)
  sampleLeftPad() {
    if (!this.canvas) return;
    const isHorizontal = this.canvas.width > this.canvas.height * 1.2;
    let cx, cy;
    if (isHorizontal) {
      // Top strip reaction pad (Normal)
      cx = Math.floor(this.canvas.width * 0.25);
      cy = Math.floor(this.canvas.height * 0.32);
    } else {
      // Left strip bottom reaction pad (Normal)
      cx = Math.floor(this.canvas.width * 0.35);
      cy = Math.floor(this.canvas.height * 0.70);
    }
    this.sampleAreaColor(cx, cy, 10);
    showToast('Sampled Left Pad: Normal / Pure control standard.', 'info');
  },

  // Sample Right Pad (Adulterated)
  sampleRightPad() {
    if (!this.canvas) return;
    const isHorizontal = this.canvas.width > this.canvas.height * 1.2;
    let cx, cy;
    if (isHorizontal) {
      // Bottom strip reaction pad (Adulterated)
      cx = Math.floor(this.canvas.width * 0.25);
      cy = Math.floor(this.canvas.height * 0.58);
    } else {
      // Right strip bottom reaction pad (Adulterated)
      cx = Math.floor(this.canvas.width * 0.65);
      cy = Math.floor(this.canvas.height * 0.70);
    }
    this.sampleAreaColor(cx, cy, 10);
    showToast('Sampled Right Pad: Adulterated standard.', 'info');
  },

  autoSampleReactionPad() {
    if (!this.canvas) return;
    // Default to left pad (Normal / Pure control) to avoid false adulteration
    this.sampleLeftPad();
  },

  updateSampledColor(r, g, b) {
    this.sampledColorRgb = [r, g, b];
    const hex = '#' + [r, g, b].map((x) => {
      const h = x.toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('').toUpperCase();

    this.sampledColorHex = hex;
  },

  resetWorkspace() {
    this.selectedFile = null;
    this.imageObj = null;
    this.lastSamplePoint = null;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    const fileInput = document.getElementById('stripFileInput');
    if (fileInput) fileInput.value = '';
    const dropzone = document.getElementById('dropzone');
    const workspacePreview = document.getElementById('workspacePreview');
    const resetBtn = document.getElementById('resetBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (dropzone) dropzone.style.display = 'block';
    if (workspacePreview) workspacePreview.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
    if (analyzeBtn) analyzeBtn.disabled = true;
  },

  async submitAnalysis() {
    if (!this.selectedFile) {
      showToast('Please select or upload a strip image first.', 'error');
      return;
    }

    if (!window.Auth || !window.Auth.isSignedIn()) {
      showToast('Please sign in to run strip analysis.', 'error');
      window.location.href = '/login?next=/test';
      return;
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    const origText = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span>Matching pad color…</span>';

    try {
      const milkSource = (document.getElementById('milkSourceInput')?.value || '').trim();
      if (!milkSource) {
        showToast('Milk source / supplier is required.', 'error');
        document.getElementById('milkSourceInput')?.focus();
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = origText;
        return;
      }

      const formData = new FormData();
      formData.append('stripImage', this.selectedFile);
      formData.append('adulterantSlug', this.selectedAdulterantSlug);
      formData.append('sampledColorHex', this.sampledColorHex);
      formData.append('sampleName', (document.getElementById('sampleNameInput')?.value || 'Milk Sample').trim());
      formData.append('milkSource', milkSource);

      const res = await fetch('/api/analyze/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Analysis failed', 'error');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = origText;
        return;
      }

      sessionStorage.setItem('milkwise_last_result', JSON.stringify(data.testResult));
      sessionStorage.setItem('puremilk_last_result', JSON.stringify(data.testResult));
      window.location.href = '/result';
    } catch (err) {
      console.error(err);
      showToast('Network error during analysis.', 'error');
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = origText;
    }
  }
};

window.StripUploader = StripUploader;
