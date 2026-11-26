/**
 * EternalEcho - Cinematic Memory Flash Slideshow Engine
 * 电影感极速相册快闪引擎 · 双缓冲 0ms 闪切 · 快门白光爆闪 · 节奏大字穿插
 */

class MemoryFlashSlideshow {
  constructor(options = {}) {
    this.options = Object.assign({
      containerId: 'viewportFlash',
      onOpenLetter: null,
      onToggleMusic: null
    }, options);

    this.photos = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.timer = null;
    this.speed = 240; // 默认 240ms (动感节奏)
    this.enableStrobe = true;
    this.isRandom = false;
    this.bufferToggle = false; // false -> imgA, true -> imgB
    this.photoCountSinceKeyword = 0;
    this.keywordIndex = 0;

    // 经典节奏关键词（提炼自信件与回忆里的高光时刻）
    this.keywords = [
      { kicker: "2021.12.11 · 初遇", title: "故事开始的那天", sub: "第一天打到凌晨4点的电话，心动由此生根" },
      { kicker: "2021.12.25 · 圣诞", title: "你说我不会恋爱", sub: "数着数着，你真成了我最想相守的人" },
      { kicker: "华光花园 75号", title: "信箱里的第一封信", sub: "趴在五楼半窗户的你，笑得那么甜" },
      { kicker: "万源新城 · 深夜", title: "珍珠不哭，珍珠不怕", sub: "带着酒气扑进我怀里，像个委屈的小女孩" },
      { kicker: "万华花园 · 两个月", title: "两个人的人间烟火", sub: "解锁了无数道菜，热腾腾地度过整个春天" },
      { kicker: "那些去过的地方", title: "景德镇的烟火与套房", sub: "阜阳卷馍、西湖雨落、金山没看全的海边" },
      { kicker: "晴天 · 约定", title: "我们一起等晴天", sub: "下雨了没一起等，但我的心一直在原地" },
      { kicker: "时光足迹 · 545 张照片", title: "1782 天的深情", sub: "爱能抵万难，失去你是我最大的遗憾" },
      { kicker: "初心不改 · FOREVER", title: "每一刻都有你", sub: "带给我的温柔与习惯，融进往后的一生" }
    ];

    this.initDOMElements();
    this.loadPhotosData();
    this.bindEvents();
  }

  initDOMElements() {
    this.viewport = document.getElementById('viewportFlash');
    this.imgA = document.getElementById('flashImgA');
    this.imgB = document.getElementById('flashImgB');
    this.strobeOverlay = document.getElementById('flashStrobeOverlay');
    this.keywordOverlay = document.getElementById('flashKeywordOverlay');
    this.keywordKicker = document.getElementById('flashKeywordKicker');
    this.keywordText = document.getElementById('flashKeywordText');
    this.keywordSub = document.getElementById('flashKeywordSub');
    this.dateEl = document.getElementById('flashPhotoDate');
    this.titleEl = document.getElementById('flashPhotoTitle');
    this.counterEl = document.getElementById('flashCounter');
    this.progressBar = document.getElementById('flashProgressBar');
    this.playPauseBtn = document.getElementById('flashPlayPauseBtn');
    this.playIcon = document.getElementById('flashPlayIcon');
    this.finaleCard = document.getElementById('flashFinaleCard');
  }

  loadPhotosData() {
    if (typeof window.REAL_COUPLE_PHOTOS !== 'undefined' && Array.isArray(window.REAL_COUPLE_PHOTOS)) {
      this.photos = window.REAL_COUPLE_PHOTOS.filter(p => p && p.url && !p.isClimaxLetter);
    } else {
      this.photos = [];
    }
  }

  bindEvents() {
    // 播放/暂停按钮
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.togglePlay();
      });
    }

    // 速度切换
    document.querySelectorAll('.flash-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.flash-speed-btn').forEach(b => b.classList.remove('active', 'bg-white/20', 'text-white', 'font-bold'));
        btn.classList.add('active', 'bg-white/20', 'text-white', 'font-bold');
        this.speed = parseInt(btn.dataset.speed, 10) || 240;
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    });

    // 爆闪开关
    const strobeBtn = document.getElementById('flashStrobeToggleBtn');
    if (strobeBtn) {
      strobeBtn.addEventListener('click', () => {
        this.enableStrobe = !this.enableStrobe;
        strobeBtn.textContent = this.enableStrobe ? '⚡ 爆闪: 开' : '⚡ 爆闪: 关';
        strobeBtn.classList.toggle('text-amber-300', this.enableStrobe);
        strobeBtn.classList.toggle('border-amber-400/30', this.enableStrobe);
        strobeBtn.classList.toggle('text-zinc-400', !this.enableStrobe);
      });
    }

    // 顺序 / 随机模式
    const modeBtn = document.getElementById('flashModeToggleBtn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        this.isRandom = !this.isRandom;
        modeBtn.textContent = this.isRandom ? '🎲 记忆随机' : '⏳ 时光顺序';
        modeBtn.classList.toggle('text-rose-300', this.isRandom);
      });
    }

    // 音乐播放联动
    const musicBtn = document.getElementById('flashMusicBtn');
    if (musicBtn && typeof this.options.onToggleMusic === 'function') {
      musicBtn.addEventListener('click', () => {
        this.options.onToggleMusic();
      });
    }

    // 退出快闪
    const exitBtn = document.getElementById('flashExitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.stop();
        if (window.app && typeof window.app.switchMode === 'function') {
          window.app.switchMode('galaxy');
          const heartTab = document.querySelector('.nav-tab[data-shape="heart"]');
          if (heartTab) {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            heartTab.classList.add('active');
            if (window.app.sphereGallery) window.app.sphereGallery.applyLayout('heart');
          }
        }
      });
    }

    // 前往长信
    const toLetterBtn = document.getElementById('flashToLetterBtn');
    if (toLetterBtn) {
      toLetterBtn.addEventListener('click', () => {
        this.stop();
        if (typeof this.options.onOpenLetter === 'function') {
          this.options.onOpenLetter();
        }
      });
    }

    // 重新播放快闪
    const replayBtn = document.getElementById('flashReplayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        if (this.finaleCard) {
          this.finaleCard.classList.remove('opacity-100', 'pointer-events-auto');
          this.finaleCard.classList.add('opacity-0', 'pointer-events-none');
        }
        this.currentIndex = 0;
        this.keywordIndex = 0;
        this.photoCountSinceKeyword = 0;
        this.play();
      });
    }

    // 键盘空格键快捷控制
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && window.app && window.app.currentMode === 'flash') {
        e.preventDefault();
        this.togglePlay();
      }
    });
  }

  start() {
    if (this.photos.length === 0) {
      this.loadPhotosData();
    }
    if (this.finaleCard) {
      this.finaleCard.classList.remove('opacity-100', 'pointer-events-auto');
      this.finaleCard.classList.add('opacity-0', 'pointer-events-none');
    }
    this.renderCurrentPhoto(true);
    this.play();
  }

  stop() {
    this.pause();
    if (this.keywordOverlay) {
      this.keywordOverlay.classList.remove('active');
    }
    if (this.strobeOverlay) {
      this.strobeOverlay.classList.remove('flash-strobe-active');
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    if (this.playIcon) this.playIcon.textContent = '⏸';

    // 尝试在快闪启动时联动播放音乐（如未开启）
    if (window.app && !window.app.isPlayingMusic && typeof window.app.toggleMusic === 'function') {
      window.app.toggleMusic();
    }

    this.scheduleNextTick();
  }

  pause() {
    this.isPlaying = false;
    if (this.playIcon) this.playIcon.textContent = '▶';
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;
    this.timer = setTimeout(() => {
      this.step();
      if (this.isPlaying) {
        this.scheduleNextTick();
      }
    }, this.speed);
  }

  step() {
    if (this.photos.length === 0) return;

    // 检查是否插播高能关键词大字
    this.photoCountSinceKeyword++;
    if (this.photoCountSinceKeyword >= 12 && this.keywords.length > 0) {
      this.showKeywordInterlude();
      this.photoCountSinceKeyword = 0;
      return;
    }

    if (this.isRandom) {
      this.currentIndex = Math.floor(Math.random() * this.photos.length);
    } else {
      this.currentIndex++;
      if (this.currentIndex >= this.photos.length) {
        this.onFinish();
        return;
      }
    }

    this.renderCurrentPhoto();
  }

  showKeywordInterlude() {
    const kw = this.keywords[this.keywordIndex % this.keywords.length];
    this.keywordIndex++;

    if (this.keywordOverlay && this.keywordText) {
      if (this.keywordKicker) this.keywordKicker.textContent = kw.kicker;
      this.keywordText.textContent = kw.title;
      if (this.keywordSub) this.keywordSub.textContent = kw.sub;

      this.keywordOverlay.classList.add('active');

      // 伴随白光快门爆闪
      if (this.enableStrobe && this.strobeOverlay) {
        this.strobeOverlay.classList.add('flash-strobe-active');
        setTimeout(() => {
          if (this.strobeOverlay) this.strobeOverlay.classList.remove('flash-strobe-active');
        }, 90);
      }

      // 大字稍作停留后淡出，恢复照片快闪
      setTimeout(() => {
        if (this.keywordOverlay) this.keywordOverlay.classList.remove('active');
      }, Math.max(this.speed * 1.5, 380));
    }
  }

  renderCurrentPhoto(instant = false) {
    const photo = this.photos[this.currentIndex];
    if (!photo) return;

    const imgUrl = photo.thumb || photo.thumbUrl || photo.url;
    const currentLayer = this.bufferToggle ? this.imgB : this.imgA;
    const nextLayer = this.bufferToggle ? this.imgA : this.imgB;

    if (nextLayer) {
      nextLayer.src = imgUrl;
      nextLayer.classList.remove('zooming');
      // 强制微动画重绘
      void nextLayer.offsetWidth;
      nextLayer.classList.add('zooming');
      nextLayer.classList.add('active');
    }

    if (currentLayer) {
      currentLayer.classList.remove('active');
    }

    this.bufferToggle = !this.bufferToggle;

    // 白光爆闪
    if (this.enableStrobe && !instant && this.strobeOverlay) {
      this.strobeOverlay.classList.add('flash-strobe-active');
      setTimeout(() => {
        if (this.strobeOverlay) this.strobeOverlay.classList.remove('flash-strobe-active');
      }, 55);
    }

    // 更新 HUD 计数与日期
    if (this.counterEl) {
      const idxStr = String(this.currentIndex + 1).padStart(3, '0');
      this.counterEl.textContent = `${idxStr} / ${this.photos.length}`;
    }

    if (this.dateEl) {
      this.dateEl.textContent = photo.month || (photo.date ? photo.date.slice(0, 7) : '回忆瞬间');
    }

    if (this.titleEl) {
      this.titleEl.textContent = photo.title || '相爱时刻';
    }

    if (this.progressBar) {
      const pct = ((this.currentIndex + 1) / this.photos.length) * 100;
      this.progressBar.style.width = `${pct}%`;
    }

    // 预热预加载未来 5 张缩略图，避免极速快闪时网络掉帧
    this.preloadAhead(5);
  }

  preloadAhead(count = 5) {
    for (let i = 1; i <= count; i++) {
      const nextIdx = (this.currentIndex + i) % this.photos.length;
      const nextPhoto = this.photos[nextIdx];
      if (nextPhoto) {
        const url = nextPhoto.thumb || nextPhoto.thumbUrl || nextPhoto.url;
        const img = new Image();
        img.src = url;
      }
    }
  }

  onFinish() {
    this.pause();
    if (this.finaleCard) {
      this.finaleCard.classList.remove('opacity-0', 'pointer-events-none');
      this.finaleCard.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }
}

window.MemoryFlashSlideshow = MemoryFlashSlideshow;
