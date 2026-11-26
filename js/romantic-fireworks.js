/**
 * EternalEcho - Cinematic Romantic Fireworks Engine (殿堂级细腻浪漫夜空烟花)
 * 支持：爱心烟花、金柳流瀑、星芒菊花、曳光尾焰、仙女棒闪烁与夜空微照亮
 * 纯原生 Canvas 2D + Retina 高清渲染 + 0 外部依赖 + 物理重力与微风阻力
 */

class RomanticFireworks {
  constructor(canvasId = 'fireworksCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      this.canvas.className = 'fixed inset-0 w-full h-full z-30 pointer-events-none';
      document.body.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.rockets = [];
    this.sparks = [];
    this.ambientFlashes = [];
    this.isRunning = false;
    this.animId = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 浪漫主题配色盘 (玫瑰粉、香槟金、月光白、星空紫、樱花淡粉)
    this.colorPalettes = [
      ['#ff5983', '#ff88a5', '#ffd1dc', '#fff0f5', '#ffe066'], // 经典粉金
      ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff', '#fed7aa'], // 璀璨金柳
      ['#c084fc', '#e879f9', '#f43f5e', '#fbcfe8', '#ffffff'], // 梦幻星紫
      ['#f43f5e', '#fb7185', '#fda4af', '#ffffff', '#ffd700']  // 热烈真红与金
    ];

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvas();
    });
  }

  // -------------------------------------------------------------
  // 核心发射接口
  // -------------------------------------------------------------

  /**
   * 发射单枚烟花
   * @param {number} startX 起点X (默认屏幕底部随机)
   * @param {number} targetX 爆炸点X
   * @param {number} targetY 爆炸点Y
   * @param {string} pattern 'heart' | 'willow' | 'chrysanthemum' | 'random'
   */
  launch(startX = null, targetX = null, targetY = null, pattern = 'random') {
    const sw = this.width;
    const sh = this.height;

    const sx = startX !== null ? startX : sw * (0.2 + Math.random() * 0.6);
    const sy = sh + 15;
    const tx = targetX !== null ? targetX : sw * (0.15 + Math.random() * 0.7);
    const ty = targetY !== null ? targetY : sh * (0.16 + Math.random() * 0.38);

    if (pattern === 'random') {
      const types = ['heart', 'willow', 'chrysanthemum'];
      pattern = types[Math.floor(Math.random() * types.length)];
    }

    const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];

    this.rockets.push(new FireworkRocket(sx, sy, tx, ty, pattern, palette));
    this.startLoop();
  }

  /**
   * 触发一场盛大华丽的“浪漫烟花盛宴” (排场连发)
   */
  celebrateGrandShow() {
    const sw = this.width;
    const sh = this.height;

    // T+0ms: 左侧与右侧升空双子星芒烟花
    this.launch(sw * 0.28, sw * 0.28, sh * 0.32, 'chrysanthemum');
    this.launch(sw * 0.72, sw * 0.72, sh * 0.32, 'chrysanthemum');

    // T+350ms: 正中央压轴升空一颗巨大的【浪漫爱心烟花】
    setTimeout(() => {
      this.launch(sw * 0.5, sw * 0.5, sh * 0.26, 'heart');
    }, 380);

    // T+900ms: 漫天璀璨的【金柳流瀑烟花】
    setTimeout(() => {
      this.launch(sw * 0.38, sw * 0.36, sh * 0.22, 'willow');
      this.launch(sw * 0.62, sw * 0.64, sh * 0.22, 'willow');
    }, 950);

    // T+1500ms: 高空双重爱心交织呼应
    setTimeout(() => {
      this.launch(sw * 0.32, sw * 0.30, sh * 0.35, 'heart');
      this.launch(sw * 0.68, sw * 0.70, sh * 0.35, 'heart');
    }, 1500);

    // T+2100ms: 仙女棒碎金收尾
    setTimeout(() => {
      this.launch(sw * 0.5, sw * 0.5, sh * 0.18, 'chrysanthemum');
    }, 2100);
  }

  // -------------------------------------------------------------
  // 渲染主循环
  // -------------------------------------------------------------
  startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;

    // 清空画布 (透明擦除)
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 启用光晕加色混合，让烟花火花交错处产生天然的超亮辉光
    this.ctx.globalCompositeOperation = 'lighter';

    // 1. 渲染环境光瞬态照亮 (Sky Flashes)
    for (let i = this.ambientFlashes.length - 1; i >= 0; i--) {
      const flash = this.ambientFlashes[i];
      flash.update();
      flash.draw(this.ctx);
      if (flash.isDead()) {
        this.ambientFlashes.splice(i, 1);
      }
    }

    // 2. 渲染上升火箭与曳光火星
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      rocket.update();
      rocket.draw(this.ctx);

      if (rocket.exploded) {
        // 火箭爆开，生成绽放粒子与夜空微光晕
        this.createExplosion(rocket);
        this.ambientFlashes.push(new AmbientFlash(rocket.x, rocket.y, rocket.palette[0]));
        this.rockets.splice(i, 1);
      }
    }

    // 3. 渲染爆炸绽放的火星粒子 (带轨迹丝线与闪烁)
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.update();
      spark.draw(this.ctx);
      if (spark.isDead()) {
        this.sparks.splice(i, 1);
      }
    }

    // 重置合成模式
    this.ctx.globalCompositeOperation = 'source-over';

    // 如果所有粒子与火箭都已消散，平滑休眠以节省 100% 功耗
    if (this.rockets.length === 0 && this.sparks.length === 0 && this.ambientFlashes.length === 0) {
      this.isRunning = false;
      this.animId = null;
      return;
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  createExplosion(rocket) {
    const rx = rocket.x;
    const ry = rocket.y;
    const pattern = rocket.pattern;
    const palette = rocket.palette;

    if (pattern === 'heart') {
      // ---------------------------------------------------------
      // 唯美爱心烟花：根据心形笛卡尔/极坐标参数方程生成
      // ---------------------------------------------------------
      const count = 120;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        // 经典心形公式
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        // 速度归一化并施加微扰
        const speed = 0.22 + Math.random() * 0.04;
        const vx = hx * speed;
        const vy = hy * speed;
        const color = palette[Math.floor(Math.random() * palette.length)];

        this.sparks.push(new FireworkSpark(rx, ry, vx, vy, color, {
          gravity: 0.038,
          friction: 0.965,
          life: 90 + Math.random() * 30,
          tailLength: 5,
          sparkle: true,
          size: 2.2
        }));
      }

      // 核心补充一层亮白微星核
      for (let i = 0; i < 25; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 1.0 + Math.random() * 2.5;
        this.sparks.push(new FireworkSpark(rx, ry, Math.cos(ang) * sp, Math.sin(ang) * sp, '#ffffff', {
          gravity: 0.05,
          friction: 0.94,
          life: 45,
          tailLength: 3,
          size: 2.0
        }));
      }

    } else if (pattern === 'willow') {
      // ---------------------------------------------------------
      // 优雅金柳流瀑烟花：粒子细腻如丝，重力下缓缓下垂流淌
      // ---------------------------------------------------------
      const count = 140;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2.0 + Math.random() * 6.5;
        const color = Math.random() > 0.3 ? '#fbbf24' : '#fffbeb';

        this.sparks.push(new FireworkSpark(rx, ry, Math.cos(ang) * sp, Math.sin(ang) * sp * 0.75, color, {
          gravity: 0.058,
          friction: 0.978, // 超小空气阻力，形成修长垂瀑
          life: 110 + Math.random() * 40,
          tailLength: 8,
          sparkle: Math.random() > 0.4,
          size: 1.8
        }));
      }

    } else {
      // ---------------------------------------------------------
      // 璀璨星芒菊花烟花：同心圆分层立体绽放
      // ---------------------------------------------------------
      const count = 110;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2.5 + Math.random() * 6.0;
        const color = palette[Math.floor(Math.random() * palette.length)];

        this.sparks.push(new FireworkSpark(rx, ry, Math.cos(ang) * sp, Math.sin(ang) * sp, color, {
          gravity: 0.048,
          friction: 0.962,
          life: 80 + Math.random() * 25,
          tailLength: 6,
          sparkle: true,
          size: 2.2
        }));
      }
    }
  }
}

// -------------------------------------------------------------
// 上升火箭实体 (带星火尾迹)
// -------------------------------------------------------------
class FireworkRocket {
  constructor(startX, startY, targetX, targetY, pattern, palette) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.pattern = pattern;
    this.palette = palette;
    this.exploded = false;

    const dx = targetX - startX;
    const dy = targetY - startY;
    this.distance = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);
    this.speed = Math.max(12, this.distance / 28);
    this.trail = [];
    this.headColor = '#fffbe8';
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: 0.85, size: 2.4 });
    if (this.trail.length > 7) this.trail.shift();

    for (let t of this.trail) {
      t.alpha *= 0.82;
      t.size *= 0.92;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distToTarget = Math.hypot(dx, dy);

    if (distToTarget <= this.speed || this.y <= this.targetY) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.exploded = true;
      return;
    }

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    // 逐渐减速上升，营造重力与顶点停滞感
    this.speed = Math.max(4.0, this.speed * 0.985);
  }

  draw(ctx) {
    // 绘制曳光尾迹
    ctx.save();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    // 绘制上升火箭星芒头
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = this.headColor;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }
}

// -------------------------------------------------------------
// 爆炸火星粒子实体 (带流线残影轨迹与重力物理)
// -------------------------------------------------------------
class FireworkSpark {
  constructor(x, y, vx, vy, color, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.gravity = opts.gravity || 0.045;
    this.friction = opts.friction || 0.965;
    this.maxLife = opts.life || 80;
    this.life = this.maxLife;
    this.tailLength = opts.tailLength || 6;
    this.sparkle = opts.sparkle || false;
    this.baseSize = opts.size || 2.0;
    this.history = [];
  }

  update() {
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.tailLength) {
      this.history.shift();
    }

    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    if (this.history.length < 2) return;

    const progress = this.life / this.maxLife; // 1.0 -> 0.0
    let alpha = Math.max(0, Math.min(1, progress * 1.2));

    // 仙女棒微火花闪烁
    if (this.sparkle && progress < 0.65) {
      if (Math.random() > 0.45) {
        alpha *= 0.35;
      } else {
        alpha = Math.min(1.0, alpha * 1.5);
      }
    }

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = progress > 0.4 ? 9 : 3;

    // 绘制流线残影尾迹 (优雅的丝状火花)
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.lineWidth = Math.max(0.6, this.baseSize * progress);
    ctx.globalAlpha = alpha;
    ctx.stroke();

    // 头部火花微亮核
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.8, this.baseSize * 0.7 * progress), 0, Math.PI * 2);
    ctx.globalAlpha = Math.min(1, alpha * 1.2);
    ctx.fill();

    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

// -------------------------------------------------------------
// 夜空微光瞬态照亮实体 (Ambient Sky Flash)
// -------------------------------------------------------------
class AmbientFlash {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color || '#f43f5e';
    this.alpha = 0.12;
    this.radius = 280;
  }

  update() {
    this.alpha *= 0.88;
    this.radius += 12;
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;
    ctx.save();
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0, `rgba(255, 200, 220, ${this.alpha})`);
    grad.addColorStop(0.5, `rgba(244, 63, 94, ${this.alpha * 0.45})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.alpha <= 0.008;
  }
}

window.RomanticFireworks = RomanticFireworks;
