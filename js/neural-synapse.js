/**
 * EternalEcho - 3D Neural Synapse Background Engine
 * Renders an ethereal, interactive neural synaptic network of memories
 * with electrical impulses propagating between nodes.
 */

class NeuralSynapseNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.pulses = [];
    this.maxDistance = 160;
    this.mouse = { x: -1000, y: -1000, radius: 180, active: false };
    this.animationFrameId = null;
    this.themeColor = { r: 244, g: 63, b: 94 }; // Rose gold / crimson
    this.secondaryColor = { r: 139, g: 92, b: 246 }; // Lavender violet

    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    this.resize();
    const count = Math.floor((this.width * this.height) / 12000);
    this.nodes = [];
    for (let i = 0; i < Math.max(35, Math.min(count, 90)); i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        baseRadius: Math.random() * 2.2 + 1.2,
        radius: 2,
        alpha: Math.random() * 0.5 + 0.3,
        pulseVal: Math.random() * Math.PI * 2,
        connections: []
      });
    }
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.maxDistance = window.innerWidth < 768 ? 110 : 160;
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

  // Trigger synaptic storm when heart gesture or special event fires
  triggerSynapticSurge(intensity = 15) {
    for (let i = 0; i < intensity; i++) {
      const fromNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      if (fromNode && fromNode.connections.length > 0) {
        const toNode = fromNode.connections[Math.floor(Math.random() * fromNode.connections.length)];
        this.pulses.push({
          x: fromNode.x,
          y: fromNode.y,
          startX: fromNode.x,
          startY: fromNode.y,
          targetX: toNode.x,
          targetY: toNode.y,
          progress: 0,
          speed: 0.03 + Math.random() * 0.04,
          glow: 1.0
        });
      }
    }
  }

  update() {
    // Spawn spontaneous electrical pulses along connections
    if (Math.random() < 0.06 && this.nodes.length > 0 && this.pulses.length < 35) {
      const fromNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      if (fromNode && fromNode.connections.length > 0) {
        const toNode = fromNode.connections[Math.floor(Math.random() * fromNode.connections.length)];
        this.pulses.push({
          x: fromNode.x,
          y: fromNode.y,
          startX: fromNode.x,
          startY: fromNode.y,
          targetX: toNode.x,
          targetY: toNode.y,
          progress: 0,
          speed: 0.015 + Math.random() * 0.02,
          glow: 0.8
        });
      }
    }

    // Update pulses
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed;
      p.x = p.startX + (p.targetX - p.startX) * p.progress;
      p.y = p.startY + (p.targetY - p.startY) * p.progress;
      if (p.progress >= 1) {
        this.pulses.splice(i, 1);
      }
    }

    // Update nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > this.width) n.vx *= -1;
      if (n.y < 0 || n.y > this.height) n.vy *= -1;

      // Mouse bio-electric attraction
      if (this.mouse.active) {
        const dx = this.mouse.x - n.x;
        const dy = this.mouse.y - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.mouse.radius) {
          const force = (1 - dist / this.mouse.radius) * 1.5;
          n.x += (dx / dist) * force;
          n.y += (dy / dist) * force;
        }
      }

      n.pulseVal += 0.03;
      n.radius = n.baseRadius + Math.sin(n.pulseVal) * 0.6;
      n.connections = [];
    }

    // Compute synaptic connections
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist < this.maxDistance) {
          n1.connections.push(n2);
          n2.connections.push(n1);
        }
      }
    }
  }

  // Helper to draw cute glowing romantic hearts instead of ordinary dots
  drawHeart(x, y, size, fillStyle, glowColor, glowBlur = 0) {
    this.ctx.save();
    this.ctx.translate(x, y);
    if (glowBlur > 0) {
      this.ctx.shadowColor = glowColor || fillStyle;
      this.ctx.shadowBlur = glowBlur;
    }
    this.ctx.fillStyle = fillStyle;
    this.ctx.beginPath();
    const d = size;
    this.ctx.moveTo(0, -d * 0.25);
    this.ctx.bezierCurveTo(-d * 0.55, -d * 0.85, -d, -d * 0.2, 0, d * 0.75);
    this.ctx.bezierCurveTo(d, -d * 0.2, d * 0.55, -d * 0.85, 0, -d * 0.25);
    this.ctx.fill();
    this.ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw synaptic filaments
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = 0; j < n1.connections.length; j++) {
        const n2 = n1.connections[j];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        const alpha = (1 - dist / this.maxDistance) * 0.22;

        this.ctx.beginPath();
        this.ctx.moveTo(n1.x, n1.y);
        this.ctx.lineTo(n2.x, n2.y);
        this.ctx.strokeStyle = `rgba(${this.themeColor.r}, ${this.themeColor.g}, ${this.themeColor.b}, ${alpha})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.stroke();
      }
    }

    // Draw travelling electrical impulses (Glowing Hearts along synapses)
    for (let i = 0; i < this.pulses.length; i++) {
      const p = this.pulses[i];
      this.drawHeart(p.x, p.y, 6.5, '#ffffff', 'rgba(244, 63, 94, 0.9)', 10);
    }

    // Draw memory neuron nodes (Floating Glowing Love Hearts)
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const heartSize = n.radius * 3.2;
      const heartColor = `rgba(244, 63, 94, ${n.alpha * 0.85})`;
      const glowColor = `rgba(139, 92, 246, ${n.alpha})`;
      this.drawHeart(n.x, n.y, heartSize, heartColor, glowColor, 12);
      
      // Core bright heart highlight
      this.drawHeart(n.x, n.y, heartSize * 0.45, 'rgba(255, 255, 255, 0.9)', '#ffffff', 4);
    }
  }

  animate() {
    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

window.NeuralSynapseNetwork = NeuralSynapseNetwork;
