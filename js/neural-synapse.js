/**
 * 背景光影：暖色光斑带着一枚错开的软阴影，鼠标轻轻拨开。
 * 类名保持不变，页面原有的开关和礼花爆发仍然可用。
 */
class NeuralSynapseNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.pulses = [];
    this.mouse = { x: -1000, y: -1000, radius: 180, active: false };
    this.animationFrameId = null;

    this.init();
    this.bindEvents();
    this._running = true;
    this.animate();
  }

  setRunning(on) {
    if (on) {
      if (this._running) return;
      this._running = true;
      this.animate();
      return;
    }
    this._running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  init() {
    this.resize();
    const count = Math.max(18, Math.min(36, Math.floor((this.width * this.height) / 42000)));
    this.nodes = [];
    for (let i = 0; i < count; i++) {
      const warm = Math.random() > 0.42;
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.16,
        radius: warm ? 28 + Math.random() * 54 : 16 + Math.random() * 28,
        alpha: warm ? 0.22 + Math.random() * 0.28 : 0.16 + Math.random() * 0.16,
        warm,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
    });
  }

  triggerSynapticSurge(intensity = 12) {
    for (let i = 0; i < intensity; i++) {
      this.pulses.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 10,
        grow: 1.6 + Math.random() * 1.4,
        alpha: 0.55
      });
    }
  }

  update() {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const flare = this.pulses[i];
      flare.radius += flare.grow;
      flare.alpha *= 0.96;
      if (flare.alpha < 0.02) this.pulses.splice(i, 1);
    }

    for (let i = 0; i < this.nodes.length; i++) {
      const mote = this.nodes[i];
      mote.phase += 0.008;
      mote.x += mote.vx + Math.sin(mote.phase) * 0.12;
      mote.y += mote.vy + Math.cos(mote.phase * 0.7) * 0.08;
      if (mote.x < -80) mote.x = this.width + 40;
      if (mote.x > this.width + 80) mote.x = -40;
      if (mote.y < -80) mote.y = this.height + 40;
      if (mote.y > this.height + 80) mote.y = -40;

      if (this.mouse.active) {
        const dx = mote.x - this.mouse.x;
        const dy = mote.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.mouse.radius && dist > 1) {
          const push = (1 - dist / this.mouse.radius) * 0.8;
          mote.x += (dx / dist) * push;
          mote.y += (dy / dist) * push;
        }
      }
    }
  }

  drawMote(x, y, radius, alpha, warm) {
    const ctx = this.ctx;
    const shadow = ctx.createRadialGradient(x + radius * 0.35, y + radius * 0.55, 0, x + radius * 0.35, y + radius * 0.55, radius);
    shadow.addColorStop(0, `rgba(8, 6, 12, ${alpha * 0.55})`);
    shadow.addColorStop(1, 'rgba(8, 6, 12, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(x + radius * 0.35, y + radius * 0.55, radius, 0, Math.PI * 2);
    ctx.fill();

    const light = ctx.createRadialGradient(x - radius * 0.18, y - radius * 0.22, 0, x, y, radius);
    if (warm) {
      light.addColorStop(0, `rgba(255, 248, 236, ${alpha})`);
      light.addColorStop(0.35, `rgba(255, 196, 150, ${alpha * 0.55})`);
      light.addColorStop(1, 'rgba(255, 170, 120, 0)');
    } else {
      light.addColorStop(0, `rgba(236, 244, 255, ${alpha * 0.85})`);
      light.addColorStop(0.4, `rgba(150, 176, 214, ${alpha * 0.35})`);
      light.addColorStop(1, 'rgba(120, 140, 180, 0)');
    }
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.nodes.length; i++) {
      const mote = this.nodes[i];
      const breathe = 0.82 + Math.sin(mote.phase) * 0.18;
      this.drawMote(mote.x, mote.y, mote.radius * breathe, mote.alpha, mote.warm);
    }
    for (let i = 0; i < this.pulses.length; i++) {
      const flare = this.pulses[i];
      this.drawMote(flare.x, flare.y, flare.radius, flare.alpha, true);
    }
  }

  animate() {
    if (!this._running) return;
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.update();
    this.render();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

window.NeuralSynapseNetwork = NeuralSynapseNetwork;
