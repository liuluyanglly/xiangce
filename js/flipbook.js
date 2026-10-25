/**
 * EternalEcho - 3D Realistic Paper Flipbook Engine
 * Features 3D page curl physics, Web Audio realistic page rustle sound synthesis,
 * polaroid layouts, and responsive dual/single page spread for iPad & H5.
 */

class RealisticFlipbook {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      onPageChange: null
    }, options);

    this.pages = [];
    this.currentPage = 0;
    this.audioCtx = null;
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.initAudio();
  }

  initAudio() {
    // Lazy initialize Web Audio API on first user gesture
    const init = () => {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      window.removeEventListener('pointerdown', init);
    };
    window.addEventListener('pointerdown', init);
  }

  // Synthesize soft, realistic paper rustle sound via Web Audio API
  playPageTurnSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const bufferSize = this.audioCtx.sampleRate * 0.18;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink noise burst with exponential decay for paper rustle
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const decay = Math.exp(-i / (bufferSize * 0.28));
        data[i] = (b0 + b1 + b2) * 0.12 * decay;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noise.start();
    } catch (e) {
      console.warn('Paper audio synth error:', e);
    }
  }

  renderBook(photos, coupleInfo = { lover1: 'Leo', lover2: 'Mia' }) {
    this.container.innerHTML = '';
    this.currentPage = 0;

    const isMobile = window.innerWidth < 768;
    const stage = document.createElement('div');
    stage.className = 'flipbook-stage';

    const wrapper = document.createElement('div');
    wrapper.className = 'book-wrapper';
    stage.appendChild(wrapper);

    // For optimal mobile flipbook performance, if total photos > 36, sample evenly across timeline
    let bookPhotos = photos;
    if (photos.length > 36) {
      const step = Math.ceil(photos.length / 32);
      bookPhotos = photos.filter((_, idx) => idx % step === 0);
    }

    // Build pages: Cover + Photo Spreads + Back Cover
    const pageItems = [];

    // Page 0: Hardcover Title Page
    pageItems.push({
      type: 'cover',
      title: `${coupleInfo.lover1} & ${coupleInfo.lover2}`,
      subtitle: 'OUR ETERNAL MEMORIES',
      date: 'Forever & Always',
      desc: '在这个纷繁的世界里，遇见你是最美好的奇迹。'
    });

    // Middle pages
    bookPhotos.forEach((photo, idx) => {
      pageItems.push({
        type: 'photo',
        url: photo.url,
        title: photo.title || `Chapter ${idx + 1}`,
        date: photo.date || 'Sweet Moments',
        desc: photo.desc || '每一张照片，都是时间写给我们的浪漫情书。'
      });
    });

    // Final Page: Epilogue Love Letter & Memory Summary
    pageItems.push({
      type: 'letter',
      title: '致我们的两载春秋',
      subtitle: 'Forever & Always ♥',
      desc: '从2022年春天的第一缕微风，到2024年岁月的细水长流。\n\n七百多个日日夜夜，两万多个小时的悄然相伴。我们在夏夜的海风中举起过汽水，在初雪的冬夜揣紧过同一个口袋；走过喧嚣繁华的街角，也看过漫天璀璨的晚霞与落日。\n\n回忆是岁月写给我们的长诗，而最好的篇章，永远是相视一笑的明天。\n\n愿以后的每一个四季，我们依旧手牵着手，走过漫长岁月，直到时光尽头。'
    });

    // Create sheets (each sheet has front & back faces)
    const sheetsCount = Math.ceil(pageItems.length / 2);
    this.sheets = [];

    for (let i = 0; i < sheetsCount; i++) {
      const sheet = document.createElement('div');
      sheet.className = 'book-sheet';
      sheet.style.zIndex = sheetsCount - i;

      const frontFace = document.createElement('div');
      frontFace.className = 'sheet-face sheet-front';
      const frontData = pageItems[i * 2];
      this.populatePageFace(frontFace, frontData, i * 2, 'front');

      const backFace = document.createElement('div');
      backFace.className = 'sheet-face sheet-back';
      const backData = pageItems[i * 2 + 1];
      this.populatePageFace(backFace, backData, i * 2 + 1, 'back');

      sheet.appendChild(frontFace);
      sheet.appendChild(backFace);
      wrapper.appendChild(sheet);

      sheet.addEventListener('click', () => {
        if (!sheet.classList.contains('flipped')) {
          this.flipNext();
        } else {
          this.flipPrev();
        }
      });

      this.sheets.push(sheet);
    }

    this.container.appendChild(stage);
    this.bindGestures(wrapper);
  }

  populatePageFace(container, data, pageNum, side) {
    if (!data) {
      container.innerHTML = `
        <div class="h-full flex items-center justify-center p-8 bg-zinc-950/80 text-zinc-600">
          <span class="font-serif italic">~ End of Volume ~</span>
        </div>`;
      return;
    }

    if (data.type === 'cover') {
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-zinc-900 via-rose-950/30 to-zinc-950 border border-amber-500/20 text-center relative overflow-hidden">
          <div class="absolute inset-4 border border-amber-500/30 rounded-xl pointer-events-none"></div>
          <div class="w-16 h-16 mb-4 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <span class="text-rose-400 text-2xl">♥</span>
          </div>
          <p class="text-xs uppercase tracking-[0.3em] text-amber-300/80 font-sans mb-2">${data.subtitle}</p>
          <h2 class="text-3xl md:text-4xl font-serif text-white tracking-wide mb-3">${data.title}</h2>
          <p class="text-xs text-zinc-400 mb-6 font-mono">${data.date}</p>
          <p class="text-sm text-zinc-300 max-w-xs font-serif italic leading-relaxed">"${data.desc}"</p>
          <div class="absolute bottom-6 text-[10px] text-zinc-500 tracking-widest uppercase">Click or Swipe to Open</div>
        </div>`;
      return;
    }

    if (data.type === 'letter') {
      container.innerHTML = `
        <div class="h-full flex flex-col justify-between p-5 sm:p-7 bg-gradient-to-br from-zinc-900/95 via-rose-950/20 to-zinc-950 text-zinc-200 relative border border-white/5">
          <div class="sheet-spine-shadow"></div>
          <div>
            <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span class="font-serif italic text-rose-400 text-lg sm:text-xl font-bold">${data.title}</span>
              <span class="text-rose-400 text-base">♥</span>
            </div>
            <p class="text-xs sm:text-sm leading-relaxed text-zinc-300 font-serif italic whitespace-pre-line indent-4 sm:indent-6">${data.desc}</p>
          </div>
          <div class="pt-4 border-t border-white/10 flex justify-between items-end">
            <div>
              <p class="text-[10px] sm:text-xs text-zinc-400 font-mono">2022 — 2026 & Beyond</p>
              <p class="text-xs sm:text-sm text-rose-400 font-serif italic mt-0.5">${data.subtitle}</p>
            </div>
            <span class="text-[10px] text-zinc-600 font-mono">FINALE</span>
          </div>
        </div>`;
      return;
    }

    // Polaroid Photo page (Maximized image area for mobile & touch to enlarge)
    container.innerHTML = `
      <div class="h-full flex flex-col justify-between p-3 sm:p-5 md:p-6 bg-zinc-900/95 relative border border-white/5 group">
        <div class="sheet-spine-shadow"></div>
        <!-- Polaroid Card Container -->
        <div class="flex-1 bg-zinc-950/80 p-2 sm:p-3 rounded-xl border border-white/10 shadow-lg flex flex-col">
          <div class="w-full flex-1 rounded-lg overflow-hidden bg-black relative cursor-pointer" onclick="event.stopPropagation(); if(window.eternalApp) window.eternalApp.showArtworkModal(${JSON.stringify(data).replace(/"/g, '&quot;')});">
            <img src="${data.url}" alt="${data.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none" loading="lazy" />
            <div class="secure-img-shield"></div>
            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] sm:text-[10px] text-zinc-200 border border-white/15 flex items-center gap-1 shadow-md">
              <span>🔍</span><span>点击全屏看大图</span>
            </div>
            <div class="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] sm:text-[10px] text-rose-300 border border-white/10">
              ${data.date}
            </div>
          </div>
          <div class="pt-2 sm:pt-3 px-1">
            <h4 class="text-sm sm:text-base font-serif font-semibold text-white tracking-wide">${data.title}</h4>
            <p class="text-[11px] sm:text-xs text-zinc-400 line-clamp-2 mt-0.5 font-serif italic leading-relaxed">"${data.desc}"</p>
          </div>
        </div>
        <div class="flex items-center justify-between pt-2 text-[9px] sm:text-[10px] text-zinc-500 font-mono">
          <span>MEMORIES ARCHIVE</span>
          <span>${pageNum + 1}</span>
        </div>
      </div>`;
  }

  flipNext() {
    if (this.currentPage < this.sheets.length) {
      const sheet = this.sheets[this.currentPage];
      sheet.classList.add('flipped');
      sheet.style.zIndex = this.currentPage + 1;
      this.currentPage++;
      this.playPageTurnSound();
      if (typeof this.options.onPageChange === 'function') {
        this.options.onPageChange(this.currentPage);
      }
    }
  }

  flipPrev() {
    if (this.currentPage > 0) {
      this.currentPage--;
      const sheet = this.sheets[this.currentPage];
      sheet.classList.remove('flipped');
      sheet.style.zIndex = this.sheets.length - this.currentPage;
      this.playPageTurnSound();
      if (typeof this.options.onPageChange === 'function') {
        this.options.onPageChange(this.currentPage);
      }
    }
  }

  bindGestures(wrapper) {
    wrapper.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].clientX;
      const diff = this.touchEndX - this.touchStartX;
      if (diff < -50) {
        this.flipNext(); // Swipe left -> flip to next page
      } else if (diff > 50) {
        this.flipPrev(); // Swipe right -> flip to prev page
      }
    }, { passive: true });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (this.container.offsetParent === null) return; // not visible
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        this.flipNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.flipPrev();
      }
    });
  }
}

window.RealisticFlipbook = RealisticFlipbook;
