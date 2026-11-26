/**
 * EternalEcho - Heart Trail & Fullscreen Polaroid Scatter Engine (Ultra-Dense 140+ Photo Edition)
 * 照片一张一张弹出组成双层立体瀑布大爱心，并散落桌面便签，随后满屏散开铺满整个屏幕
 * 深度复刻抖音爆款 Python 爱心便签弹窗视频质感
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

    this.cardCount = window.innerWidth < 640 ? 100 : 140;
    this.cardWidth = window.innerWidth < 640 ? 76 : 102;
    this.cardHeight = window.innerWidth < 640 ? 100 : 132;

    this.cards = [];
    this.heartCoords = [];
    this.scatterCoords = [];
    this.currentState = 'idle'; // 'idle' | 'building' | 'heart' | 'scattered'
    this.activeTimers = [];
    this.selectedPhotos = [];

    // 抖音同款甜蜜文案便签池
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
      '始于初见，止于终老 🕊️',
      '春祺夏安，秋绥冬禧 🌿',
      '心若相知，无言也暖 ☕',
      '我的女孩天下第一好 👑',
      '平淡日子里的刺眼光芒 ☀️'
    ];

    // 多彩糖果色窗口标题栏主题
    this.themes = [
      { barBg: 'rgba(244, 63, 94, 0.32)', borderColor: 'rgba(251, 113, 133, 0.65)', dot: '#fb7185', glow: 'rgba(244,63,94,0.4)' }, // 珊瑚粉
      { barBg: 'rgba(236, 72, 153, 0.32)', borderColor: 'rgba(244, 114, 182, 0.65)', dot: '#f472b6', glow: 'rgba(236,72,153,0.4)' }, // 蜜桃粉
      { barBg: 'rgba(168, 85, 247, 0.32)', borderColor: 'rgba(192, 132, 252, 0.65)', dot: '#c084fc', glow: 'rgba(168,85,247,0.4)' }, // 香芋紫
      { barBg: 'rgba(56, 189, 248, 0.32)', borderColor: 'rgba(125, 211, 252, 0.65)', dot: '#38bdf8', glow: 'rgba(56,189,248,0.4)' }, // 天空蓝
      { barBg: 'rgba(52, 211, 153, 0.32)', borderColor: 'rgba(110, 231, 183, 0.65)', dot: '#34d399', glow: 'rgba(52,211,153,0.4)' }, // 薄荷绿
      { barBg: 'rgba(251, 191, 36, 0.32)', borderColor: 'rgba(252, 211, 77, 0.65)', dot: '#fbbf24', glow: 'rgba(251,191,36,0.4)' }, // 柠檬黄
      { barBg: 'rgba(251, 146, 60, 0.32)', borderColor: 'rgba(253, 186, 116, 0.65)', dot: '#fb923c', glow: 'rgba(251,146,60,0.4)' }, // 晚霞橙
      { barBg: 'rgba(244, 114, 182, 0.32)', borderColor: 'rgba(249, 168, 212, 0.65)', dot: '#f472b6', glow: 'rgba(244,114,182,0.4)' }  // 樱花粉
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

    // 屏幕旋转或视口缩放时平滑重排
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

    // 确保时间跨度全覆盖：先均匀分段抽取，再随机补齐
    const step = Math.max(1, Math.floor(total / count));
    for (let i = 0; i < count && sampled.length < count; i++) {
      let idx = (i * step + Math.floor(Math.random() * step)) % total;
      while (usedIndices.has(idx) && usedIndices.size < total) {
        idx = (idx + 1) % total;
      }
      usedIndices.add(idx);
      sampled.push(allPhotos[idx]);
    }

    while (sampled.length < count) {
      const idx = Math.floor(Math.random() * total);
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
    this.cardCount = isMobile ? 100 : 140;
    this.cardWidth = isMobile ? 76 : 102;
    this.cardHeight = isMobile ? 100 : 132;

    const count = this.cardCount;

    // --- 1. 双层密集立体爱心 + 桌面边缘浪漫便签 (复刻抖音视频) ---
    // 结构规划：
    // Outer Ring (60%): 外层超密集心形线（如 84 张），每张重叠 70% 形成阶梯立体厚边
    // Inner Ring (30%): 内层同心环绕心形线（如 42 张），填充中层厚度
    // Desktop Satellites (10%): 桌面四周散落的便签（如 14 张），点缀四周
    const cx = w / 2;
    const cy = isMobile ? (h / 2 - 12) : (h / 2 - 10);

    const availW = w - this.cardWidth - (isMobile ? 16 : 48);
    const availH = h - this.cardHeight - (isMobile ? 140 : 160);

    const scaleX = availW / 33;
    const scaleY = availH / 32;
    const scale = Math.min(scaleX, scaleY);

    const outerCount = Math.round(count * 0.60);
    const innerCount = Math.round(count * 0.30);
    const satCount = count - outerCount - innerCount;

    this.heartCoords = [];

    // A. 外层厚重爱心轮廓
    for (let i = 0; i < outerCount; i++) {
      const t = (i / outerCount) * Math.PI * 2;
      const sinT = Math.sin(t);
      const rawX = 16 * Math.pow(sinT, 3);
      const rawY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const x = cx + rawX * scale - this.cardWidth / 2;
      const y = cy + rawY * scale - this.cardHeight / 2;

      const baseRot = Math.max(-18, Math.min(18, Math.cos(t) * 16));
      const rot = baseRot + (Math.random() - 0.5) * 4;

      this.heartCoords.push({
        x: Math.round(x),
        y: Math.round(y),
        rot: Math.round(rot * 10) / 10,
        zIndex: 10 + i
      });
    }

    // B. 内层同心爱心
    const innerScale = scale * 0.76;
    for (let i = 0; i < innerCount; i++) {
      const t = (i / innerCount) * Math.PI * 2;
      const sinT = Math.sin(t);
      const rawX = 16 * Math.pow(sinT, 3);
      const rawY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const x = cx + rawX * innerScale - this.cardWidth / 2;
      const y = (cy + 10) + rawY * innerScale - this.cardHeight / 2;

      const baseRot = Math.max(-16, Math.min(16, Math.cos(t) * 14));
      const rot = baseRot + (Math.random() - 0.5) * 5;

      this.heartCoords.push({
        x: Math.round(x),
        y: Math.round(y),
        rot: Math.round(rot * 10) / 10,
        zIndex: 100 + i
      });
    }

    // C. 桌面四周散落的便签 (抖音原视频桌面背景效果)
    const satAnchors = [
      // Top Left
      { x: 20, y: 80 }, { x: 35, y: 190 }, { x: 120, y: 95 },
      // Top Right
      { x: w - this.cardWidth - 25, y: 85 }, { x: w - this.cardWidth - 40, y: 195 }, { x: w - this.cardWidth - 130, y: 95 },
      // Mid Left & Right
      { x: 18, y: h / 2 - 30 }, { x: w - this.cardWidth - 18, y: h / 2 - 30 },
      // Bottom Left & Right
      { x: 25, y: h - this.cardHeight - 95 }, { x: 135, y: h - this.cardHeight - 90 },
      { x: w - this.cardWidth - 30, y: h - this.cardHeight - 95 }, { x: w - this.cardWidth - 140, y: h - this.cardHeight - 90 },
      // Top Center & Bottom Center
      { x: cx - 180, y: 80 }, { x: cx + 180 - this.cardWidth, y: 80 }
    ];

    for (let i = 0; i < satCount; i++) {
      const anchor = satAnchors[i % satAnchors.length];
      const jx = (Math.random() - 0.5) * 20;
      const jy = (Math.random() - 0.5) * 20;
      const rot = (Math.random() - 0.5) * 22;

      this.heartCoords.push({
        x: Math.round(Math.max(10, Math.min(w - this.cardWidth - 10, anchor.x + jx))),
        y: Math.round(Math.max(75, Math.min(h - this.cardHeight - 85, anchor.y + jy))),
        rot: Math.round(rot * 10) / 10,
        zIndex: 200 + i
      });
    }

    // --- 2. 满屏铺满散开坐标 (140 张密集网格覆盖全屏，无死角铺满) ---
    const padTop = isMobile ? 75 : 85;
    const padBottom = isMobile ? 80 : 90;
    const padSide = isMobile ? 8 : 16;

    const scatterW = w - padSide * 2;
    const scatterH = h - padTop - padBottom;

    const ratio = scatterW / Math.max(1, scatterH);
    let cols = Math.round(Math.sqrt(count * ratio));
    cols = Math.max(isMobile ? 8 : 12, Math.min(isMobile ? 10 : 16, cols));
    const rows = Math.ceil(count / cols);

    const cellW = scatterW / cols;
    const cellH = scatterH / rows;

    const slots = Array.from({ length: cols * rows }, (_, idx) => idx);
    // Fisher-Yates 均匀打散，使向外发散更自然
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

      const jitterX = (Math.random() - 0.5) * (cellW * 0.45);
      const jitterY = (Math.random() - 0.5) * (cellH * 0.45);

      const x = Math.max(4, Math.min(w - this.cardWidth - 4, baseX + jitterX));
      const y = Math.max(padTop - 12, Math.min(h - this.cardHeight - padBottom + 12, baseY + jitterY));
      const rot = (Math.random() - 0.5) * 28;

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

    // 绑定拖拽与点击大图
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
      if (this.currentState === 'building') return;

      isDragging = true;
      hasMoved = false;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      initialX = gsap.getProperty(card, 'x') || 0;
      initialY = gsap.getProperty(card, 'y') || 0;

      card.classList.add('is-dragging');
      card.style.zIndex = '9999';

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

    this.computeCoordinates();

    if (this.selectedPhotos.length === 0 || forceRebuild || this.selectedPhotos.length < this.cardCount) {
      this.selectedPhotos = this.pickRandomPhotos(this.cardCount);
    }

    this.currentState = 'building';

    // 状态栏更新
    if (this.statusText) this.statusText.textContent = '心动轨迹生成中...';
    if (this.counterEl) this.counterEl.textContent = `0 / ${this.cardCount}`;
    if (this.toggleText) this.toggleText.textContent = '散开铺满';
    if (this.toggleIcon) this.toggleIcon.textContent = '✦';

    // 1. 创建所有卡片并初始隐藏在坐标处
    for (let i = 0; i < this.cardCount; i++) {
      const photo = this.selectedPhotos[i % this.selectedPhotos.length];
      const card = this.createCardElement(photo, i);
      const coord = this.heartCoords[i];

      gsap.set(card, {
        x: coord.x,
        y: coord.y,
        rotation: coord.rot + 25,
        scale: 0,
        opacity: 0,
        zIndex: coord.zIndex
      });

      this.stage.appendChild(card);
      this.cards.push(card);
    }

    // 2. 疾速流畅逐张弹出 (26ms 极速快节奏，3.6 秒全量筑成 140 张爱心瀑布)
    const popInterval = 26;
    for (let i = 0; i < this.cardCount; i++) {
      const card = this.cards[i];
      const coord = this.heartCoords[i];

      const timer = setTimeout(() => {
        if (this.currentState !== 'building') return;

        gsap.to(card, {
          scale: 1,
          opacity: 1,
          rotation: coord.rot,
          duration: 0.36,
          ease: 'back.out(1.9)'
        });

        if (this.counterEl) {
          this.counterEl.textContent = `${i + 1} / ${this.cardCount}`;
        }

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
      this.statusText.textContent = `💖 ${this.cardCount} 颗心动瞬间已聚合为爱心`;
    }
    if (this.toggleText) this.toggleText.textContent = '散开铺满';
    if (this.toggleIcon) this.toggleIcon.textContent = '✦';

    // 双重心跳脉动，极具视觉冲击力
    gsap.to(this.cards, {
      scale: 1.05,
      duration: 0.22,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut'
    });

    // 浪漫礼花绽放 (结合细腻高空夜空烟花)
    if (window.app && window.app.fireworks) {
      window.app.fireworks.launch(window.innerWidth * 0.5, window.innerWidth * 0.5, window.innerHeight * 0.28, 'heart');
      setTimeout(() => {
        if (window.app && window.app.fireworks) {
          window.app.fireworks.launch(window.innerWidth * 0.35, window.innerWidth * 0.35, window.innerHeight * 0.38, 'willow');
          window.app.fireworks.launch(window.innerWidth * 0.65, window.innerWidth * 0.65, window.innerHeight * 0.38, 'willow');
        }
      }, 350);
    }
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { x: 0.5, y: 0.46 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#fbbf24', '#c084fc']
      });
    }

    // 停留 1.3 秒后，自动触发“散开铺满整个屏幕”
    const autoScatterTimer = setTimeout(() => {
      if (this.currentState === 'heart') {
        this.scatterFullScreen();
      }
    }, 1300);

    this.activeTimers.push(autoScatterTimer);
  }

  scatterFullScreen() {
    this.clearAllTimers();
    this.currentState = 'scattered';

    if (this.statusText) {
      this.statusText.textContent = `✨ ${this.cardCount} 张美好回忆已铺满屏幕 · 可自由拖拽或点击放大`;
    }
    if (this.toggleText) this.toggleText.textContent = '聚合为心';
    if (this.toggleIcon) this.toggleIcon.textContent = '♥';

    // 140 张照片满屏爆发式散开，铺满整个视口每一个角落
    this.cards.forEach((card, i) => {
      const sc = this.scatterCoords[i];
      if (!sc) return;

      gsap.to(card, {
        x: sc.x,
        y: sc.y,
        rotation: sc.rot,
        scale: 1,
        opacity: 1,
        duration: 1.1 + Math.random() * 0.35,
        delay: (i / this.cardCount) * 0.4,
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
      this.statusText.textContent = `💖 爱心已重新聚合 · 刘禄洋 ♥ 尹珍珠`;
    }
    if (this.toggleText) this.toggleText.textContent = '散开铺满';
    if (this.toggleIcon) this.toggleIcon.textContent = '✦';

    this.cards.forEach((card, i) => {
      const hc = this.heartCoords[i];
      if (!hc) return;

      gsap.to(card, {
        x: hc.x,
        y: hc.y,
        rotation: hc.rot,
        scale: 1,
        opacity: 1,
        duration: 1.0 + Math.random() * 0.28,
        delay: (i / this.cardCount) * 0.32,
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
