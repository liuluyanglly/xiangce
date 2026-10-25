/**
 * EternalEcho - Client-Side AI Neural Gesture Vision Engine
 * Powered by Google MediaPipe Hands neural network.
 * 100% in-browser, privacy-safe, runs on WebAssembly/WebGL with zero backend server.
 */

class AIGestureEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      videoElementId: 'aiCameraVideo',
      canvasElementId: 'aiCameraCanvas',
      statusElementId: 'aiStatusText',
      onHeart: null,
      onSwipeLeft: null,
      onSwipeRight: null,
      onVictory: null
    }, options);

    this.video = document.getElementById(this.options.videoElementId);
    this.canvas = document.getElementById(this.options.canvasElementId);
    this.statusText = document.getElementById(this.options.statusElementId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.hands = null;
    this.camera = null;
    this.isActive = false;
    this.lastGestureTime = 0;
    this.previousHandX = null;
    this.gestureCooldown = 1200; // ms between gesture triggers
  }

  async init() {
    if (typeof Hands === 'undefined') {
      console.warn('MediaPipe Hands library not loaded yet.');
      return false;
    }

    try {
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
      });

      this.hands.onResults((results) => this.onHandResults(results));
      return true;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Hands:', err);
      return false;
    }
  }

  async start() {
    if (!this.hands) {
      const ok = await this.init();
      if (!ok) return false;
    }

    if (!this.video) return false;

    try {
      if (typeof Camera !== 'undefined') {
        this.camera = new Camera(this.video, {
          onFrame: async () => {
            if (this.isActive && this.hands) {
              await this.hands.send({ image: this.video });
            }
          },
          width: 320,
          height: 240
        });
        await this.camera.start();
        this.isActive = true;
        this.updateStatus('AI 视界已就绪 (比心/挥手)', 'active');
        return true;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      this.updateStatus('摄像头未授权 (已启用触控/鼠标模式)', 'off');
      return false;
    }
    return false;
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    this.isActive = false;
    this.updateStatus('AI 视觉识别休眠', 'off');
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  updateStatus(text, state = 'normal') {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
    const dot = document.getElementById('aiPulseDot');
    if (dot) {
      if (state === 'active') {
        dot.style.color = '#10b981';
        dot.style.textShadow = '0 0 12px #10b981';
      } else if (state === 'heart') {
        dot.style.color = '#f43f5e';
        dot.style.textShadow = '0 0 20px #f43f5e';
      } else {
        dot.style.color = '#9ca3af';
        dot.style.textShadow = 'none';
      }
    }
  }

  onHandResults(results) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        this.drawHandLandmarks(landmarks);
      }

      this.analyzeGestures(results.multiHandLandmarks);
    }
    this.ctx.restore();
  }

  drawHandLandmarks(landmarks) {
    // Draw neon neural connections
    const connections = [
      [0,1],[1,2],[2,3],[3,4], // Thumb
      [0,5],[5,6],[6,7],[7,8], // Index
      [5,9],[9,10],[10,11],[11,12], // Middle
      [9,13],[13,14],[14,15],[15,16], // Ring
      [13,17],[17,18],[18,19],[19,20], // Pinky
      [0,17] // Palm base
    ];

    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    this.ctx.lineWidth = 2;

    for (const [i, j] of connections) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
      this.ctx.stroke();
    }

    // Draw neural landmark dots
    for (const p of landmarks) {
      this.ctx.beginPath();
      this.ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#f43f5e';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
    }
  }

  analyzeGestures(multiLandmarks) {
    const now = Date.now();
    if (now - this.lastGestureTime < this.gestureCooldown) return;

    // Check 1: Two-hand Heart or Single-hand Heart
    if (this.detectHeartGesture(multiLandmarks)) {
      this.lastGestureTime = now;
      this.updateStatus('✨ 神经网络识别：心动比心 🫶', 'heart');
      if (typeof this.options.onHeart === 'function') {
        this.options.onHeart();
      }
      setTimeout(() => this.updateStatus('AI 视界已就绪 (比心/挥手)', 'active'), 2000);
      return;
    }

    // Check 2: Single Hand Gestures (Victory / Swipe)
    const hand = multiLandmarks[0];
    if (hand) {
      // Victory / V-Sign (index and middle up, ring and pinky down)
      const indexUp = hand[8].y < hand[6].y;
      const middleUp = hand[12].y < hand[10].y;
      const ringDown = hand[16].y > hand[14].y;
      const pinkyDown = hand[20].y > hand[18].y;

      if (indexUp && middleUp && ringDown && pinkyDown) {
        this.lastGestureTime = now;
        this.updateStatus('✌️ 神经网络识别：切换模式', 'active');
        if (typeof this.options.onVictory === 'function') {
          this.options.onVictory();
        }
        return;
      }

      // Swipe Gestures: Tracking palm center (landmark 9)
      const palmX = hand[9].x;
      if (this.previousHandX !== null) {
        const deltaX = palmX - this.previousHandX;
        if (deltaX > 0.16) {
          // Hand swept right (mirror inverted -> left)
          this.lastGestureTime = now;
          this.updateStatus('🖐️ 隔空手势：向右翻页', 'active');
          if (typeof this.options.onSwipeRight === 'function') {
            this.options.onSwipeRight();
          }
        } else if (deltaX < -0.16) {
          this.lastGestureTime = now;
          this.updateStatus('🖐️ 隔空手势：向左翻页', 'active');
          if (typeof this.options.onSwipeLeft === 'function') {
            this.options.onSwipeLeft();
          }
        }
      }
      this.previousHandX = palmX;
    }
  }

  detectHeartGesture(multiLandmarks) {
    // 1. Two-handed heart shape: thumbs close together, index fingers arched
    if (multiLandmarks.length >= 2) {
      const h1 = multiLandmarks[0];
      const h2 = multiLandmarks[1];

      // Thumbs tips close
      const thumbDist = Math.hypot(h1[4].x - h2[4].x, h1[4].y - h2[4].y);
      // Index tips close
      const indexDist = Math.hypot(h1[8].x - h2[8].x, h1[8].y - h2[8].y);

      if (thumbDist < 0.22 && indexDist < 0.22) {
        return true;
      }
    }

    // 2. Single-hand Korean Finger Heart: thumb tip (4) and index tip (8) crossing/touching closely
    if (multiLandmarks.length >= 1) {
      const h = multiLandmarks[0];
      const tipDist = Math.hypot(h[4].x - h[8].x, h[4].y - h[8].y);
      const middleFolded = h[12].y > h[10].y;
      const ringFolded = h[16].y > h[14].y;
      const pinkyFolded = h[20].y > h[18].y;

      if (tipDist < 0.08 && middleFolded && ringFolded && pinkyFolded) {
        return true;
      }
    }

    return false;
  }
}

window.AIGestureEngine = AIGestureEngine;
