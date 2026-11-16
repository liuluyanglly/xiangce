/**
 * EternalEcho - Heart Trail & Fullscreen Polaroid Scatter Engine
 * 照片一张一张出现组成爱心，随后满屏散开铺满屏幕
 * Inspired by Douyin Python Heart Popup Memo Cards + Romantic Polaroid Memories
 */

class HeartTrailGallery {
  constructor(app) {
    this.app = app;
    this.stage = document.getElementById('heartTrailStage');
    this.header = document.getElementById('heartTrailHeader');
    this.statusText = document.getElementById('heartTrailStatusText');
    this.counterEl = document.getElementById('heartTrailCounter');
    this.controls = document.getElementById('heartTrailControls');

    this.btnReplay = document.getElementById('btnHeartTrailReplay');
    this.btnToggle = document.getElementById('btnHeartTrailToggleState');
    this.toggleIcon = document.getElementById('heartTrailToggleIcon');
    this.toggleText = document.getElementById('heartTrailToggleText');
    this.btnShuffle = document.getElementById('btnHeartTrailShuffle');

    this.cardCount = window.innerWidth < 640 ? 44 : 52;
    this.cardWidth = window.innerWidth < 640 ? 88 : 118;
    this.cardHeight = window.innerWidth < 640 ? 116 : 150;

    this.cards = [];
    this.heartCoords = [];
    this.scatterCoords = [];
    this.currentState = 'idle'; // 'idle' | 'building' | 'heart' | 'scattered'
    this.activeTimers = [];
    this.activeTweens = [];
    this.selectedPhotos = [];

    this.memoTitles = [
      '别熬夜了呀 🌙',
      '保持好心情 🌸',
      '好好爱自己 💕',
      '天气冷了多穿点 🧣',
      '想你了 · 尹珍珠 💌',
      '刘禄洋 ♥ 尹珍珠 💍',
      '今天也超喜欢你 ✨',
      '慢慢变好，慢慢陪你 🕊️',
      '所念皆星河，所爱皆是你 🌌',
      '每一帧都是心动 📸',
      '朝暮并往，与你同行 🌅',
      '常欢愉，多喜乐 🍬',
      '你是心头最美的风景 🍃',
      '风里有诗，眼里有你 🎈',
      '我们的第 N 个瞬间 🌟',
      '人间值得，因为有你 🤍',
      '岁岁常欢愉，万事皆胜意 🧧',
      '心动不止此时 💓',
      '偷偷藏不住的喜欢 🍯',
      '记得按时吃饭 🍲',
      '愿我们岁岁年年 🎇',
      '目光所及皆是你 💫',
      '浪漫至死不渝 🌹',
      '甜在心头，暖在日常 🍓',
      '有你在，便心安 ☁️',
      '始于初见，止于终老 🕊️'
    ];

    this.themes = [
      { barBg: 'rgba(244, 63, 94, 0.28)', borderColor: 'rgba(251, 113, 133, 0.55)', dot: '#fb7185', glow: 'rgba(244,63,94,0.35)' },
      { barBg: 'rgba(236, 72, 153, 0.28)', borderColor: 'rgba(244, 114, 182, 0.55)', dot: '#f472b6', glow: 'rgba(236,72,153,0.35)' },
      { barBg: 'rgba(168, 85, 247, 0.28)', borderColor: 'rgba(192, 132, 252, 0.55)', dot: '#c084fc', glow: 'rgba(168,85,247,0.35)' },
      { barBg: 'rgba(56, 189, 248, 0.28)', borderColor: 'rgba(125, 211, 252, 0.55)', dot: '#38bdf8', glow: 'rgba(56,189,248,0.35)' },
      { barBg: 'rgba(52, 211, 153, 0.28)', borderColor: 'rgba(110, 231, 183, 0.55)', dot: '#34d399', glow: 'rgba(52,211,153,0.35)' },
      { barBg: 'rgba(251, 191, 36, 0.28)', borderColor: 'rgba(252, 211, 77, 0.55)', dot: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
      { barBg: 'rgba(251, 146, 60, 0.28)', borderColor: 'rgba(253, 186, 116, 0.55)', dot: '#fb923c', glow: 'rgba(251,146,60,0.35)' },
    ];

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    if (this.btnReplay) {
      this.btnReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startSequence(true);
      });
    }

    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentState === 'building') return;
        if (this.currentState === 'heart') {
          this.scatterFullScreen();
        } else {
          this.gatherToHeart();
        }
      });
    }

    if (this.btnShuffle) {
      this.btnShuffle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shufflePhotos();
        this.startSequence(true);
      });
    }

    // Debounced Resize handler
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.app.currentMode === 'heart-trail' && this.cards.length > 0) {
          this.handleResize();
        }
      }, 200);
    });
  }

  activate() {
    if (this.cards.length === 0 || this.currentState === 'idle') {
      this.startSequence();
    }
  }

  deactivate() {
    this.clearAllTimers();
  }

  clearAllTimers() {
    this.activeTimers.forEach(t => clearTimeout(t));
    this.activeTimers = [];
  }

  pickRandomPhotos(count) {
    const allPhotos = (window.REAL_COUPLE_PHOTOS && window.REAL_COUPLE_PHOTOS.length > 0)
      ? window.REAL_COUPLE_PHOTOS
      : (this.app && this.app.state && this.app.state.photos ? this.app.state.photos : []);

    if (!allPhotos || allPhotos.length === 0) return [];

    const total = allPhotos.length;
    const sampled = [];
    const usedIndices = new Set();

    // Ensure broad coverage across time: pick evenly spaced samples first, then fill
    const step = Math.max(1, Math.floor(total / count));
    for (let i = 0; i < count && sampled.length < count; i++) {
      let idx = (i * step + Math.floor(Math.random() * step)) % total;
      while (usedIndices.has(idx) && usedIndices.size < total) {
        idx = (idx + 1) % total;
      }
      usedIndices.add(idx);
      sampled.push(allPhotos[idx]);
    }
    return sampled;
  }

  shufflePhotos() {
    this.selectedPhotos = this.pickRandomPhotos(this.cardCount);
  }

  computeCoordinates() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 640;
    this.cardCount = isMobile ? 44 : 52;
    this.cardWidth = isMobile ? 88 : 118;
    this.cardHeight = isMobile ? 116 : 150;

    const count = this.cardCount;

    // --- 1. Heart Trajectory Coordinates ---
    // Parametric Heart: x = 16 sin^3(t), y = -(13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t))
    const cx = w / 2;
    // Position center slightly above true center to allow breathing room for bottom controls
    const cy = isMobile ? (h / 2 - 15) : (h / 2 - 10);

    const availW = w - this.cardWidth - (isMobile ? 20 : 60);
    const availH = h - this.cardHeight - (isMobile ? 150 : 180);

    const scaleX = availW / 33;
    const scaleY = availH / 32;
    const scale = Math.min(scaleX, scaleY);

    this.heartCoords = [];
    for (let i = 0; i < count; i++) {
      // Loop clockwise starting from top cleft
      const t = (i / count) * Math.PI * 2;
      const sinT = Math.sin(t);
      const rawX = 16 * Math.pow(sinT, 3);
      const rawY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const x = cx + rawX * scale - this.cardWidth / 2;
      const y = cy + rawY * scale - this.cardHeight / 2;

      // Card tilt: gentle curve tangent alignment (-18 deg ~ +18 deg)
      const baseRot = Math.max(-18, Math.min(18, Math.cos(t) * 16));
      const rot = baseRot + (Math.random() - 0.5) * 4;

      this.heartCoords.push({
        x: Math.round(x),
        y: Math.round(y),
        rot: Math.round(rot * 10) / 10,
        zIndex: 10 + i
      });
    }

    // --- 2. Fullscreen Scatter Coordinates ---
    const padTop = isMobile ? 80 : 90;
    const padBottom = isMobile ? 85 : 95;
    const padSide = isMobile ? 12 : 24;

    const scatterW = w - padSide * 2;
    const scatterH = h - padTop - padBottom;

    const ratio = scatterW / Math.max(1, scatterH);
    let cols = Math.round(Math.sqrt(count * ratio));
    cols = Math.max(isMobile ? 4 : 6, Math.min(isMobile ? 6 : 10, cols));
    const rows = Math.ceil(count / cols);

    const cellW = scatterW / cols;
    const cellH = scatterH / rows;

    const slots = Array.from({ length: cols * rows }, (_, idx) => idx);
    // Fisher-Yates shuffle slots for natural random dispersal
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    this.scatterCoords = [];
    for (let i = 0; i < count; i++) {
      const slot = slots[i % slots.length];
      const c = slot % cols;
      const r = Math.floor(slot / cols);

      const baseX = padSide + c * cellW + (cellW - this.cardWidth) / 2;
      const baseY = padTop + r * cellH + (cellH - this.cardHeight) / 2;

      const jitterX = (Math.random() - 0.5) * (cellW * 0.44);
      const jitterY = (Math.random() - 0.5) * (cellH * 0.44);

      const x = Math.max(8, Math.min(w - this.cardWidth - 8, baseX + jitterX));
      const y = Math.max(padTop - 10, Math.min(h - this.cardHeight - padBottom + 10, baseY + jitterY));
      const rot = (Math.random() - 0.5) * 26;

      this.scatterCoords.push({
        x: Math.round(x),
        y: Math.round(y),
        rot: Math.round(rot * 10) / 10,
        zIndex: 20 + Math.floor(Math.random() * count)
      });
    }
  }

  createCardElement(photo, index) {
    const card = document.createElement('div');
    card.className = 'heart-trail-card';
    card.dataset.index = index;

    const theme = this.themes[index % this.themes.length];
    const memoTitle = this.memoTitles[index % this.memoTitles.length];

    card.style.width = `${this.cardWidth}px`;
    card.style.height = `${this.cardHeight}px`;
    card.style.borderColor = theme.borderColor;

    const thumbUrl = photo.thumb || photo.thumbUrl || (photo.url ? photo.url.replace('/photos/', '/thumbs/') : '');
    const photoDate = photo.date || photo.month || '美好瞬间';
    const photoTitle = photo.title || '甜蜜记忆';

    card.innerHTML = `
      <div class="card-titlebar" style="background: ${theme.barBg}; border-bottom: 1px solid ${theme.borderColor};">
        <div class="card-dots">
          <span class="dot" style="background: ${theme.dot};"></span>
          <span class="dot" style="background: rgba(255,255,255,0.45);"></span>
        </div>
        <span class="card-title-text" title="${memoTitle}">${memoTitle}</span>
        <span class="card-pin" style="color: ${theme.dot};">♥</span>
      </div>
      <div class="card-img-box">
        <img src="${thumbUrl}" onerror="this.src='${photo.url}'" alt="${photoTitle}" class="card-img" loading="lazy" />
        <div class="card-hover-overlay">
          <span>点击放大</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-date truncate">${photoDate}</span>
        <span class="card-badge">#Love</span>
      </div>
    `;

    // Attach Interactive Drag & Click handlers
    this.attachCardInteractions(card, photo);

    return card;
  }

  attachCardInteractions(card, photo) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      // Don't drag if building animation is still in progress
      if (this.currentState === 'building') return;

      isDragging = true;
      hasMoved = false;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      // Read current transform coordinates
      initialX = gsap.getProperty(card, 'x') || 0;
      initialY = gsap.getProperty(card, 'y') || 0;

      card.classList.add('is-dragging');
      card.style.zIndex = '999';

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved = true;
        if (e.cancelable) e.preventDefault();
      }

      gsap.set(card, {
        x: initialX + dx,
        y: initialY + dy
      });
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      card.classList.remove('is-dragging');

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      if (!hasMoved) {
        // Pure click: trigger full-res artwork modal preview!
        if (this.app && typeof this.app.showArtworkModal === 'function') {
          this.app.showArtworkModal(photo);
        }
      }
    };

    card.addEventListener('pointerdown', onPointerDown);
  }

  startSequence(forceRebuild = false) {
    this.clearAllTimers();

    if (!this.stage) return;
    this.stage.innerHTML = '';
    this.cards = [];

    if (this.selectedPhotos.length === 0 || forceRebuild) {
      this.selectedPhotos = this.pickRandomPhotos(this.cardCount);
    }

    this.computeCoordinates();
    this.currentState = 'building';

    // Update UI Status
    if (this.statusText) this.statusText.textContent = '心动轨迹编织中...';
    if (this.counterEl) this.counterEl.textContent = `0 / ${this.cardCount}`;
    if (this.toggleText) this.toggleText.textContent = '散开铺满';
    if (this.toggleIcon) this.toggleIcon.textContent = '✦';

    // 1. Create and stage all card DOM nodes invisibly at heart coordinates
    for (let i = 0; i < this.cardCount; i++) {
      const photo = this.selectedPhotos[i % this.selectedPhotos.length];
      const card = this.createCardElement(photo, i);
      const coord = this.heartCoords[i];

      // Pre-position via GSAP
      gsap.set(card, {
        x: coord.x,
        y: coord.y,
        rotation: coord.rot + 22,
        scale: 0,
        opacity: 0,
        zIndex: coord.zIndex
      });

      this.stage.appendChild(card);
      this.cards.push(card);
    }

    // 2. Sequential pop-in animation: one card by one, forming the heart shape
    const popInterval = 65; // ms between each card popup
    for (let i = 0; i < this.cardCount; i++) {
      const card = this.cards[i];
      const coord = this.heartCoords[i];

      const timer = setTimeout(() => {
        if (this.currentState !== 'building') return;

        // Pop in with bouncy spring ease
        gsap.to(card, {
          scale: 1,
          opacity: 1,
          rotation: coord.rot,
          duration: 0.42,
          ease: 'back.out(1.8)'
        });

        if (this.counterEl) {
          this.counterEl.textContent = `${i + 1} / ${this.cardCount}`;
        }

        // When the final card arrives, complete the heart!
        if (i === this.cardCount - 1) {
          this.onHeartCompleted();
        }
      }, i * popInterval);

      this.activeTimers.push(timer);
    }
  }

  onHeartCompleted() {
    this.currentState = 'heart';

    if (this.statusText) {
      this.statusText.textContent = '💖 52 颗心动瞬间已聚合为爱心';
    }
    if (this.toggleText) this.toggleText.textContent = '散开铺满';
    if (this.toggleIcon) this.toggleIcon.textContent = '✦';

    // Heartbeat Surge: The whole heart does 2 synchronized gentle heartbeats
    gsap.to(this.cards, {
      scale: 1.05,
      duration: 0.24,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut'
    });

    // Confetti celebration burst
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 38,
        spread: 68,
        origin: { x: 0.5, y: 0.46 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#fbbf24']
      });
    }

    // "然后散开铺满整个屏幕": After a romantic 1.4s delay, automatically scatter!
    const autoScatterTimer = setTimeout(() => {
      if (this.currentState === 'heart') {
        this.scatterFullScreen();
      }
    }, 1400);

    this.activeTimers.push(autoScatterTimer);
  }

  scatterFullScreen() {
    this.clearAllTimers();
    this.currentState = 'scattered';

    if (this.statusText) {
      this.statusText.textContent = '✨ 记忆已满屏散开 · 点击任意照片查看详情';
    }
    if (this.toggleText) this.toggleText.textContent = '聚合为心';
    if (this.toggleIcon) this.toggleIcon.textContent = '♥';

    // Staggered scatter animation: cards fly outward to fill the entire screen
    this.cards.forEach((card, i) => {
      const sc = this.scatterCoords[i];
      if (!sc) return;

      gsap.to(card, {
        x: sc.x,
        y: sc.y,
        rotation: sc.rot,
        scale: 1,
        opacity: 1,
        duration: 1.15 + Math.random() * 0.35,
        delay: (i / this.cardCount) * 0.45,
        ease: 'power3.out',
        onComplete: () => {
          card.style.zIndex = sc.zIndex;
        }
      });
    });
  }

  gatherToHeart() {
    this.clearAllTimers();
    this.currentState = 'heart';

    if (this.statusText) {
      this.statusText.textContent = '💖 爱心已重新聚合 · 刘禄洋 ♥ 尹珍珠';
    }
    if (this.toggleText) this.toggleText.textContent = '散开铺满';
    if (this.toggleIcon) this.toggleIcon.textContent = '✦';

    // Smoothly fly back from current scattered positions into the heart contour
    this.cards.forEach((card, i) => {
      const hc = this.heartCoords[i];
      if (!hc) return;

      gsap.to(card, {
        x: hc.x,
        y: hc.y,
        rotation: hc.rot,
        scale: 1,
        opacity: 1,
        duration: 1.05 + Math.random() * 0.3,
        delay: (i / this.cardCount) * 0.35,
        ease: 'power3.inOut',
        onComplete: () => {
          card.style.zIndex = hc.zIndex;
        }
      });
    });
  }

  handleResize() {
    this.computeCoordinates();

    if (this.currentState === 'heart') {
      this.cards.forEach((card, i) => {
        const hc = this.heartCoords[i];
        if (hc) {
          gsap.to(card, {
            x: hc.x,
            y: hc.y,
            rotation: hc.rot,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      });
    } else if (this.currentState === 'scattered') {
      this.cards.forEach((card, i) => {
        const sc = this.scatterCoords[i];
        if (sc) {
          gsap.to(card, {
            x: sc.x,
            y: sc.y,
            rotation: sc.rot,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      });
    }
  }
}

window.HeartTrailGallery = HeartTrailGallery;
