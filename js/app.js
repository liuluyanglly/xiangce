/**
 * EternalEcho - 相册主控
 * 负责视图切换、相伴计时、音乐连播、定制抽屉与礼花。
 */
// Default Romantic Photography Memories (Aesthetic high-res Unsplash links + captions)
const DEFAULT_MEMORIES = [
  {
    id: 1,
    url: 'assets/photos/pic_001_202202.jpg',
    title: '初遇・冬日暖阳',
    date: '2022.12.18',
    desc: '那天风很轻，你在逆光中回眸微笑，世界忽然安静下来。'
  },
  {
    id: 2,
    url: 'assets/photos/pic_043_202206.jpg',
    title: '初夏・你大笑的样子',
    date: '2022.06',
    desc: '室内随手一拍，你笑得眉眼弯弯靠在我肩上。原来最好看的表情，是你毫无防备的开心。'
  },
  {
    id: 3,
    url: 'assets/photos/pic_100_202212.jpg',
    title: '岁末・手心的烟火',
    date: '2022.12',
    desc: '冬夜里点燃一支仙女棒，火花在指尖炸开。再小的光，也把那个晚上照得亮亮的。'
  },
  {
    id: 4,
    url: 'assets/photos/pic_120_202301.jpg',
    title: '新年・试围巾的冬日',
    date: '2023.01',
    desc: '新的一年，你围着围巾在房间里问我好不好看。好不好看不知道，反正我看了很久。'
  },
  {
    id: 5,
    url: 'assets/photos/pic_160_202306.jpg',
    title: '盛夏・餐厅的午后',
    date: '2023.06',
    desc: '热带绿植墙前的自拍，你认真挑了口红色号。我负责看你，也负责买单。'
  },
  {
    id: 6,
    url: 'assets/photos/pic_300_202311.jpg',
    title: '深秋・出门赴约',
    date: '2023.11',
    desc: '十一月你拍了好多照片，出门前的这张最像你：着急、模糊、但兴高采烈。'
  },
  {
    id: 7,
    url: 'assets/photos/pic_475_202402.jpg',
    title: '心愿・生日快乐',
    date: '2024.02',
    desc: '「生日快乐」灯牌亮起来，蛋糕、红酒和满满一桌菜。你闭眼许愿的时候，我在旁边偷偷看着你。'
  },
  {
    id: 8,
    url: 'assets/photos/pic_523_202601.jpg',
    title: '此刻・未完待续',
    date: 'Forever',
    desc: '四年过去，你还是喜欢靠在我肩上比个耶。照片会一直拍下去，我们的故事也是。'
  }
];
class EternalApp {
  constructor() {
    this.storageKey = 'eternal_echo_data_v3';
    this.state = this.loadState();
    
    this.currentMode = 'galaxy';
    this.currentModalIndex = 0;
    this.currentShowcaseIndex = 0;
    this.isModalSlideshowPlaying = false;
    this.modalSlideshowTimer = null;
    this.showcaseTimer = null;
    this.isShowcasePlaying = true;
    this.isImgZoomed = false;
    this.neuralNet = null;
    this.sphereGallery = null;
    this.heartTrailGallery = null;
    this.fireworks = null;
    window.app = this;
    // Sequential Audio Playlist System (Auto-Chained: 《第57次取消发送》 -> 《理想三旬》 -> 《晴天》 -> 视频原声)
    this.playlist = [
      {
        id: 'di57ciquxiaofasong',
        title: '第57次取消发送',
        artist: '菲菲公主',
        type: 'song',
        src: 'assets/audio/di57ciquxiaofasong.mp3',
        badge: '🔥 热门主打恋曲'
      },
      {
        id: 'wanfengshaozoujiunian',
        title: '晚风捎走旧念',
        artist: '陆扬',
        type: 'song',
        src: 'assets/audio/wanfengshaozoujiunian.m4a',
        badge: '🌙 汽水音乐心动热榜'
      },
      {
        id: 'lixiangsanxun',
        title: '理想三旬',
        artist: '陈鸿宇',
        type: 'song',
        src: 'assets/audio/lixiangsanxun.mp3',
        badge: '🎵 官方浪漫主题曲'
      },
      {
        id: 'qingtian',
        title: '晴天',
        artist: '周杰伦',
        type: 'song',
        src: 'assets/audio/qingtian.mp3',
        badge: '🎵 经典心动恋曲'
      },
      {
        id: 'video_audio_1',
        title: '平安夜录像原声独白',
        artist: '我们的记忆原声音频',
        type: 'video_audio',
        src: 'assets/audio/video_memory_audio.m4a',
        videoRef: 'assets/videos/VID_20221224_041448.mp4',
        badge: '🎬 视频原声音频'
      },
      {
        id: 'video_audio_2',
        title: '跨年夜钟声心跳原声',
        artist: '我们的记忆原声音频',
        type: 'video_audio',
        src: 'assets/audio/video_memory_audio_2.m4a',
        videoRef: 'assets/videos/VID_20221231_210040.mp4',
        badge: '🎬 跨年原声音频'
      }
    ];
    this.currentTrackIndex = 0;
    this.isPlayingMusic = false;
    // Prioritize high-performance native audio element hosted in DOM
    this.audioElement = document.getElementById('mainBgmAudio') || new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.volume = 1.0;
    this.audioElement.muted = false;
    if (!this.audioElement.src || this.audioElement.src === '' || this.audioElement.src === window.location.href) {
      this.audioElement.src = this.playlist[0].src;
    }
    // Direct event-driven state synchronization
    this.audioElement.addEventListener('play', () => {
      this.isPlayingMusic = true;
      this.syncMusicUI(true);
      if (this.sphereGallery) {
        this.sphereGallery.setMusicPlaying(true);
      }
    });
    this.audioElement.addEventListener('pause', () => {
      this.isPlayingMusic = false;
      this.syncMusicUI(false);
      if (this.sphereGallery) {
        this.sphereGallery.setMusicPlaying(false);
      }
    });
    // Automatic Sequential Transition: When song finishes, advance to next track in playlist!
    this.audioElement.addEventListener('ended', () => {
      console.log('Track finished, auto-playing next track in sequence!');
      this.playNextTrack();
    });
    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error on current track, advancing to next track:', e);
      setTimeout(() => {
        this.playNextTrack();
      }, 500);
    });
    this.init();
  }
  loadState() {
    const defaultPhotos = (typeof window.REAL_COUPLE_PHOTOS !== 'undefined' && window.REAL_COUPLE_PHOTOS.length > 0)
      ? window.REAL_COUPLE_PHOTOS
      : DEFAULT_MEMORIES;
    // 清理所有历史旧缓存，确保姓名与起始时间无条件即刻生效
    try {
      localStorage.clear();
    } catch (e) {}
    return {
      lover1: '尹珍珠',
      lover2: '刘禄洋',
      startDate: '2021-12-11T23:00:00',
      loveQuote: '从2021年冬天的初遇，到岁月长河里的每一刻相伴，唯爱永恒。',
      photos: defaultPhotos
    };
  }
  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }
  init() {
    // 0. Enable anti-copy and image download protection
    this.initSecurityProtection();
    // 1. Setup UI Elements
    this.renderCoupleInfo();
    this.startLoveTimer();
    // 2. Initialize Neural Synapse Canvas
    try {
      this.neuralNet = new NeuralSynapseNetwork('neuralCanvas');
    } catch (e) {
      console.warn('Neural canvas note:', e);
    }
    // 2b. Initialize Cinematic Romantic Fireworks Engine (殿堂级细腻夜空烟花)
    if (typeof RomanticFireworks !== 'undefined') {
      try {
        this.fireworks = new RomanticFireworks('fireworksCanvas');
      } catch (e) {
        console.warn('Romantic fireworks note:', e);
      }
    }
    // 3. Initialize Master 3D Spatial Gallery (CelestialSphereGallery)
    if (document.getElementById('sphereContainer') && typeof CelestialSphereGallery !== 'undefined') {
      this.sphereGallery = new CelestialSphereGallery('sphereContainer', {
        onSelectPhoto: (photo) => this.showArtworkModal(photo),
        onShowLetter: () => this.showClimaxModal(),
        onCarouselBatchChange: (info) => this.updateCarouselBatchUI(info)
      });
      this.sphereGallery.loadPhotos(this.state.photos);
    }
    // 5. Initialize Heart Trail & Fullscreen Polaroid Scatter Engine
    if (document.getElementById('viewportHeartTrail') && typeof HeartTrailGallery !== 'undefined') {
      try {
        this.heartTrailGallery = new HeartTrailGallery(this);
      } catch (e) {
        console.warn('Heart trail gallery note:', e);
      }
    }
    // 时光足迹等第一次打开再排版，避免和 3D 爱心抢主线程。
    this.storylineReady = false;
    this.initMonthFilterBar();
    document.addEventListener('visibilitychange', () => this.syncHeavyLoops());
    // 7. Bind All Listeners
    this.bindDOMEvents();
    // 9. Ensure 3D Heart tab is cleanly visible on mobile H5
    const navTabs = document.querySelector('.island-nav-tabs');
    if (navTabs) navTabs.scrollLeft = 0;
    // 10. Attempt direct unmuted audio playback immediately on page open
    this.attemptDirectAutoplay();
  }
  initMonthFilterBar() {
    const container = document.getElementById('monthFilterBar') || document.getElementById('monthFilterContainer');
    if (!container) return;
    container.innerHTML = '';
    
    // '全部' pill
    const allPill = document.createElement('button');
    allPill.className = 'month-pill active';
    allPill.innerHTML = `<span>♥ 全部回忆 (${this.state.photos.length})</span>`;
    allPill.addEventListener('click', () => {
      document.querySelectorAll('.month-pill').forEach(p => p.classList.remove('active'));
      allPill.classList.add('active');
      this.filterByMonth('all');
    });
    container.appendChild(allPill);
    // Group photos dynamically by month
    const monthStats = {};
    this.state.photos.forEach(p => {
      const m = p.month || (p.date ? p.date.slice(0, 7) : '其他');
      monthStats[m] = (monthStats[m] || 0) + 1;
    });
    // Sort months in chronological order
    const sortedMonths = Object.keys(monthStats).sort();
    sortedMonths.forEach(m => {
      const pill = document.createElement('button');
      pill.className = 'month-pill';
      pill.innerHTML = `<span>${m} (${monthStats[m]})</span>`;
      pill.addEventListener('click', () => {
        document.querySelectorAll('.month-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterByMonth(m);
      });
      container.appendChild(pill);
    });
  }
  filterByMonth(month) {
    if (this.currentMode === 'storyline') {
      if (month === 'all') {
        const viewport = document.getElementById('viewportStoryline');
        if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetSection = document.getElementById(`month-section-${month}`);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }
    let filtered = this.state.photos;
    if (month !== 'all') {
      filtered = this.state.photos.filter(p => p.month === month);
    }
    if (filtered.length === 0) return;
    if (this.sphereGallery) this.sphereGallery.loadPhotos(filtered);
  }
  ensureStoryline() {
    if (this.storylineReady) return;
    this.renderStorylineMonths();
  }
  syncHeavyLoops() {
    const on = this.currentMode === 'galaxy' && !document.hidden;
    if (this.sphereGallery && typeof this.sphereGallery.setRunning === 'function') {
      this.sphereGallery.setRunning(on);
    }
    if (this.neuralNet && typeof this.neuralNet.setRunning === 'function') {
      this.neuralNet.setRunning(on);
    }
  }
  renderStorylineMonths() {
    const container = document.getElementById('storylineMonthsContainer');
    if (!container) return;
    this.storylineReady = true;
    this.photoById = new Map(this.state.photos.map(photo => [String(photo.id), photo]));
    container.innerHTML = '';
    // Group all photos dynamically by month
    const groups = {};
    this.state.photos.forEach(p => {
      const m = p.month || (p.date ? p.date.slice(0, 7) : '其他');
      p.month = m;
      if (!groups[m]) groups[m] = [];
      groups[m].push(p);
    });
    // Provide default meta lookup from REAL_MONTHS_SUMMARY
    const metaMap = {};
    if (typeof window.REAL_MONTHS_SUMMARY !== 'undefined') {
      window.REAL_MONTHS_SUMMARY.forEach(item => {
        metaMap[item.month] = item;
      });
    }
    const sortedMonths = Object.keys(groups).sort();
    sortedMonths.forEach(month => {
      const groupPhotos = groups[month];
      if (groupPhotos.length === 0) return;
      const meta = metaMap[month] || {
        title: `${month} 独家甜蜜回忆`,
        desc: '定格每一个闪闪发光的瞬间，爱在日常，岁岁年年。'
      };
      const section = document.createElement('section');
      section.className = 'memory-chapter';
      section.id = `month-section-${month}`;
      const esc = (value) => String(value || '').replace(/[&<>"]/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
      }[ch]));
      let photosHtml = '';
      groupPhotos.forEach((photo) => {
        const thumbUrl = photo.thumb || photo.thumbUrl || (photo.url ? photo.url.replace('/photos/', '/thumbs/') : photo.url);
        photosHtml += `
          <button type="button" class="memory-tile" data-id="${esc(photo.id)}">
            <img src="${thumbUrl}" onerror="this.src='${photo.url}'" alt="${esc(photo.title)}" decoding="async" loading="lazy" />
            ${photo.isClimaxLetter ? `<span class="memory-letter"><span>✉</span><span>回忆长信</span></span>` : ''}
            ${photo.isVideo ? `<span class="memory-play" aria-hidden="true">▶</span><span class="memory-video-tag">录像</span>` : ''}
            <span class="memory-caption">
              <span class="memory-date">${esc(photo.date || month)}</span>
              <span class="memory-title">${esc(photo.title)}</span>
            </span>
          </button>
        `;
      });
      section.innerHTML = `
        <header class="memory-chapter-head">
          <div>
            <span class="memory-month">${esc(month)}</span>
            <h3>${esc(meta.title)}</h3>
            <p>${esc(meta.desc)}</p>
          </div>
          <span class="memory-count">${groupPhotos.length} 张</span>
        </header>
        <div class="memory-grid">${photosHtml}</div>
      `;
      container.appendChild(section);
    });
  }
  showClimaxModal() {
    const modal = document.getElementById('climaxLetterModal');
    const card = document.getElementById('climaxLetterCard');
    if (modal) {
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100');
    }
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }
    // Instant visual feedback on top nav
    const climaxBtn = document.getElementById('navClimaxLetterBtn');
    if (climaxBtn) {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      climaxBtn.classList.add('active');
    }
    // Non-blocking festive celebration
    requestAnimationFrame(() => {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 45,
          spread: 75,
          origin: { y: 0.58 },
          colors: ['#fbbf24', '#f43f5e', '#ffffff']
        });
      }
    });
  }
  hideClimaxModal(restoreNav = false, resetCamera = false) {
    const modal = document.getElementById('climaxLetterModal');
    const card = document.getElementById('climaxLetterCard');
    if (modal) {
      modal.classList.add('opacity-0', 'pointer-events-none');
      modal.classList.remove('opacity-100');
    }
    if (card) {
      card.classList.add('scale-95');
      card.classList.remove('scale-100');
    }
    // Only restore previous active tab if explicitly requested (e.g., closing popup manually)
    if (restoreNav) {
      if (this.currentMode === 'storyline') {
        const storyTab = document.getElementById('navStorylineBtn');
        if (storyTab) {
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          storyTab.classList.add('active');
          return;
        }
      } else if (this.currentMode === 'heart-trail') {
        const trailTab = document.getElementById('navHeartTrailBtn');
        if (trailTab) {
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          trailTab.classList.add('active');
          return;
        }
      }
      const curShape = (this.sphereGallery && this.sphereGallery.currentShape) || 'heart';
      const activeTab = document.querySelector(`.nav-tab[data-shape="${curShape}"]`);
      if (activeTab) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        activeTab.classList.add('active');
      }
    }
    if (resetCamera && this.sphereGallery && typeof this.sphereGallery.resetCameraFocus === 'function') {
      this.sphereGallery.resetCameraFocus();
    }
  }
  renderCoupleInfo() {
    const titleEl = document.getElementById('coupleTitle');
    const heroTitleEl = document.getElementById('heroCoupleTitle');
    const quoteEl = document.getElementById('heroQuote');
    const coupleText = `${this.state.lover1 || '尹珍珠'} & ${this.state.lover2 || '刘禄洋'} ♥`;
    if (titleEl) titleEl.textContent = coupleText;
    if (heroTitleEl) heroTitleEl.textContent = coupleText;
    if (quoteEl) quoteEl.textContent = `"${this.state.loveQuote}"`;
    this.updateMemoryStats();
  }
  updateMemoryStats() {
    const statsEl = document.getElementById('headerMediaCounter') || document.getElementById('headerMemoryStats');
    if (statsEl && this.state && this.state.photos) {
      const count = this.state.photos.length;
      const videoCount = this.state.photos.filter(p => p.isVideo).length;
      statsEl.textContent = `已珍藏 ${count} 处专属回忆${videoCount > 0 ? ` · ${videoCount} 部动态录像` : ''}`;
    }
  }
  startLoveTimer() {
    const update = () => {
      const dateStr = (this.state.startDate || '2021-12-11T23:00:00').replace(' ', 'T');
      const start = new Date(dateStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, now - start);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val).padStart(2, '0');
      };
      setEl('timerDays', days);
      setEl('timerHours', hours);
      setEl('timerMinutes', minutes);
      setEl('timerSeconds', seconds);
      const headerTimer = document.getElementById('headerLoveTimer');
      if (headerTimer) {
        headerTimer.textContent = `已相伴 ${days}天 ${hours}时 ${minutes}分 ${seconds}秒`;
      }
    };
    update();
    setInterval(update, 1000);
  }
  switchMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    if (mode === 'storyline') this.ensureStoryline();
    this.syncHeavyLoops();
    const galaxyEl = document.getElementById('viewportGalaxy');
    const storylineEl = document.getElementById('viewportStoryline');
    const heartTrailEl = document.getElementById('viewportHeartTrail');
    // Always securely close any open fullscreen popups when switching viewports
    this.hideArtworkModal();
    this.hideClimaxModal();
    if (mode === 'galaxy') {
      if (storylineEl) {
        storylineEl.classList.add('hidden-view');
      }
      if (heartTrailEl) {
        heartTrailEl.classList.add('hidden-view');
      }
      if (this.heartTrailGallery) {
        this.heartTrailGallery.deactivate();
      }
      if (galaxyEl) {
        galaxyEl.classList.remove('hidden-view');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(galaxyEl, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
        }
      }
      // Viewport switched to galaxy; target shape will be applied directly by caller
    } else if (mode === 'storyline') {
      if (galaxyEl) {
        galaxyEl.classList.add('hidden-view');
      }
      if (heartTrailEl) {
        heartTrailEl.classList.add('hidden-view');
      }
      if (this.heartTrailGallery) {
        this.heartTrailGallery.deactivate();
      }
      if (storylineEl) {
        storylineEl.classList.remove('hidden-view');
        storylineEl.scrollTop = 0;
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(storylineEl, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
        }
      }
    } else if (mode === 'heart-trail') {
      if (galaxyEl) {
        galaxyEl.classList.add('hidden-view');
      }
      if (storylineEl) {
        storylineEl.classList.add('hidden-view');
      }
      if (heartTrailEl) {
        heartTrailEl.classList.remove('hidden-view');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(heartTrailEl, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
        }
      }
      if (this.heartTrailGallery) {
        this.heartTrailGallery.activate();
      }
    }
  }
  toggleMusic() {
    const track = this.playlist[this.currentTrackIndex] || this.playlist[0];
    const trackUrl = track.src;
    if (!this.audioElement.src || !this.audioElement.src.includes(trackUrl)) {
      this.audioElement.src = trackUrl;
    }
    if (this.audioElement.paused) {
      this.audioElement.volume = 1.0;
      this.audioElement.muted = false;
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.showToast(`🎶 正在播放：${track.title} · ${track.artist}`);
        }).catch(err => {
          console.warn('Play restricted or deferred:', err);
        });
      }
    } else {
      this.audioElement.pause();
      this.showToast('⏸ 已暂停播放');
    }
  }
  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const track = this.playlist[this.currentTrackIndex];
    this.syncMusicUI(true);
    this.audioElement.src = track.src;
    this.audioElement.volume = 1.0;
    this.audioElement.muted = false;
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.showToast(`🎶 正在播放：${track.title} · ${track.artist}`);
      }).catch(err => {
        console.warn('Track play restricted:', err);
      });
    }
  }
  playNextTrack() {
    this.playTrack((this.currentTrackIndex + 1) % this.playlist.length);
  }
  playPrevTrack() {
    this.playTrack((this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length);
  }
  syncMusicUI(isPlaying) {
    const track = this.playlist[this.currentTrackIndex] || this.playlist[0];
    const quickTitle = document.getElementById('quickMusicTitle');
    if (quickTitle) quickTitle.textContent = track.title;
    document.querySelectorAll('.audio-bar').forEach(bar => {
      bar.classList.toggle('playing', isPlaying);
    });
  }
  showToast(message) {
    const container = document.getElementById('toastContainer');
    const msgEl = document.getElementById('toastMessage');
    if (!container || !msgEl) return;
    msgEl.textContent = message;
    container.classList.add('is-on');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => container.classList.remove('is-on'), 2800);
  }
  celebrateHeart() {
    // 1. 触发心动礼花按钮微缩放光晕动画
    const heartBtn = document.getElementById('celebrateBtn');
    if (heartBtn && typeof gsap !== 'undefined') {
      gsap.fromTo(heartBtn, { scale: 0.8 }, { scale: 1.25, duration: 0.28, yoyo: true, repeat: 1, ease: 'back.out(2)' });
    }

    // 2. 背景微弱突触光流涌动
    if (this.neuralNet) {
      this.neuralNet.triggerSynapticSurge(25);
    }

    // 3. 殿堂级浪漫烟花盛宴 (爱心烟花 + 金柳垂瀑 + 璀璨星芒菊花)
    if (this.fireworks) {
      this.fireworks.celebrateGrandShow();
    }

    // 4. 精美微细流金辅助粒子 (保留柔和质感)
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#f43f5e', '#fbbf24', '#fda4af', '#ffffff']
      });
    }
  }
  initSecurityProtection() {
    // 1. Prevent Right-Click Context Menu globally
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    // 2. Prevent dragging images to save on desktop/mobile
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS') {
        e.preventDefault();
        return false;
      }
    });
    // 3. Block keyboard shortcuts for saving / inspecting source
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
    });
  }
  // -------------------------------------------------------------
  // Floating Memory Showcase Dock (MotionSites Luxury Cinema)
  // "点卡的时候自动变化，点击后，就从这一张，轮放在页面放大替换，自动展示详情，在页面局部展示"
  // -------------------------------------------------------------
  showLocalShowcase(item) {
    if (this.hideDockTimer) {
      clearTimeout(this.hideDockTimer);
      this.hideDockTimer = null;
    }
    if (item && item.isClimaxLetter) {
      if (this.sphereGallery) this.sphereGallery.focusClimaxCard();
      this.showClimaxModal();
      return;
    }
    const dock = document.getElementById('localShowcaseDock');
    if (!dock) return;
    // 找到被点击卡片在相册列表中的索引（“就从这一张开始”）
    const foundIdx = this.state.photos.findIndex(p => p.url === item.url || p.id === item.id);
    this.currentShowcaseIndex = foundIdx !== -1 ? foundIdx : 0;
    dock.classList.remove('hidden'); dock.style.display = 'block';
    dock.classList.remove('opacity-0');
    dock.classList.add('opacity-100');
    this.isShowcasePlaying = true;
    this.updateShowcasePlayPauseBtn();
    this.renderShowcaseContent(false);
    this.startShowcaseAutoPlay();
  }
  renderShowcaseContent(animate = true) {
    const item = this.state.photos[this.currentShowcaseIndex];
    if (!item) return;
    const imgEl = document.getElementById('showcaseImg');
    const videoEl = document.getElementById('showcaseVideo');
    const titleEl = document.getElementById('showcaseTitle');
    const dateEl = document.getElementById('showcaseDate');
    const descEl = document.getElementById('showcaseDesc');
    const counterEl = document.getElementById('showcaseCounter');
    const progressBar = document.getElementById('showcaseProgressBar');
    const targetUrl = (window.PHOTO_THUMBS_DATA && window.PHOTO_THUMBS_DATA[item.url])
      ? window.PHOTO_THUMBS_DATA[item.url]
      : item.url;
    if (item.isVideo && item.videoUrl) {
      if (imgEl) imgEl.classList.add('hidden');
      if (videoEl) {
        videoEl.classList.remove('hidden');
        videoEl.src = item.videoUrl;
        videoEl.play().catch(() => {});
      }
    } else {
      if (videoEl) {
        videoEl.pause();
        videoEl.classList.add('hidden');
        videoEl.src = '';
      }
      if (imgEl) {
        imgEl.classList.remove('hidden');
        if (animate && typeof gsap !== 'undefined') {
          gsap.fromTo(imgEl, { opacity: 0.3, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' });
        }
        imgEl.src = targetUrl;
      }
    }
    if (titleEl) titleEl.textContent = item.title || '甜蜜瞬间';
    if (dateEl) dateEl.textContent = item.date || item.month || 'Forever';
    if (descEl) descEl.textContent = item.desc || '每一张照片都是时间写给我们的浪漫情书。';
    if (counterEl) {
      const cur = String(this.currentShowcaseIndex + 1).padStart(2, '0');
      const total = String(this.state.photos.length).padStart(2, '0');
      counterEl.textContent = `${cur} / ${total}`;
    }
    // 重置并启动进度条动画（3.5秒）
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      requestAnimationFrame(() => {
        if (this.isShowcasePlaying) {
          progressBar.style.transition = 'width 4.5s linear';
          progressBar.style.width = '100%';
        }
      });
    }
    // 联动 3D 场景微聚焦
    if (this.sphereGallery && this.sphereGallery.photoMeshes) {
      const mesh = this.sphereGallery.photoMeshes.find(m => m.userData.url === item.url || m.userData.id === item.id);
      if (mesh && typeof gsap !== 'undefined') {
        gsap.to(mesh.scale, {
          x: (mesh.userData.baseScale || 1.0) * 1.18,
          y: (mesh.userData.baseScale || 1.0) * 1.18,
          z: (mesh.userData.baseScale || 1.0) * 1.18,
          duration: 0.5,
          yoyo: true,
          repeat: 1
        });
      }
    }
  }
  startShowcaseAutoPlay() {
    if (this.showcaseTimer) clearTimeout(this.showcaseTimer);
    if (!this.isShowcasePlaying) return;
    this.showcaseTimer = setTimeout(() => {
      this.showcaseNext();
    }, 4500);
  }
  showcaseNext() {
    if (this.state.photos.length === 0) return;
    this.currentShowcaseIndex = (this.currentShowcaseIndex + 1) % this.state.photos.length;
    this.renderShowcaseContent(true);
    this.startShowcaseAutoPlay();
  }
  showcasePrev() {
    if (this.state.photos.length === 0) return;
    this.currentShowcaseIndex = (this.currentShowcaseIndex - 1 + this.state.photos.length) % this.state.photos.length;
    this.renderShowcaseContent(true);
    this.startShowcaseAutoPlay();
  }
  toggleShowcasePlayPause() {
    this.isShowcasePlaying = !this.isShowcasePlaying;
    this.updateShowcasePlayPauseBtn();
    const progressBar = document.getElementById('showcaseProgressBar');
    if (this.isShowcasePlaying) {
      this.renderShowcaseContent(false);
      this.startShowcaseAutoPlay();
    } else {
      if (this.showcaseTimer) clearTimeout(this.showcaseTimer);
      if (progressBar) {
        const computedWidth = window.getComputedStyle(progressBar).width;
        progressBar.style.transition = 'none';
        progressBar.style.width = computedWidth;
      }
    }
  }
  updateShowcasePlayPauseBtn() {
    const playIcon = document.getElementById('showcasePlayIcon');
    const pauseIcon = document.getElementById('showcasePauseIcon');
    if (playIcon && pauseIcon) {
      if (this.isShowcasePlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    }
  }
      closeAllPreviews() {
    // 1. 关闭时光放映台浮窗并清除定时器
    if (this.showcaseTimer) {
      clearTimeout(this.showcaseTimer);
      this.showcaseTimer = null;
    }
    if (this.hideDockTimer) {
      clearTimeout(this.hideDockTimer);
      this.hideDockTimer = null;
    }
    this.isShowcasePlaying = false;
    const dock = document.getElementById('localShowcaseDock');
    if (dock) {
      dock.classList.remove('opacity-100');
      dock.classList.add('opacity-0', 'hidden');
      dock.style.display = 'none';
    }
    const showcaseVideo = document.getElementById('showcaseVideo');
    if (showcaseVideo) {
      showcaseVideo.pause();
      showcaseVideo.classList.add('hidden');
    }
    // 2. 关闭全屏大图灯箱（若存在）
    this.hideArtworkModal();
    // 3. 关闭长信弹窗
    this.hideClimaxModal();
    // 4. 重置 3D 相机对焦，恢复全局宏大视角
    if (this.sphereGallery && typeof this.sphereGallery.resetCameraFocus === 'function') {
      this.sphereGallery.resetCameraFocus();
    }
  }hideLocalShowcase(resetCamera = false) {
    if (this.showcaseTimer) clearTimeout(this.showcaseTimer);
    this.isShowcasePlaying = false;
    const dock = document.getElementById('localShowcaseDock');
    if (dock) {
      dock.classList.remove('opacity-100');
      dock.classList.add('opacity-0');
      if (this.hideDockTimer) clearTimeout(this.hideDockTimer);
      this.hideDockTimer = setTimeout(() => {
        dock.classList.add('hidden');
        this.hideDockTimer = null;
      }, 400);
    }
    if (resetCamera && this.sphereGallery && typeof this.sphereGallery.resetCameraFocus === 'function') {
      this.sphereGallery.resetCameraFocus();
    }
  }
  updateCarouselBatchUI(info) {
    const label = document.getElementById('carouselBatchLabel');
    if (label && info) {
      const current = info.batchCount || info.batchSize || 0;
      label.textContent = `第 ${info.batchIndex + 1} / ${info.totalBatches} 组 · 本组 ${current} 张 / 共 ${info.totalCount} 张`;
    }
  }
  showArtworkModal(item) {
    if (item && item.isClimaxLetter) {
      if (this.sphereGallery) this.sphereGallery.focusClimaxCard();
      this.showClimaxModal();
      return;
    }
    const modal = document.getElementById('artworkModal');
    if (!modal) return;
    // 找到在全部 553 张中的真实索引
    const foundIdx = this.state.photos.findIndex(p => p.url === item.url || p.id === item.id);
    this.currentModalIndex = foundIdx !== -1 ? foundIdx : 0;
    this.renderModalContent();
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
  }
  hideArtworkModal() {
    const modal = document.getElementById('artworkModal');
    if (!modal) return;
    if (this.modalSlideshowTimer) {
      clearTimeout(this.modalSlideshowTimer);
      this.modalSlideshowTimer = null;
    }
    this.isModalSlideshowPlaying = false;
    this.updateModalSlideshowBtn();
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('opacity-0', 'pointer-events-none');
    const vid = document.getElementById('modalVideo');
    if (vid) {
      vid.pause();
      vid.src = '';
    }
  }
  toggleModalSlideshow() {
    this.isModalSlideshowPlaying = !this.isModalSlideshowPlaying;
    this.updateModalSlideshowBtn();
    if (this.isModalSlideshowPlaying) {
      this.renderModalContent();
    } else {
      if (this.modalSlideshowTimer) {
        clearTimeout(this.modalSlideshowTimer);
        this.modalSlideshowTimer = null;
      }
      const bar = document.getElementById('modalProgressBar');
      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
      }
    }
  }
  updateModalSlideshowBtn() {
    const playIcon = document.getElementById('modalPlayIcon');
    const pauseIcon = document.getElementById('modalPauseIcon');
    const playText = document.getElementById('modalPlayText');
    if (playIcon && pauseIcon && playText) {
      if (this.isModalSlideshowPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        playText.textContent = '暂停放映';
      } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        playText.textContent = '自动放映';
      }
    }
  }
  renderModalContent() {
    const item = this.state.photos[this.currentModalIndex];
    if (!item) return;
    if (this.modalSlideshowTimer) {
      clearTimeout(this.modalSlideshowTimer);
      this.modalSlideshowTimer = null;
    }
    const imgEl = document.getElementById('modalImg');
    const videoEl = document.getElementById('modalVideo');
    const counterEl = document.getElementById('modalCounter');
    const dateEl = document.getElementById('modalDate');
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const progressBar = document.getElementById('modalProgressBar');
    if (counterEl) {
      counterEl.textContent = `${String(this.currentModalIndex + 1).padStart(2, '0')} / ${this.state.photos.length}`;
    }
    if (dateEl) dateEl.textContent = item.date || item.month || '';
    if (titleEl) titleEl.textContent = item.title || '甜蜜回忆';
    if (descEl) descEl.textContent = `"${item.desc || '漫长岁月里的独家印记，相视一笑的每一天。'}"`;
    if (item.isVideo && item.videoUrl) {
      if (imgEl) imgEl.classList.add('hidden');
      if (videoEl) {
        videoEl.classList.remove('hidden');
        videoEl.src = item.videoUrl;
        videoEl.play().catch(() => {});
        videoEl.onended = () => {
          if (this.isModalSlideshowPlaying) {
            this.modalNextPhoto();
          }
        };
      }
    } else {
      if (videoEl) {
        videoEl.pause();
        videoEl.classList.add('hidden');
        videoEl.onended = null;
      }
      if (imgEl) {
        imgEl.classList.remove('hidden');
        imgEl.src = item.url;
      }
    }
    // 自动放映进度条与倒计时 (每张留足充裕的 4.5 秒，绝不仅有半秒！)
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      if (this.isModalSlideshowPlaying && (!item.isVideo || !item.videoUrl)) {
        requestAnimationFrame(() => {
          progressBar.style.transition = 'width 4.5s linear';
          progressBar.style.width = '100%';
        });
        this.modalSlideshowTimer = setTimeout(() => {
          if (this.isModalSlideshowPlaying) {
            this.modalNextPhoto();
          }
        }, 4500);
      }
    }
  }
  modalPrevPhoto() {
    if (this.state.photos.length === 0) return;
    this.currentModalIndex = (this.currentModalIndex - 1 + this.state.photos.length) % this.state.photos.length;
    this.renderModalContent();
  }
  modalNextPhoto() {
    if (this.state.photos.length === 0) return;
    this.currentModalIndex = (this.currentModalIndex + 1) % this.state.photos.length;
    this.renderModalContent();
  }
  attemptDirectAutoplay() {
    const audio = this.audioElement;
    if (!audio) return;
    const startPlay = () => {
      if (audio.paused) {
        audio.volume = 1.0;
        audio.muted = false;
        const p = audio.play();
        if (p !== undefined) {
          p.then(() => {
            this.isPlayingMusic = true;
            this.syncMusicUI(true);
            if (this.sphereGallery) this.sphereGallery.setMusicPlaying(true);
          }).catch(err => {
            console.log('Autoplay deferred by browser policy:', err);
          });
        }
      }
    };
    // 1. Immediate unmuted autoplay attempt
    startPlay();
    // 2. WeChat privileged automatic play hook (zero click required in iOS/Android WeChat)
    const runWechatAutoplay = () => {
      if (typeof window.WeixinJSBridge !== 'undefined' && window.WeixinJSBridge.invoke) {
        window.WeixinJSBridge.invoke('getNetworkType', {}, () => startPlay());
      } else {
        startPlay();
      }
    };
    if (typeof window.WeixinJSBridge !== 'undefined') {
      runWechatAutoplay();
    } else {
      document.addEventListener('WeixinJSBridgeReady', runWechatAutoplay, false);
    }
    // 3. Global silent first-touch unlock (zero modal, zero button click needed)
    // Any natural touch/drag on the 3D heart or screen instantly begins audio
    const silentUnlock = () => {
      startPlay();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('touchstart', silentUnlock, { capture: true, passive: true });
      window.removeEventListener('pointerdown', silentUnlock, { capture: true, passive: true });
      window.removeEventListener('mousedown', silentUnlock, { capture: true, passive: true });
      window.removeEventListener('scroll', silentUnlock, { capture: true, passive: true });
      window.removeEventListener('wheel', silentUnlock, { capture: true, passive: true });
    };
    window.addEventListener('touchstart', silentUnlock, { capture: true, passive: true });
    window.addEventListener('pointerdown', silentUnlock, { capture: true, passive: true });
    window.addEventListener('mousedown', silentUnlock, { capture: true, passive: true });
    window.addEventListener('scroll', silentUnlock, { capture: true, passive: true });
    window.addEventListener('wheel', silentUnlock, { capture: true, passive: true });
  }
  bindDOMEvents() {
    const storylineFeed = document.getElementById('storylineMonthsContainer');
    if (storylineFeed) {
      storylineFeed.addEventListener('click', (event) => {
        const tile = event.target.closest('.memory-tile');
        if (!tile || !this.photoById) return;
        const photo = this.photoById.get(tile.dataset.id);
        if (photo) this.showArtworkModal(photo);
      });
    }
    // Top Island Nav: MotionSites Spring Micro-Interactions & Shape Switchers (Instant Single-Click Response)
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const handleSwitch = (e) => {
        if (e) {
          e.preventDefault();
        }
        const shape = tab.dataset.shape;
        const mode = tab.dataset.mode;
        const tabId = tab.id;
        // Visual Active State: Instant UI Highlighting
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // MotionSites Haptic Bounce Feedback
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(tab, { scale: 0.94 }, { scale: 1.0, duration: 0.25, ease: 'back.out(2.0)' });
        }
        this.closeAllPreviews();
        if (tabId === 'navClimaxLetterBtn') {
          this.showClimaxModal();
          if (this.sphereGallery) this.sphereGallery.focusClimaxCard();
        } else if (shape) {
          this.switchMode('galaxy');
          if (this.sphereGallery) this.sphereGallery.applyLayout(shape);
        } else if (mode === 'storyline' || tabId === 'navStorylineBtn') {
          this.switchMode('storyline');
        } else if (mode === 'heart-trail' || tabId === 'navHeartTrailBtn') {
          this.switchMode('heart-trail');
        }
      };
      tab.addEventListener('click', handleSwitch);
    });
    // Celebrate Button
    const heartBtn = document.getElementById('celebrateBtn');
    if (heartBtn) heartBtn.addEventListener('click', () => this.celebrateHeart());
    // Fullscreen Cinema Lightbox Events
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.hideArtworkModal());
    const modalPlayPauseBtn = document.getElementById('modalPlayPauseBtn');
    if (modalPlayPauseBtn) {
      modalPlayPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModalSlideshow();
      });
    }
    const modalBackdrop = document.getElementById('artworkModalBackdrop');
    if (modalBackdrop) modalBackdrop.addEventListener('click', () => this.hideArtworkModal());
    const modalPrevBtn = document.getElementById('modalPrevBtn');
    if (modalPrevBtn) modalPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.modalPrevPhoto();
    });
    const modalNextBtn = document.getElementById('modalNextBtn');
    if (modalNextBtn) modalNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.modalNextPhoto();
    });
    // Keyboard navigation (Arrow keys + Esc)
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('artworkModal');
      const isModalOpen = modal && !modal.classList.contains('opacity-0');
      if (isModalOpen) {
        if (e.key === 'ArrowLeft') {
          this.modalPrevPhoto();
        } else if (e.key === 'ArrowRight') {
          this.modalNextPhoto();
        } else if (e.key === 'Escape') {
          this.hideArtworkModal();
        }
      }
    });
    // Touch Gestures on Mobile Lightbox (Swipe Left/Right to flip, Swipe Down to close, Double-tap to zoom)
    const lightboxArea = document.getElementById('modalFrame');
    const modalImg = document.getElementById('modalImg');
    let touchStartX = 0, touchStartY = 0, lastTapTime = 0;
    if (lightboxArea) {
      lightboxArea.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });
      lightboxArea.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          // Horizontal swipe
          if (absX > 50 && absX > absY) {
            if (deltaX < 0) this.modalNextPhoto();
            else this.modalPrevPhoto();
          } 
          // Pull down to dismiss
          else if (deltaY > 90 && absY > absX) {
            this.hideArtworkModal();
          }
          // Double-tap zoom toggle
          else if (absX < 15 && absY < 15) {
            const now = Date.now();
            if (now - lastTapTime < 350) {
              this.isImgZoomed = !this.isImgZoomed;
              if (modalImg) {
                modalImg.style.transform = this.isImgZoomed ? 'scale(1.5)' : 'scale(1)';
              }
            }
            lastTapTime = now;
          }
        }
      }, { passive: true });
    }
    // Customization Drawer toggle
    const openDrawerBtn = document.getElementById('openDrawerBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    if (openDrawerBtn && drawerBackdrop) {
      openDrawerBtn.addEventListener('click', () => drawerBackdrop.classList.add('active'));
    }
    if (closeDrawerBtn && drawerBackdrop) {
      closeDrawerBtn.addEventListener('click', () => drawerBackdrop.classList.remove('active'));
    }
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('active');
      });
    }
    // Save Drawer Config
    const configForm = document.getElementById('configForm');
    if (configForm) {
      // Pre-fill
      document.getElementById('cfgLover1').value = this.state.lover1;
      document.getElementById('cfgLover2').value = this.state.lover2;
      document.getElementById('cfgStartDate').value = this.state.startDate;
      document.getElementById('cfgQuote').value = this.state.loveQuote;
      configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.state.lover1 = document.getElementById('cfgLover1').value || '尹珍珠';
        this.state.lover2 = document.getElementById('cfgLover2').value || '刘禄洋';
        this.state.startDate = document.getElementById('cfgStartDate').value || '2021-12-11T23:00:00';
        this.state.loveQuote = document.getElementById('cfgQuote').value || '';
        this.saveState();
        this.renderCoupleInfo();
        this.updateMemoryStats();
        this.renderStorylineMonths();
        this.initMonthFilterBar();
        if (this.sphereGallery) this.sphereGallery.loadPhotos(this.state.photos);
        drawerBackdrop.classList.remove('active');
        this.celebrateHeart();
        this.showToast('✨ 专属浪漫定制已保存，所有数据已即刻同步生效！');
      });
    }
    // Universe Top Bar Actions & Playlist Controller Events
    const quickMusicBtn = document.getElementById('quickMusicBtn');
    if (quickMusicBtn) quickMusicBtn.addEventListener('click', () => this.toggleMusic());
    const quickMusicPrevBtn = document.getElementById('quickMusicPrevBtn');
    if (quickMusicPrevBtn) quickMusicPrevBtn.addEventListener('click', () => this.playPrevTrack());
    const quickMusicNextBtn = document.getElementById('quickMusicNextBtn');
    if (quickMusicNextBtn) quickMusicNextBtn.addEventListener('click', () => this.playNextTrack());
    const closeClimaxModalBtn = document.getElementById('closeClimaxModalBtn');
    if (closeClimaxModalBtn) closeClimaxModalBtn.addEventListener('click', () => this.hideClimaxModal(true));
    const climaxModal = document.getElementById('climaxLetterModal');
    if (climaxModal) {
      climaxModal.addEventListener('click', (e) => {
        if (e.target === climaxModal) this.hideClimaxModal(true);
      });
    }
    // Floating Memory Showcase Dock Controls ("局部展示，自动轮放替换")
    
    const showcaseImg = document.getElementById('showcaseImg');
    if (showcaseImg) {
      showcaseImg.style.cursor = 'zoom-in';
      showcaseImg.addEventListener('click', () => {
        if (this.state.photos && this.state.photos[this.currentShowcaseIndex]) {
          this.showArtworkModal(this.state.photos[this.currentShowcaseIndex]);
        }
      });
    }
    const closeShowcaseBtn = document.getElementById('closeShowcaseBtn');
    if (closeShowcaseBtn) closeShowcaseBtn.addEventListener('click', () => this.hideLocalShowcase(true));
    const playPauseShowcaseBtn = document.getElementById('showcasePlayPauseBtn');
    if (playPauseShowcaseBtn) playPauseShowcaseBtn.addEventListener('click', () => this.toggleShowcasePlayPause());
    const nextShowcaseBtn = document.getElementById('showcaseNextBtn');
    if (nextShowcaseBtn) nextShowcaseBtn.addEventListener('click', () => this.showcaseNext());
    const prevShowcaseBtn = document.getElementById('showcasePrevBtn');
    if (prevShowcaseBtn) prevShowcaseBtn.addEventListener('click', () => this.showcasePrev());
    // Photo & Video Upload Handler (FileReader -> base64 persistence & instant sync)
    const photoUploadInput = document.getElementById('photoUploadInput');
    if (photoUploadInput) {
      photoUploadInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        let loadedCount = 0;
        const total = files.length;
        const todayStr = new Date().toISOString().split('T')[0];
        const monthStr = todayStr.slice(0, 7);
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const isVideo = file.type.startsWith('video/');
            const resultUrl = event.target.result;
            this.state.photos.unshift({
              id: Date.now() + Math.random(),
              url: resultUrl,
              videoUrl: isVideo ? resultUrl : undefined,
              isVideo: isVideo,
              month: monthStr,
              title: file.name.replace(/\.[^/.]+$/, ''),
              date: todayStr,
              desc: isVideo ? '在特别的日子里，记录下这闪闪发光的动态瞬间。' : '在特别的日子里，记录下这闪闪发光的瞬间。'
            });
            loadedCount++;
            if (loadedCount === total) {
              // 1. Persist state
              this.saveState();
              // 2. Real-time update left-side header memory statistics (添加多少就展示多少)
              this.updateMemoryStats();
              // 3. Re-render chronological journey & dynamic month filters
              this.renderStorylineMonths();
              this.initMonthFilterBar();
              // 4. Reload 3D spatial photo gallery
              if (this.sphereGallery) this.sphereGallery.loadPhotos(this.state.photos);
                    // 5. Visual celebratory feedback
              this.showToast(`✨ 成功珍藏 ${total} 处新回忆！左侧详情与时光足迹已同步展示全部数据。`);
              this.celebrateHeart();
            }
          };
          reader.readAsDataURL(file);
        });
      });
    }
  }
}
// Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  window.eternalApp = new EternalApp();
  window.app = window.eternalApp;
});
