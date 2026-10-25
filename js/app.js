/**
 * EternalEcho - Master Orchestrator & State Controller
 * Manages mode transitions, love counter, vinyl audio player,
 * configuration drawer, local persistence, and celebration fireworks.
 */

// Default Romantic Photography Memories (Aesthetic high-res Unsplash links + captions)
const DEFAULT_MEMORIES = [
  {
    id: 1,
    url: 'assets/photos/photo_001_202212.jpg',
    title: '初遇・冬日暖阳',
    date: '2022.12.18',
    desc: '那天风很轻，你在逆光中回眸微笑，世界忽然安静下来。'
  },
  {
    id: 2,
    url: 'assets/photos/photo_002_202212.jpg',
    title: '街头的并肩漫步',
    date: '2022.12.24',
    desc: '街角的梧桐叶落，我们并肩走过石板路，聊着关于未来的每一个小梦想。'
  },
  {
    id: 3,
    url: 'assets/photos/photo_003_202212.jpg',
    title: '跨年夜的微光',
    date: '2022.12.31',
    desc: '零点的倒计时声中，漫天烟火升起，我只想留住此刻眼前的你。'
  },
  {
    id: 4,
    url: 'assets/photos/photo_010_202301.jpg',
    title: '初雪的温暖',
    date: '2023.01.15',
    desc: '第一场雪落下来的时候，两只手揣在同一个大衣口袋里，冬天就一点也不冷了。'
  },
  {
    id: 5,
    url: 'assets/photos/photo_025_202302.jpg',
    title: '春风吹过的午后',
    date: '2023.02.14',
    desc: '阳光正盛，树影斑驳，每一寸空气里都弥漫着心动的气息。'
  },
  {
    id: 6,
    url: 'assets/photos/photo_050_202303.jpg',
    title: '平凡生活里的诗意',
    date: '2023.03.20',
    desc: '一起窝在沙发上看电影，锅里炖着热汤，平淡日子也熠熠生辉。'
  },
  {
    id: 7,
    url: 'assets/photos/photo_080_202304.jpg',
    title: '属于我们的约定',
    date: '2023.04.18',
    desc: '在繁花盛开的枝头下许下愿望，愿未来的每一个春夏秋冬，都有彼此相伴。'
  },
  {
    id: 8,
    url: 'assets/photos/photo_120_202305.jpg',
    title: '未完待续的爱恋',
    date: 'Forever',
    desc: '感谢命运让我们相遇，用我所有的温柔与耐心，写完属于我们的诗篇。'
  }
];

// -------------------------------------------------------------
// Offline-Ready Ambient Romantic Web Audio Synthesizer Fallback
// Generates gentle, warm piano-chime arpeggios when external CDN is unreachable
// -------------------------------------------------------------
class RomanticAudioSynth {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.timer = null;
    this.step = 0;

    // Progression: Cmaj9 -> Am9 -> Fmaj7 -> G9sus4
    this.chordProgressions = [
      [130.81, 196.00, 246.94, 329.63, 392.00, 493.88], // Cmaj9
      [110.00, 164.81, 196.00, 261.63, 329.63, 440.00], // Am9
      [87.31,  130.81, 164.81, 220.00, 261.63, 329.63], // Fmaj7
      [98.00,  146.83, 174.61, 220.00, 261.63, 293.66]  // G9sus4
    ];
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(freq, time, duration = 2.4, gainLevel = 0.08) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      // Audio error safe ignore
    }
  }

  start() {
    this.initContext();
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.step = 0;
    this.loop();
  }

  loop() {
    if (!this.isPlaying) return;

    const chordIdx = Math.floor(this.step / 6) % this.chordProgressions.length;
    const chord = this.chordProgressions[chordIdx];
    const noteIdx = this.step % chord.length;
    const freq = chord[noteIdx];

    const now = this.ctx.currentTime;
    this.playNote(freq, now, 2.5, 0.07);

    // Warm root bass note at start of each measure
    if (noteIdx === 0) {
      this.playNote(chord[0] / 2, now, 3.8, 0.10);
    }

    this.step++;
    this.timer = setTimeout(() => this.loop(), 580);
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) clearTimeout(this.timer);
  }
}

class EternalApp {
  constructor() {
    this.storageKey = 'eternal_echo_data_v1';
    this.state = this.loadState();
    
    this.currentMode = 'galaxy'; // galaxy (3D照片墙) | universe | museum | flipbook | storyline
    this.currentModalIndex = 0;
    this.isImgZoomed = false;
    this.neuralNet = null;
    this.cinematicUniverse = null;
    this.sphereGallery = null;
    this.virtualMuseum = null;
    this.flipbook = null;
    this.aiGesture = null;

    // Sequential Audio Playlist System (Auto-Chained: 《理想三旬》 -> 桌面专属视频歌曲/原声 -> 更多回忆原声)
    this.playlist = [
      {
        id: 'lixiangsanxun',
        title: '理想三旬',
        artist: '陈鸿宇',
        type: 'song',
        src: 'assets/audio/lixiangsanxun.mp3',
        fallbackSrc: 'https://music.163.com/song/media/outer/url?id=31445772.mp3',
        badge: '🎵 官方浪漫主题曲'
      },
      {
        id: 'qingtian',
        title: '晴天',
        artist: '周杰伦',
        type: 'song',
        src: 'assets/audio/qingtian.mp3',
        fallbackSrc: 'https://raw.githubusercontent.com/slshenhong/music_file_zhoujielun/main/qingtian.mp3',
        badge: '🎵 经典心动恋曲'
      },
      {
        id: 'desktop_video_song',
        title: '桌面视频专属原声 · 心动画卷',
        artist: '桌面视频 a522e4a749cc31027b9d16480116d157.mp4',
        type: 'video_audio',
        src: 'assets/audio/desktop_video_audio.m4a',
        videoRef: 'assets/videos/a522e4a749cc31027b9d16480116d157.mp4',
        badge: '🎬 桌面视频专属原声'
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
    this.synth = new RomanticAudioSynth();
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.src = this.playlist[0].src;

    // Automatic Sequential Transition: When song finishes, immediately advance to video audio!
    this.audioElement.onended = () => {
      console.log('Track finished, auto-playing next track in sequence!');
      this.playNextTrack();
    };

    this.audioElement.onerror = () => {
      const track = this.playlist[this.currentTrackIndex];
      if (track && track.fallbackSrc) {
        console.warn('Local MP3 failed, trying online stream for', track.title);
        this.audioElement.src = track.fallbackSrc;
        this.audioElement.play().catch(e => {
          console.warn('Falling back to pure Web Audio romantic synthesizer:', e);
          if (this.isPlayingMusic && this.synth) {
            this.synth.start();
          }
        });
      }
    };

    this.init();
  }

  loadState() {
    const defaultPhotos = (typeof window.REAL_COUPLE_PHOTOS !== 'undefined' && window.REAL_COUPLE_PHOTOS.length > 0)
      ? window.REAL_COUPLE_PHOTOS
      : DEFAULT_MEMORIES;

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.photos || parsed.photos.length <= 8 || (parsed.photos[0] && parsed.photos[0].url.includes('unsplash'))) {
          parsed.photos = defaultPhotos;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    return {
      lover1: '亲爱的',
      lover2: '我',
      startDate: '2022-02-14',
      loveQuote: '从2022年春天的初遇，到岁月长河里的每一刻相伴，唯爱永恒。',
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

    // 3. Initialize Master 3D Spatial Gallery (CelestialSphereGallery)
    if (document.getElementById('sphereContainer') && typeof CelestialSphereGallery !== 'undefined') {
      this.sphereGallery = new CelestialSphereGallery('sphereContainer', {
        onSelectPhoto: (photo) => this.showArtworkModal(photo),
        onShowLetter: () => this.showClimaxModal()
      });
      this.sphereGallery.loadPhotos(this.state.photos);
    }

    // 4. Initialize Climax 3D Quantum Hologram Heart
    if (document.getElementById('quantumHeartCanvas') && typeof QuantumNeonHeart !== 'undefined') {
      try {
        this.quantumHeart = new QuantumNeonHeart('quantumHeartCanvas');
      } catch (e) {
        console.warn('Quantum heart note:', e);
      }
    }

    // 5. Initialize AI Vision Gesture Engine
    if (typeof AIGestureEngine !== 'undefined') {
      try {
        this.aiGesture = new AIGestureEngine({
          onHeart: () => this.celebrateHeart(),
          onSwipeLeft: () => this.celebrateHeart(),
          onSwipeRight: () => this.celebrateHeart(),
          onVictory: () => this.celebrateHeart()
        });
      } catch (e) {
        console.warn('AI gesture note:', e);
      }
    }

    // 6. Build Storyline Months
    this.renderStorylineMonths();

    // 7. Bind All Listeners
    this.bindDOMEvents();

    // 8. Auto-dismiss splash screen on first touch/click
    this.setupEntranceOverlay();

    // 9. Attempt direct unmuted audio playback immediately on page open (理想三旬)
    this.attemptDirectAutoplay();
  }

  initMonthFilterBar() {
    const container = document.getElementById('monthFilterContainer');
    if (!container || typeof window.REAL_MONTHS_SUMMARY === 'undefined') return;

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

    // Each month
    window.REAL_MONTHS_SUMMARY.forEach(m => {
      const pill = document.createElement('button');
      pill.className = 'month-pill';
      pill.innerHTML = `<span>${m.month} (${m.count})</span>`;
      pill.addEventListener('click', () => {
        document.querySelectorAll('.month-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterByMonth(m.month);
      });
      container.appendChild(pill);
    });
  }

  filterByMonth(month) {
    let filtered = this.state.photos;
    if (month !== 'all') {
      filtered = this.state.photos.filter(p => p.month === month);
    }
    if (filtered.length === 0) return;

    if (this.sphereGallery) this.sphereGallery.loadPhotos(filtered);
    if (this.virtualMuseum) this.virtualMuseum.loadArtworks(filtered);
    if (this.flipbook) this.flipbook.renderBook(filtered, { lover1: this.state.lover1, lover2: this.state.lover2 });
  }

  renderStorylineMonths() {
    const container = document.getElementById('storylineMonthsContainer');
    if (!container || typeof window.REAL_MONTHS_SUMMARY === 'undefined') return;

    container.innerHTML = '';

    window.REAL_MONTHS_SUMMARY.forEach(group => {
      const groupPhotos = this.state.photos.filter(p => p.month === group.month);
      if (groupPhotos.length === 0) return;

      const section = document.createElement('div');
      section.className = 'double-bezel';

      const inner = document.createElement('div');
      inner.className = 'double-bezel-inner p-5 sm:p-8';

      let photosHtml = '';
      groupPhotos.forEach((photo) => {
        photosHtml += `
          <div class="relative rounded-xl overflow-hidden aspect-[4/3] bg-zinc-900 border border-white/10 group cursor-pointer" onclick="if(window.eternalApp) window.eternalApp.showArtworkModal(${JSON.stringify(photo).replace(/"/g, '&quot;')});">
            <img src="${photo.url}" alt="${photo.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none" loading="lazy" />
            <div class="secure-img-shield"></div>
            ${photo.isVideo ? `
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-10 h-10 rounded-full bg-rose-500/85 backdrop-blur-md flex items-center justify-center text-white shadow-lg shadow-rose-500/40 group-hover:scale-110 transition-transform">
                  <span class="ml-0.5 text-xs">▶</span>
                </div>
              </div>
              <div class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 backdrop-blur-md text-[9px] font-mono text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                <span>动态录像</span>
              </div>
            ` : ''}
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
              <span class="text-[10px] font-mono text-rose-300">${photo.date}</span>
              <span class="text-xs font-serif text-white truncate">${photo.title}</span>
            </div>
            <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono text-rose-300 border border-white/10">
              ${photo.date.slice(5)}
            </div>
          </div>
        `;
      });

      inner.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-white/10 gap-2">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-400 mb-1">
              <span>♥</span><span>${group.month}</span>
            </div>
            <h4 class="text-xl sm:text-2xl font-serif font-bold text-white">${group.title}</h4>
            <p class="text-xs text-zinc-400 font-serif italic mt-1 max-w-xl">"${group.desc}"</p>
          </div>
          <span class="text-xs font-mono text-zinc-500 self-start sm:self-auto">${groupPhotos.length} 张珍贵瞬间</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          ${photosHtml}
        </div>
      `;

      section.appendChild(inner);
      container.appendChild(section);
    });
  }

  initTimelineWarpDock() {
    const dock = document.getElementById('universeTimelineDock');
    if (!dock || typeof window.REAL_MONTHS_SUMMARY === 'undefined') return;

    dock.innerHTML = '';

    // '全景星海' pill
    const allPill = document.createElement('button');
    allPill.className = 'universe-month-pill active';
    allPill.dataset.month = 'all';
    allPill.innerHTML = `<span>🌌 全景时光洞</span>`;
    allPill.addEventListener('click', () => {
      document.querySelectorAll('.universe-month-pill').forEach(p => p.classList.remove('active'));
      allPill.classList.add('active');
      if (this.cinematicUniverse) this.cinematicUniverse.warpToMonth('all');
    });
    dock.appendChild(allPill);

    // Monthly pills
    window.REAL_MONTHS_SUMMARY.forEach(m => {
      const pill = document.createElement('button');
      pill.className = 'universe-month-pill';
      pill.dataset.month = m.month;
      const formattedM = m.month.slice(2).replace('-', '.');
      const shortTitle = m.title.split('・')[0] || m.title;
      pill.innerHTML = `<span>${formattedM} ${shortTitle}</span>`;
      pill.addEventListener('click', () => {
        document.querySelectorAll('.universe-month-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        if (this.cinematicUniverse) this.cinematicUniverse.warpToMonth(m.month);
      });
      dock.appendChild(pill);
    });

    // '终章告白' pill
    const climaxPill = document.createElement('button');
    climaxPill.className = 'universe-month-pill text-rose-300 font-semibold';
    climaxPill.dataset.month = 'climax';
    climaxPill.innerHTML = `<span>♥ 终章回忆</span>`;
    climaxPill.addEventListener('click', () => {
      document.querySelectorAll('.universe-month-pill').forEach(p => p.classList.remove('active'));
      climaxPill.classList.add('active');
      climaxPill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      if (this.cinematicUniverse) this.cinematicUniverse.warpToMonth('climax');
      setTimeout(() => this.showClimaxModal(), 1200);
    });
    dock.appendChild(climaxPill);
  }

  onUniverseMonthChanged(month) {
    document.querySelectorAll('.universe-month-pill').forEach(pill => {
      const match = pill.dataset.month === month;
      pill.classList.toggle('active', match);
      if (match) {
        pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
    if (month === 'climax') {
      setTimeout(() => this.showClimaxModal(), 600);
    }
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

  hideClimaxModal() {
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

    // Restore active tab to current shape or mode
    if (this.currentMode === 'storyline') {
      const storyTab = document.getElementById('navStorylineBtn');
      if (storyTab) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        storyTab.classList.add('active');
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

  renderCoupleInfo() {
    const titleEl = document.getElementById('coupleTitle');
    const heroTitleEl = document.getElementById('heroCoupleTitle');
    const quoteEl = document.getElementById('heroQuote');

    if (titleEl) titleEl.textContent = `${this.state.lover1} & ${this.state.lover2}`;
    if (heroTitleEl) heroTitleEl.textContent = `${this.state.lover1} & ${this.state.lover2}`;
    if (quoteEl) quoteEl.textContent = `"${this.state.loveQuote}"`;
  }

  startLoveTimer() {
    const update = () => {
      const start = new Date(this.state.startDate).getTime();
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

    const galaxyEl = document.getElementById('viewportGalaxy');
    const storylineEl = document.getElementById('viewportStoryline');

    if (mode === 'galaxy') {
      if (galaxyEl) galaxyEl.classList.remove('hidden-view');
      if (storylineEl) storylineEl.classList.add('hidden-view');
      if (this.sphereGallery) {
        this.sphereGallery.applyLayout(this.sphereGallery.currentShape);
      }
    } else if (mode === 'storyline') {
      if (galaxyEl) galaxyEl.classList.add('hidden-view');
      if (storylineEl) {
        storylineEl.classList.remove('hidden-view');
        storylineEl.scrollTop = 0;
      }
    }
  }

  cycleNextMode() {
    const modes = ['galaxy', 'universe', 'museum', 'flipbook', 'storyline'];
    const nextIdx = (modes.indexOf(this.currentMode) + 1) % modes.length;
    this.switchMode(modes[nextIdx]);
  }

  handleGestureSwipe(direction) {
    if (this.currentMode === 'flipbook' && this.flipbook) {
      if (direction === 'left') this.flipbook.flipNext();
      else this.flipbook.flipPrev();
    } else if (this.currentMode === 'museum' && this.virtualMuseum) {
      if (direction === 'left') this.virtualMuseum.nextArtwork();
      else this.virtualMuseum.prevArtwork();
    }
  }

  toggleMusic() {
    if (this.isPlayingMusic) {
      this.audioElement.pause();
      if (this.synth) this.synth.stop();
      this.isPlayingMusic = false;
      this.syncMusicUI(false);
    } else {
      if (this.sphereGallery) {
        this.sphereGallery.connectAudio(this.audioElement);
      }
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlayingMusic = true;
          this.syncMusicUI(true);
        }).catch(err => {
          console.warn('Audio MP3 blocked, engaging romantic web audio synth:', err);
          if (this.synth) this.synth.start();
          this.isPlayingMusic = true;
          this.syncMusicUI(true);
        });
      } else {
        if (this.synth) this.synth.start();
        this.isPlayingMusic = true;
        this.syncMusicUI(true);
      }
    }
  }

  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const track = this.playlist[this.currentTrackIndex];
    this.audioElement.src = track.src;

    if (this.sphereGallery) {
      this.sphereGallery.connectAudio(this.audioElement);
    }

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.isPlayingMusic = true;
        this.syncMusicUI(true);
        this.showToast(`🎶 正在播放：${track.title} · ${track.artist}`);
      }).catch(err => {
        console.warn('Track play restricted:', err);
        if (track.fallbackSrc) {
          this.audioElement.src = track.fallbackSrc;
          this.audioElement.play().catch(e => console.warn(e));
        }
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
    const disc = document.getElementById('vinylDisc');
    const tonearm = document.getElementById('vinylTonearm');
    const btn = document.getElementById('musicToggleBtn');
    const quickTitle = document.getElementById('quickMusicTitle');

    if (quickTitle) quickTitle.textContent = track.title;

    if (isPlaying) {
      if (disc) disc.classList.add('playing');
      if (tonearm) tonearm.classList.add('playing');
      if (btn) btn.innerHTML = `<span>⏸</span> <span>暂停《${track.title}》</span>`;
    } else {
      if (disc) disc.classList.remove('playing');
      if (tonearm) tonearm.classList.remove('playing');
      if (btn) btn.innerHTML = `<span>▶</span> <span>播放《${track.title}》</span>`;
    }

    // Update animated equalizer waves
    document.querySelectorAll('.audio-bar').forEach(bar => {
      bar.classList.toggle('playing', isPlaying);
    });
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    const msgEl = document.getElementById('toastMessage');
    if (!container || !msgEl) return;

    msgEl.innerHTML = `<span>♥</span><span>${message}</span>`;
    container.classList.remove('opacity-0', 'translate-y-3');
    container.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      container.classList.remove('opacity-100', 'translate-y-0');
      container.classList.add('opacity-0', 'translate-y-3');
    }, 3200);
  }

  celebrateHeart() {
    // 1. Synaptic storm
    if (this.neuralNet) {
      this.neuralNet.triggerSynapticSurge(25);
    }

    // 2. Confetti & Heart Fireworks
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fbbf24', '#8b5cf6', '#ffffff']
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#f43f5e', '#fb7185']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#8b5cf6', '#c084fc']
        });
      }, 300);
    }

    // 3. Floating Heart Banner animation
    const banner = document.getElementById('heartToastBanner');
    if (banner) {
      banner.classList.remove('opacity-0', 'translate-y-4');
      setTimeout(() => {
        banner.classList.add('opacity-0', 'translate-y-4');
      }, 2500);
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

  showArtworkModal(item) {
    if (item && item.isClimaxLetter) {
      if (this.sphereGallery) this.sphereGallery.focusClimaxCard();
      this.showClimaxModal();
      return;
    }

    const modal = document.getElementById('artworkModal');
    if (!modal) return;

    // Find index in photo list
    const foundIdx = this.state.photos.findIndex(p => p.url === item.url || p.id === item.id);
    this.currentModalIndex = foundIdx !== -1 ? foundIdx : 0;
    this.renderModalContent();

    modal.classList.add('active');
  }

  renderModalContent() {
    const item = this.state.photos[this.currentModalIndex];
    if (!item) return;

    const imgEl = document.getElementById('modalImg');
    const videoEl = document.getElementById('modalVideo');
    const shield = document.querySelector('.lightbox-img-container .secure-img-shield');

    if (item.isVideo && item.videoUrl) {
      if (imgEl) imgEl.classList.add('hidden');
      if (videoEl) {
        videoEl.classList.remove('hidden');
        videoEl.src = item.videoUrl;
        videoEl.play().catch(e => console.log('Video autoplay note:', e));
      }
      // Temporarily pause BGM while playing user video
      if (this.isPlayingMusic && this.audioElement) {
        this.audioElement.pause();
        this.wasBgmPlayingBeforeVideo = true;
      }
      if (shield) shield.style.display = 'none'; // allow interacting with video controls
    } else {
      if (videoEl) {
        videoEl.pause();
        videoEl.classList.add('hidden');
        videoEl.src = '';
      }
      if (imgEl) {
        imgEl.classList.remove('hidden');
        imgEl.src = item.url;
        imgEl.style.transform = 'scale(1)';
        this.isImgZoomed = false;
      }
      // Resume BGM if it was playing
      if (this.wasBgmPlayingBeforeVideo && this.audioElement) {
        this.audioElement.play().catch(e => console.log(e));
        this.wasBgmPlayingBeforeVideo = false;
      }
      if (shield) shield.style.display = '';
    }

    const titleEl = document.getElementById('modalTitle');
    const dateEl = document.getElementById('modalDate');
    const descEl = document.getElementById('modalDesc');
    const counterEl = document.getElementById('modalCounter');

    if (titleEl) titleEl.textContent = item.title || '甜蜜回忆';
    if (dateEl) dateEl.textContent = item.date || 'Sweet Moments';
    if (descEl) descEl.textContent = item.desc || (item.isVideo ? '珍贵动态录像，每一次重温依然心动。' : '每一张照片都是时间写给我们的浪漫情书。');
    if (counterEl) {
      const cur = String(this.currentModalIndex + 1).padStart(2, '0');
      const total = String(this.state.photos.length).padStart(2, '0');
      counterEl.textContent = `${cur} / ${total}`;
    }
  }

  modalNextPhoto() {
    if (this.state.photos.length === 0) return;
    this.currentModalIndex = (this.currentModalIndex + 1) % this.state.photos.length;
    this.renderModalContent();
  }

  modalPrevPhoto() {
    if (this.state.photos.length === 0) return;
    this.currentModalIndex = (this.currentModalIndex - 1 + this.state.photos.length) % this.state.photos.length;
    this.renderModalContent();
  }

  hideArtworkModal() {
    const modal = document.getElementById('artworkModal');
    if (modal) {
      modal.classList.remove('active');
      const videoEl = document.getElementById('modalVideo');
      if (videoEl) {
        videoEl.pause();
        videoEl.classList.add('hidden');
        videoEl.src = '';
      }
      if (this.wasBgmPlayingBeforeVideo && this.audioElement) {
        this.audioElement.play().catch(e => console.log(e));
        this.wasBgmPlayingBeforeVideo = false;
      }
      const imgEl = document.getElementById('modalImg');
      if (imgEl) imgEl.style.transform = 'scale(1)';
      this.isImgZoomed = false;
    }
  }

  attemptDirectAutoplay() {
    // 1. Attempt unmuted autoplay directly
    const p = this.audioElement.play();
    if (p !== undefined) {
      p.then(() => {
        this.isPlayingMusic = true;
        this.syncMusicUI(true);
        // Automatically dismiss entrance overlay to instantly show 3D Heart Photo Wall
        const overlay = document.getElementById('entranceOverlay');
        if (overlay) {
          overlay.classList.add('opacity-0', 'pointer-events-none');
          setTimeout(() => overlay.remove(), 500);
        }
      }).catch(() => {
        // Browser policy blocked unprompted audio; listen to ANY touch/click
        const unlockAudio = () => {
          if (!this.isPlayingMusic) {
            this.toggleMusic();
          }
          window.removeEventListener('pointerdown', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });
      });
    }

    // 2. WeChat automatic play hook
    document.addEventListener("WeixinJSBridgeReady", () => {
      if (!this.isPlayingMusic) {
        this.toggleMusic();
      }
    }, false);
  }

  setupEntranceOverlay() {
    const overlay = document.getElementById('entranceOverlay');
    if (!overlay) return;

    const enterApp = () => {
      overlay.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => overlay.remove(), 400);

      // Trigger first celebration & play music (理想三旬)
      if (!this.isPlayingMusic) {
        this.toggleMusic();
      }
      this.celebrateHeart();

      // Try starting AI gesture after user gesture
      setTimeout(() => {
        if (this.aiGesture) this.aiGesture.start();
      }, 600);

      window.removeEventListener('pointerdown', enterApp);
      window.removeEventListener('touchstart', enterApp);
    };

    window.addEventListener('pointerdown', enterApp);
    window.addEventListener('touchstart', enterApp);
  }

  bindDOMEvents() {
    // Top Island Nav: Shape Switchers & Mode Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const shape = tab.dataset.shape;
        const mode = tab.dataset.mode;

        if (shape) {
          this.switchMode('galaxy');
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          if (this.sphereGallery) {
            this.sphereGallery.applyLayout(shape);
          }
        } else if (mode === 'storyline') {
          this.switchMode('storyline');
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        }
      });
    });

    // Climax Memory Letter Nav Button (Instant 0ms Tactile Trigger)
    const climaxBtn = document.getElementById('navClimaxLetterBtn');
    if (climaxBtn) {
      climaxBtn.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        climaxBtn.classList.add('active');
        this.showClimaxModal();
        if (this.sphereGallery) {
          this.sphereGallery.focusClimaxCard();
        }
      });
    }

    // Vinyl Player Play Button
    const musicBtn = document.getElementById('musicToggleBtn');
    if (musicBtn) musicBtn.addEventListener('click', () => this.toggleMusic());

    const vinylDisc = document.getElementById('vinylDisc');
    if (vinylDisc) vinylDisc.addEventListener('click', () => this.toggleMusic());

    // Celebrate Button
    const heartBtn = document.getElementById('celebrateBtn');
    if (heartBtn) heartBtn.addEventListener('click', () => this.celebrateHeart());

    // Fullscreen Cinema Lightbox Events
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.hideArtworkModal());

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

    const toggleCaptionBtn = document.getElementById('toggleCaptionBtn');
    const captionBar = document.getElementById('lightboxCaptionBar');
    if (toggleCaptionBtn && captionBar) {
      toggleCaptionBtn.addEventListener('click', () => {
        captionBar.classList.toggle('hidden-caption');
        toggleCaptionBtn.textContent = captionBar.classList.contains('hidden-caption') ? '显示信息' : '纯净画报';
      });
    }

    // Touch Gestures on Mobile Lightbox (Swipe Left/Right to flip, Swipe Down to close, Double-tap to zoom)
    const lightboxArea = document.getElementById('lightboxTouchArea');
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
        this.state.lover1 = document.getElementById('cfgLover1').value || 'Leo';
        this.state.lover2 = document.getElementById('cfgLover2').value || 'Mia';
        this.state.startDate = document.getElementById('cfgStartDate').value || '2023-05-20';
        this.state.loveQuote = document.getElementById('cfgQuote').value || '';

        this.saveState();
        this.renderCoupleInfo();
        this.flipbook.renderBook(this.state.photos, { lover1: this.state.lover1, lover2: this.state.lover2 });
        drawerBackdrop.classList.remove('active');
        this.celebrateHeart();
      });
    }

    // Universe Top Bar Actions & Playlist Controller Events
    const quickMusicBtn = document.getElementById('quickMusicBtn');
    if (quickMusicBtn) quickMusicBtn.addEventListener('click', () => this.toggleMusic());

    const quickMusicPrevBtn = document.getElementById('quickMusicPrevBtn');
    if (quickMusicPrevBtn) quickMusicPrevBtn.addEventListener('click', () => this.playPrevTrack());

    const quickMusicNextBtn = document.getElementById('quickMusicNextBtn');
    if (quickMusicNextBtn) quickMusicNextBtn.addEventListener('click', () => this.playNextTrack());

    const autoTourBtn = document.getElementById('autoTourBtn');
    if (autoTourBtn) autoTourBtn.addEventListener('click', () => {
      if (this.cinematicUniverse) this.cinematicUniverse.toggleAutoTour();
    });

    const universeClimaxBtn = document.getElementById('universeClimaxBtn');
    if (universeClimaxBtn) universeClimaxBtn.addEventListener('click', () => {
      if (this.cinematicUniverse) this.cinematicUniverse.warpToMonth('climax');
      setTimeout(() => this.showClimaxModal(), 1200);
    });

    const closeClimaxModalBtn = document.getElementById('closeClimaxModalBtn');
    if (closeClimaxModalBtn) closeClimaxModalBtn.addEventListener('click', () => this.hideClimaxModal());

    const climaxModal = document.getElementById('climaxLetterModal');
    if (climaxModal) {
      climaxModal.addEventListener('click', (e) => {
        if (e.target === climaxModal) this.hideClimaxModal();
      });
    }

    // Photo Upload Handler (FileReader -> base64)
    const photoUploadInput = document.getElementById('photoUploadInput');
    if (photoUploadInput) {
      photoUploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.state.photos.unshift({
              id: Date.now() + Math.random(),
              url: event.target.result,
              title: file.name.replace(/\.[^/.]+$/, ''),
              date: new Date().toISOString().split('T')[0],
              desc: '在特别的日子里，记录下这闪闪发光的瞬间。'
            });
            this.saveState();
            // Refresh 3D views
            if (this.cinematicUniverse) this.cinematicUniverse.loadPhotos(this.state.photos);
            if (this.sphereGallery) this.sphereGallery.loadPhotos(this.state.photos);
            if (this.virtualMuseum) this.virtualMuseum.loadArtworks(this.state.photos);
            if (this.flipbook) this.flipbook.renderBook(this.state.photos, { lover1: this.state.lover1, lover2: this.state.lover2 });
          };
          reader.readAsDataURL(file);
        });

        alert('照片添加成功！已自动存入浏览器本地相册。');
      });
    }

    // Camera AI Toggle Button in HUD
    const aiToggleBtn = document.getElementById('aiHudPill');
    const aiVideoWrapper = document.getElementById('aiVideoWrapper');
    if (aiToggleBtn && aiVideoWrapper) {
      aiToggleBtn.addEventListener('click', () => {
        if (!this.aiGesture.isActive) {
          this.aiGesture.start();
          aiVideoWrapper.classList.remove('opacity-0', 'pointer-events-none');
        } else {
          this.aiGesture.stop();
          aiVideoWrapper.classList.add('opacity-0', 'pointer-events-none');
        }
      });
    }

    // Museum Navigation Pill buttons
    const prevArtBtn = document.getElementById('prevArtBtn');
    const nextArtBtn = document.getElementById('nextArtBtn');
    const resetArtBtn = document.getElementById('resetArtBtn');
    if (prevArtBtn) prevArtBtn.addEventListener('click', () => this.virtualMuseum.prevArtwork());
    if (nextArtBtn) nextArtBtn.addEventListener('click', () => this.virtualMuseum.nextArtwork());
    if (resetArtBtn) resetArtBtn.addEventListener('click', () => this.virtualMuseum.resetSalonView());

    // Flipbook Navigation Pill buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => this.flipbook.flipPrev());
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => this.flipbook.flipNext());
  }
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  window.eternalApp = new EternalApp();
});
