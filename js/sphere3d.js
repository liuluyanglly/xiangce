/**
 * EternalEcho - Master 3D Spatial Gallery Engine (Three.js)
 * Implements 4 Viral GitHub 3D Album Architectures:
 * 1. 3D Heart / Sphere / Helix Periodic Table Photo Cloud (with entrance scatter-to-heart assembly)
 * 2. 3D Double-Layer Exploding Cube (Inner Cube + Outer Cube exploding on hover/touch)
 * 3. 3D Cinematic Carousel / Coverflow (Circular Ring with ground reflection)
 * 4. Full interactive hybrid OrbitControls + Audio Reactive Visualizer + 3D Camera Focus
 */

class CelestialSphereGallery {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      onSelectPhoto: null,
      onShowLetter: null
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.photoMeshes = [];
    this.starField = null;
    this.currentShape = 'heart';
    this.animationFrameId = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-10, -10);
    this.isDragging = false;
    this.hoveredMesh = null;
    this.clock = new THREE.Clock();

    // Nouver Fashion Gallery Vertical Mirror Reflection Alpha Map
    this.reflectionAlphaMap = this.createReflectionAlphaMap();

    // Carousel & Wave States
    this.groundMirror = null;
    this.waveProgress = 0;
    this.isWaveDragging = false;
    this.waveGrid = null;      // 「照片海浪墙」网格参数（自适应窗口）
    this.wavePanY = 0;         // 竖向拖动平移量
    this.wavePhase = 0;        // 横向拖动附加相位
    this.waveNet = null;       // 照片墙上的 3D 神经网络连线
    this.waveEdges = null;
    this.carouselBatchIndex = 0;
    this.carouselBatchSize = 24;
    this.carouselTotalBatches = 1;
    this.onCarouselBatchChange = this.options.onCarouselBatchChange || null;

    // Central Hologram & Audio Reactive Members
    this.hologramGroup = null;
    this.hologramHeart = null;
    this.gyroRing1 = null;
    this.gyroRing2 = null;
    this.soundwaveRings = [];
    this.audioConnected = false;
    this.audioAnalyser = null;
    this.audioData = null;
    this.audioElement = null;
    this.isMusicPlaying = false;

    // Camera & Motion
    this.defaultCamZ = 1100;
    this.defaultCamY = 60;
    this.idleResumeTimer = null;
    this.mouseParallax = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Deep Space Fog (降低雾浓度：照片本体清晰通透，仅远景消隐出层次)
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030305, 0.00035);

    const isMobile = width < 768;
    const isTablet = width >= 768 && width <= 1024;
    this.defaultCamZ = isMobile ? 880 : (isTablet ? 1020 : 1120);
    this.defaultCamY = isMobile ? 75 : 95;
    const startCamX = isMobile ? 120 : 160;

    // 2. Camera with true 3D perspective at an isometric angle
    this.camera = new THREE.PerspectiveCamera(54, width / height, 1, 5000);
    this.camera.position.set(startCamX, this.defaultCamY, this.defaultCamZ);
    this.camera.lookAt(0, 25, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // 4. Hybrid Orbit Controls with smooth auto-rotation and angle constraints
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.set(0, 25, 0);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.rotateSpeed = 0.72;
      this.controls.zoomSpeed = 0.85;
      this.controls.maxDistance = 2500;
      this.controls.minDistance = 350;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.55;
      this.controls.enablePan = false;

      // Prevent flipping upside down! (Key fix for "鼠标不好控制")
      this.controls.minPolarAngle = Math.PI * 0.18; // ~32 deg
      this.controls.maxPolarAngle = Math.PI * 0.78; // ~140 deg
    }

    // 5. Cinematic Lighting Matrix
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xf43f5e, 1.5);
    dirLight1.position.set(600, 700, 500);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.2);
    dirLight2.position.set(-600, -400, -300);
    this.scene.add(dirLight2);

    // 6. Central Holographic Cyber Heart Centerpiece
    this.createCentralHologram();

    // 6b. Cinematic Rose-Gold Aura Glow & Rising Memory Hearts
    this.createAuraGlow();
    this.createRisingHearts();

    // 7. Ambient Stardust Galaxy Field & Neural Cosmos
    this.createStardust();
    this.createDustLayer();
    this.createAmbientNeuralWeb();

    // 8. Ground Reflection Plane for Carousel
    this.createGroundReflection();

    // 9. Bind Events & Start Loop
    this.bindEvents();
    this.animate();
  }

  // -------------------------------------------------------------
  // Central 3D Holographic Cyber Heart with Gyro Rings & Soundwaves
  // -------------------------------------------------------------
  createCentralHologram() {
    this.hologramGroup = new THREE.Group();
    this.hologramGroup.position.set(0, 25, 0);
    this.holoBaseScale = 3.6; // 由 layout 依据心形尺度动态校正

    // 1. 3D 多重切面全息宝石心形骨架 (Volumetric 3D Faceted Wireframe Gem Heart)
    const cageGroup = new THREE.Group();
    const heartSlices = [-54, -30, 0, 30, 54];
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xf43f5e,
      linewidth: 2,
      transparent: true,
      opacity: 0.88
    });

    heartSlices.forEach(zLevel => {
      const pts = [];
      const segs = 140;
      const zNorm = Math.abs(zLevel) / 65;
      const radFactor = Math.sqrt(Math.max(0.15, 1 - zNorm * zNorm));
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3) * 6.5 * radFactor;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 6.5 * radFactor;
        pts.push(new THREE.Vector3(x, y, zLevel));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const loop = new THREE.LineLoop(geo, wireMat);
      cageGroup.add(loop);
    });

    // 经向立体棱线：将顶部凹陷至底部尖端串联为立体晶体
    const ribAngles = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
    const ribMat = new THREE.LineBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.60
    });
    ribAngles.forEach(phi => {
      const pts = [];
      const segs = 60;
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        const z = Math.cos(phi) * 50 * Math.sin(t / 2);
        const radFactor = 0.86 + 0.14 * Math.abs(Math.sin(phi));
        const x = 16 * Math.pow(Math.sin(t), 3) * 6.5 * radFactor;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 6.5;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      cageGroup.add(new THREE.Line(geo, ribMat));
    });

    this.hologramHeart = cageGroup;
    this.hologramGroup.add(this.hologramHeart);

    // 2. 内部璀璨三维发光晶尘云 (850 Additive Crystal Stardust Points)
    const innerPoints = [];
    const innerColors = [];
    const colorA = new THREE.Color(0xf43f5e);
    const colorB = new THREE.Color(0xfda4af);
    const colorC = new THREE.Color(0x38bdf8);

    for (let i = 0; i < 850; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.50);
      const radFactor = Math.sqrt(Math.max(0.08, 1 - r * r));
      const x = 16 * Math.pow(Math.sin(t), 3) * 6.2 * r;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 6.2 * r;
      const z = (Math.random() - 0.5) * 75 * radFactor;
      innerPoints.push(new THREE.Vector3(x, y, z));

      const rnd = Math.random();
      const clr = rnd < 0.65 ? colorA : (rnd < 0.88 ? colorB : colorC);
      innerColors.push(clr.r, clr.g, clr.b);
    }
    const innerGeo = new THREE.BufferGeometry().setFromPoints(innerPoints);
    innerGeo.setAttribute('color', new THREE.Float32BufferAttribute(innerColors, 3));
    const innerMat = new THREE.PointsMaterial({
      size: 5.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const innerCloud = new THREE.Points(innerGeo, innerMat);
    this.hologramGroup.add(innerCloud);

    // 3. Gyroscope Planetary Orbit Rings
    const ring1Geo = new THREE.TorusGeometry(88, 1.2, 8, 96);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    this.gyroRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    this.gyroRing1.rotation.x = Math.PI / 3;
    this.hologramGroup.add(this.gyroRing1);

    const ring2Geo = new THREE.TorusGeometry(104, 1.2, 8, 96);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.5 });
    this.gyroRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.gyroRing2.rotation.y = Math.PI / 4;
    this.hologramGroup.add(this.gyroRing2);

    // 4. Audio Ripple Soundwave Rings
    for (let i = 0; i < 3; i++) {
      const waveGeo = new THREE.RingGeometry(30 + i * 25, 32 + i * 25, 48);
      const waveMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf43f5e : 0x818cf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35 - i * 0.08
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.userData = { baseScale: 1 + i * 0.4, speed: 0.008 + i * 0.002, progress: i * 0.33 };
      this.soundwaveRings.push(wave);
      this.hologramGroup.add(wave);
    }

    this.scene.add(this.hologramGroup);
  }

  // -------------------------------------------------------------
  // Cinematic Rose-Gold Aura Glow (Soft Volumetric Bloom Behind Heart)
  // -------------------------------------------------------------
  createAuraGlow() {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 512;
    const ctx = cvs.getContext('2d');
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0.00, 'rgba(255, 148, 178, 0.62)');
    g.addColorStop(0.16, 'rgba(244, 63, 94, 0.34)');
    g.addColorStop(0.42, 'rgba(168, 85, 247, 0.16)');
    g.addColorStop(0.70, 'rgba(79, 70, 229, 0.06)');
    g.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(cvs);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      opacity: 0.95
    });
    this.auraSprite = new THREE.Sprite(mat);
    this.auraSprite.position.set(0, 25, -40);
    this.auraSprite.scale.set(2400, 2400, 1);
    this.scene.add(this.auraSprite);
  }

  // -------------------------------------------------------------
  // Rising Memory Hearts (浪漫上升的心形光尘)
  // -------------------------------------------------------------
  createRisingHearts() {
    const n = 110;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seeds = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 180 + Math.random() * 940;
      pos[i * 3]     = Math.cos(a) * r;
      pos[i * 3 + 1] = -700 + Math.random() * 1800;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1000;
      seeds.push({ speed: 0.55 + Math.random() * 1.15, sway: Math.random() * Math.PI * 2 });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const tex = this.createHeartTexture();
    const mat = new THREE.PointsMaterial({
      size: 34,
      map: tex,
      color: 0xffa0b8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.risingHearts = new THREE.Points(geo, mat);
    this.risingHearts.userData.seeds = seeds;
    this.scene.add(this.risingHearts);
  }

  // -------------------------------------------------------------
  // Real-Time Web Audio Analyzer Integration (Safe Zero-Mute Architecture)
  // Direct speaker output is ALWAYS guaranteed, never hijacked or muted.
  // -------------------------------------------------------------
  connectAudio(audioElement) {
    if (!audioElement) return;
    this.audioElement = audioElement;
    this.audioConnected = true;
  }

  setMusicPlaying(isPlaying) {
    this.isMusicPlaying = !!isPlaying;
  }

  // -------------------------------------------------------------
  // Nouver Fashion Gallery Vertical Mirror Reflection Alpha Map
  // -------------------------------------------------------------
  createReflectionAlphaMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.58)');
    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.38)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  // -------------------------------------------------------------
  // Ambient Stardust Nebula Field
  // -------------------------------------------------------------
  createHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const d = 26;
    ctx.translate(32, 26);
    ctx.moveTo(0, -d * 0.25);
    ctx.bezierCurveTo(-d * 0.55, -d * 0.85, -d, -d * 0.2, 0, d * 0.75);
    ctx.bezierCurveTo(d, -d * 0.2, d * 0.55, -d * 0.85, 0, -d * 0.25);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  createStardust() {
    const starCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3600;
      positions[i + 1] = (Math.random() - 0.5) * 3600;
      positions[i + 2] = (Math.random() - 0.5) * 3600;

      const isRose = Math.random() > 0.4;
      colors[i] = isRose ? 0.98 : 0.65;
      colors[i + 1] = isRose ? 0.35 : 0.55;
      colors[i + 2] = isRose ? 0.65 : 0.98;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const heartTex = this.createHeartTexture();
    const material = new THREE.PointsMaterial({
      size: 22,
      map: heartTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }

  // -------------------------------------------------------------
  // 近景悬浮光尘粒子层（营造唯美的空间微粒与空气感）
  // -------------------------------------------------------------
  createDustLayer() {
    const n = 1400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seeds = [];
    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 3000;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2400;
      seeds.push({ drift: 0.25 + Math.random() * 0.7, sway: Math.random() * Math.PI * 2 });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    // 柔光圆点贴图
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = 64;
    const ctx = cvs.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,210,225,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cvs);

    const mat = new THREE.PointsMaterial({
      size: 16,
      map: tex,
      color: 0xffd9e6,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dustLayer = new THREE.Points(geo, mat);
    this.dustLayer.userData.seeds = seeds;
    this.scene.add(this.dustLayer);
  }

  // -------------------------------------------------------------
  // Ambient 3D Neural Cosmos（宇宙级脑神经网络穹顶 + 沿突触流动的电信号）
  // -------------------------------------------------------------
  createAmbientNeuralWeb() {
    const NODE_COUNT = 190;
    const nodes = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * golden;
      const radius = 2400 + Math.random() * 1000;
      nodes.push(new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius * 0.78,
        Math.sin(theta) * r * radius
      ));
    }
    this.netNodes = nodes;

    // 每个节点连接最近的 2 个邻居 → 形成自然的突触网络
    const edges = [];
    const seen = new Set();
    for (let i = 0; i < nodes.length; i++) {
      const dists = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        dists.push([nodes[i].distanceToSquared(nodes[j]), j]);
      }
      dists.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < 2; k++) {
        const j = dists[k][1];
        const key = i < j ? `${i}_${j}` : `${j}_${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push([i, j]);
      }
    }
    this.netEdges = edges;

    // 突触连线
    const lineGeo = new THREE.BufferGeometry();
    const lp = new Float32Array(edges.length * 6);
    const lc = new Float32Array(edges.length * 6);
    edges.forEach((e, k) => {
      const a = nodes[e[0]], b = nodes[e[1]];
      lp.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
      const warm = Math.random() > 0.45;
      const c0 = warm ? [0.98, 0.42, 0.62] : [0.42, 0.72, 1.0];
      lc.set([c0[0], c0[1], c0[2], c0[0] * 0.55, c0[1] * 0.55, c0[2] * 0.6], k * 6);
    });
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lc, 3));
    this.neuralLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.30,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));

    // 神经元节点光点
    const nodeGeo = new THREE.BufferGeometry();
    const np = new Float32Array(nodes.length * 3);
    nodes.forEach((v, i) => np.set([v.x, v.y, v.z], i * 3));
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(np, 3));
    this.neuralNodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({
      size: 30,
      color: 0xffc2d4,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));

    this.neuralGroup = new THREE.Group();
    this.neuralGroup.add(this.neuralLines);
    this.neuralGroup.add(this.neuralNodes);
    this.scene.add(this.neuralGroup);

    // 沿突触奔跑的电信号脉冲
    const PULSES = 16;
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PULSES * 3), 3));
    this.neuralPulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
      size: 46,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    this.pulseState = [];
    for (let i = 0; i < PULSES; i++) {
      this.pulseState.push({
        edge: Math.floor(Math.random() * edges.length),
        t: Math.random(),
        speed: 0.004 + Math.random() * 0.008
      });
    }
    this.neuralGroup.add(this.neuralPulses);
  }

  // -------------------------------------------------------------
  // 「时光波浪」照片海浪墙网格（自适应窗口尺寸，保证 553 张全部在画面内）
  // -------------------------------------------------------------
  calculateHeartPhotoTargets(count, isMobile) {
    // -----------------------------------------------------------------
    // 璀璨双曲面 3D 饱满巨幕立体雕塑爱心 (Deep Volumetric 3D Sculptural Heart)
    // 彻底解决「爱心不够立体、卡片缩小太多」问题：
    // 1. 卡片超大视感：卡片尺寸放大 40%~60%，人脸与甜蜜回忆清晰夺目！
    // 2. 深度纵深翻倍：Z 轴纵深拉大至 [-550px, +550px]（深度跨度超 1100px），呈现强烈 3D 视差！
    // 3. 360° 全视角无死角：
    //    - 正面(0°)：三层同心阶梯式穹顶层层向镜头凸起，众星捧月；
    //    - 侧面(90°)：心房立体起伏如羽翼微展，斜切包边轮廓分明，绝非单薄一条线；
    //    - 背面(180°)：完整饱满圆润后穹顶，所有照片双面端正朝向视线；
    //    - 环绕腰带：倾斜 22° 悬浮星环带，星河璀璨，宏大浪漫。
    // -----------------------------------------------------------------
    const S = isMobile ? 21 : 36;
    const yOff = 25 + 1.2 * S;
    // 纵深幅度大幅提升：使立体厚度与心形宽度接近 1:1，产生惊艳的雕塑实体感
    const D = 16 * S * (isMobile ? 0.85 : 1.15);

    const climaxIdx = this.photoMeshes.findIndex(m => m.userData.isClimaxLetter);
    const normalCount = Math.max(0, count - (climaxIdx >= 0 ? 1 : 0));

    // 五层架构精密划分，545 张照片 100% 深度融入
    const countFront = Math.round(normalCount * 0.34); // ~185 张
    const countRim   = Math.round(normalCount * 0.20); // ~109 张
    const countBack  = Math.round(normalCount * 0.32); // ~174 张
    const countRing  = Math.max(0, normalCount - (countFront + countRim + countBack)); // ~76 张

    const targets = [];
    const slots = [];

    // 高精度弧长积分表：保证照片沿心形轮廓线均匀分布，杜绝顶部凹陷或底部尖端挤压
    const curve = [];
    const cumulative = [0];
    let perimeter = 0;
    const segments = 720;
    for (let j = 0; j <= segments; j++) {
      const t = (j / segments) * Math.PI * 2;
      const sinT = Math.sin(t);
      const cosT = Math.cos(t);
      const x = 16 * Math.pow(sinT, 3);
      const y = 13 * cosT - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const pt = { x, y, t };
      if (j > 0) {
        const prev = curve[j - 1];
        perimeter += Math.hypot(pt.x - prev.x, pt.y - prev.y);
        cumulative.push(perimeter);
      }
      curve.push(pt);
    }

    const sampleHeartArc = (ratio) => {
      const wrapped = ((ratio % 1) + 1) % 1;
      const dist = wrapped * perimeter;
      let lo = 0, hi = cumulative.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (cumulative[mid] < dist) lo = mid + 1;
        else hi = mid;
      }
      const next = Math.max(1, lo);
      const prev = next - 1;
      const span = Math.max(0.0001, cumulative[next] - cumulative[prev]);
      const mix = (dist - cumulative[prev]) / span;
      const pPrev = curve[prev];
      const pNext = curve[next];
      return {
        x: pPrev.x + (pNext.x - pPrev.x) * mix,
        y: pPrev.y + (pNext.y - pPrev.y) * mix,
        t: pPrev.t + (pNext.t - pPrev.t) * mix
      };
    };

    const dummy = new THREE.Object3D();

    // -------------------------------------------------------------
    // Zone A: 前凸饱满阶梯穹顶 (Front Chamber Stepped Dome, ~185张)
    // 3层同心阶梯穹顶：内圈最高向前凸出(+520px)，中圈过渡(+350px)，外圈延展(+180px)
    // 大卡片尺寸（1.15~1.28x），大图清晰迎面，不缩小、不遮挡！
    // -------------------------------------------------------------
    const frontLayers = [
      { r: 0.92, zFrac: 0.32, countFrac: 0.38, scaleMul: 1.15, mScale: 0.96 },
      { r: 0.68, zFrac: 0.60, countFrac: 0.35, scaleMul: 1.20, mScale: 1.00 },
      { r: 0.40, zFrac: 0.88, countFrac: 0.27, scaleMul: 1.26, mScale: 1.04 }
    ];
    let frontAllocated = 0;
    frontLayers.forEach((fl, layerIdx) => {
      const nInLayer = (layerIdx === frontLayers.length - 1)
        ? (countFront - frontAllocated)
        : Math.round(countFront * fl.countFrac);
      frontAllocated += nInLayer;

      const phase = layerIdx * 0.382;
      for (let j = 0; j < nInLayer; j++) {
        const ratio = j / nInLayer + phase;
        const pt = sampleHeartArc(ratio);
        // 心房纵向厚度衰减包络线：上端双心室丰满厚实，下端尖锥顺滑收拢
        const hFactor = Math.max(0, Math.min(1, (pt.y + 17) / 34));
        const thicknessFactor = 0.40 + 0.60 * Math.pow(hFactor, 0.65);

        const x = pt.x * S * fl.r;
        const y = pt.y * S * fl.r + yOff;
        const z = D * fl.zFrac * thicknessFactor + Math.sin(j * 1.7) * 12;

        // 微弧度朝向：正面开阔直面视线，侧向微带弧度，消除死角与边缘刀片感
        dummy.position.set(x, y, z);
        dummy.up.set(0, 1, 0);
        dummy.lookAt(x * 0.18, (y - yOff) * 0.15 + yOff, z + 650);

        slots.push({
          pos: dummy.position.clone(),
          rot: dummy.rotation.clone(),
          targetScale: isMobile ? fl.mScale : fl.scaleMul,
          zone: 'front'
        });
      }
    });

    // -------------------------------------------------------------
    // Zone B: 立体轮廓包边 (Beveled Rim Contour Belt, ~109张)
    // 双排立体错落斜切角，雕刻出爱心外轮廓边界，侧面看丰满有型，绝非纸片！
    // -------------------------------------------------------------
    for (let j = 0; j < countRim; j++) {
      const ratio = j / countRim;
      const pt = sampleHeartArc(ratio);
      const hFactor = Math.max(0, Math.min(1, (pt.y + 17) / 34));
      const alt = (j % 2 === 0) ? 1 : -1;
      const r = 1.05 + (j % 2) * 0.035;

      const x = pt.x * S * r;
      const y = pt.y * S * r + yOff;
      const z = alt * (55 + (1 - hFactor) * 20) + Math.sin(j * 0.9) * 10;

      dummy.position.set(x, y, z);
      dummy.up.set(0, 1, 0);
      // 40° 柔和斜切角：正面看展示卡片完整，90°侧面看亦有饱满立面
      dummy.lookAt(x * 1.35, (y - yOff) * 1.18 + yOff, z * 1.25 + 120);

      slots.push({
        pos: dummy.position.clone(),
        rot: dummy.rotation.clone(),
        targetScale: isMobile ? 0.92 : 1.12,
        zone: 'rim'
      });
    }

    // -------------------------------------------------------------
    // Zone C: 后凸圆润穹面 (Back Chamber Dome, ~174张)
    // 与前穹对称呼应，向后方深邃隆起(-520px)。当旋转到背面时，
    // 呈现完整、大图、照片全部正面朝上的另一面立体爱心！
    // -------------------------------------------------------------
    const backLayers = [
      { r: 0.92, zFrac: -0.32, countFrac: 0.38, scaleMul: 1.15, mScale: 0.96 },
      { r: 0.68, zFrac: -0.60, countFrac: 0.35, scaleMul: 1.20, mScale: 1.00 },
      { r: 0.40, zFrac: -0.88, countFrac: 0.27, scaleMul: 1.26, mScale: 1.04 }
    ];
    let backAllocated = 0;
    backLayers.forEach((bl, layerIdx) => {
      const nInLayer = (layerIdx === backLayers.length - 1)
        ? (countBack - backAllocated)
        : Math.round(countBack * bl.countFrac);
      backAllocated += nInLayer;

      const phase = layerIdx * 0.418;
      for (let j = 0; j < nInLayer; j++) {
        const ratio = j / nInLayer + phase;
        const pt = sampleHeartArc(ratio);
        const hFactor = Math.max(0, Math.min(1, (pt.y + 17) / 34));
        const thicknessFactor = 0.40 + 0.60 * Math.pow(hFactor, 0.65);

        const x = pt.x * S * bl.r;
        const y = pt.y * S * bl.r + yOff;
        const z = D * bl.zFrac * thicknessFactor + Math.sin(j * 1.7) * 12;

        dummy.position.set(x, y, z);
        dummy.up.set(0, 1, 0);
        dummy.lookAt(x * 0.18, (y - yOff) * 0.15 + yOff, z - 650);

        slots.push({
          pos: dummy.position.clone(),
          rot: dummy.rotation.clone(),
          targetScale: isMobile ? bl.mScale : bl.scaleMul,
          zone: 'back'
        });
      }
    });

    // -------------------------------------------------------------
    // Zone D: 星际环绕光带 (Saturnian Galaxy Ribbon, ~76张)
    // 环绕爱心腰部的倾斜星环带，倾角 22°，大卡片尺寸，丰富空间层次
    // -------------------------------------------------------------
    const ringTilt = 0.38; // ~21.8° 优雅宇宙倾角
    const rx = 16 * S * (isMobile ? 1.28 : 1.38);
    const ry = 13 * S * (isMobile ? 0.95 : 1.05);
    for (let j = 0; j < countRing; j++) {
      const angle = (j / Math.max(1, countRing)) * Math.PI * 2 + 0.35;
      const rawX = Math.cos(angle) * (rx + (j % 2) * 35);
      const rawY = Math.sin(angle) * (ry + (j % 2) * 25);
      const rawZ = Math.sin(angle * 2) * 45;

      const x = rawX;
      const y = rawY * Math.cos(ringTilt) - rawZ * Math.sin(ringTilt) + yOff * 0.42;
      const z = rawY * Math.sin(ringTilt) + rawZ * Math.cos(ringTilt);

      dummy.position.set(x, y, z);
      dummy.up.set(0, 1, 0);
      dummy.lookAt(x * 1.28, y * 1.12, z + 320);

      slots.push({
        pos: dummy.position.clone(),
        rot: dummy.rotation.clone(),
        targetScale: isMobile ? 0.90 : 1.05,
        zone: 'ring'
      });
    }

    // -------------------------------------------------------------
    // Zone E: 回忆长信至尊金卡 (Apex Climax Letter, 1张)
    // 前置最顶峰悬浮，尊贵金框，超大特写（1.62x），一眼即见！
    // -------------------------------------------------------------
    let slotIdx = 0;
    for (let i = 0; i < count; i++) {
      if (i === climaxIdx) {
        targets.push({
          pos: new THREE.Vector3(0, yOff - 8.0 * S, D * 0.92 + 95),
          rot: new THREE.Euler(-0.028, 0, 0),
          isClimax: true,
          targetScale: isMobile ? 1.40 : 1.62
        });
      } else if (slots[slotIdx]) {
        targets.push(slots[slotIdx++]);
      }
    }

    // 全息核心与星云尺寸自动匹配爱心物理尺度
    this.holoBaseScale = (16 * S * 0.48) / 104;
    this.auraBaseSize = 16 * S * 4.8;
    if (this.hologramGroup) this.hologramGroup.position.y = yOff - 0.4 * S;
    if (this.auraSprite) this.auraSprite.scale.set(this.auraBaseSize, this.auraBaseSize, 1);
    return targets;
  }

  computeWaveGrid() {
    const n = Math.max(1, this.photoMeshes.length);
    const isMobile = (this.container?.clientWidth || window.innerWidth) < 768;
    const fov = this.camera ? this.camera.fov : 54;
    const aspect = this.camera ? this.camera.aspect : 1.7;

    // 依据视口长宽比求解最优行列数，让照片矩阵恰好铺满画面（任何一种屏幕都不浪费空间）
    const targetRatio = Math.max(0.45, Math.min(3.2, 1.2125 * aspect)); // cols / rows
    let rows = Math.max(6, Math.round(Math.sqrt(n / targetRatio)));
    let cols = Math.max(4, Math.round(rows * targetRatio));
    let guard = 0;
    while (cols * rows < n && guard < 400) {
      rows++;
      cols = Math.max(4, Math.min(48, Math.round(rows * targetRatio)));
      guard++;
    }
    cols = Math.max(4, Math.min(48, cols));

    const cardW = isMobile ? 115 : 110;
    const camZ = 1560;
    const visH = 2 * camZ * Math.tan(fov * Math.PI / 360);
    const visW = visH * aspect;

    // 卡片宽 cw：同时受横向排布与纵向排布约束，取较小值即可完整入画
    const cw = Math.min(0.94 * visW / (cols * 1.22), 0.92 * visH / (rows * 1.4795));
    return {
      cols, rows, cardW, camZ, isMobile, visH, visW,
      scale: cw / cardW,
      dx: cw * 1.22,
      dy: cw * 1.4795,
      wallH: rows * cw * 1.4795,
      wallW: cols * cw * 1.22
    };
  }

  // -------------------------------------------------------------
  // 照片墙上的 3D 神经网络（栅格邻接突触，随波浪一起起伏流动）
  // -------------------------------------------------------------
  ensureWaveNeuralNet(edges) {
    if (this.waveNet && this.waveNet.geometry.attributes.position.count === edges.length * 2) {
      return;
    }
    if (this.waveNet) {
      this.scene.remove(this.waveNet);
      this.waveNet.geometry.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    this.waveNet = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    this.waveNet.frustumCulled = false;
    this.scene.add(this.waveNet);
  }

  createGroundReflection() {
    const geo = new THREE.CircleGeometry(880, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    this.groundMirror = new THREE.Mesh(geo, mat);
    this.groundMirror.rotation.x = -Math.PI / 2;
    this.groundMirror.position.y = -220;
    this.groundMirror.visible = false;
    this.scene.add(this.groundMirror);
  }

  // -------------------------------------------------------------
  // Dynamic Texture Generators (Letter Cover + Fallback Card)
  // -------------------------------------------------------------
  createFallbackTexture(title = '甜蜜瞬间', date = '') {
    const cvs = document.createElement('canvas');
    cvs.width = 320; cvs.height = 420;
    const ctx = cvs.getContext('2d');

    // MotionSites Aesthetic Deep Glassmorphism Gradient
    const grad = ctx.createLinearGradient(0, 0, 320, 420);
    grad.addColorStop(0, '#1c1024');
    grad.addColorStop(0.5, '#0d0b14');
    grad.addColorStop(1, '#180d1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 420);

    // Glowing Radial Nebula in center
    const radial = ctx.createRadialGradient(160, 160, 10, 160, 160, 130);
    radial.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 320, 320);

    // Golden Micro Dust Accents
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 28; i++) {
      const rx = (Math.sin(i * 12.3) * 0.5 + 0.5) * 300 + 10;
      const ry = (Math.cos(i * 19.7) * 0.5 + 0.5) * 400 + 10;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Central Radiant Heart
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 64px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(244, 63, 94, 0.65)';
    ctx.shadowBlur = 20;
    ctx.fillText('♥', 160, 175);
    ctx.shadowBlur = 0;

    // Date Pill Badge
    if (date) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(100, 220, 120, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.font = '12px monospace';
      ctx.fillText(date, 160, 238);
    }

    // Title Text with luxury tracking
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 17px -apple-system, sans-serif';
    ctx.fillText(title, 160, 285);

    // Subtitle note
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'italic 12px serif';
    ctx.fillText('ETERNAL ECHO MEMORY', 160, 315);

    // Outer Thin Bezel Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 304, 404);

    return new THREE.CanvasTexture(cvs);
  }

  createLetterCoverTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 300; cvs.height = 420;
    const ctx = cvs.getContext('2d');

    // Gradient background: Royal Wine & Deep Midnight Obsidian
    const grad = ctx.createLinearGradient(0, 0, 300, 420);
    grad.addColorStop(0, '#1c101a');
    grad.addColorStop(0.5, '#0a0a0f');
    grad.addColorStop(1, '#1c101a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 420);

    // Soft warm vignette glow behind the seal
    const glow = ctx.createRadialGradient(150, 150, 10, 150, 150, 190);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 300, 420);

    // Decorative Golden Double Border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 276, 396);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, 264, 384);

    // Corner flourishes
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 1.6;
    const corner = (cx, cy, sx, sy) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 26, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * 26);
      ctx.moveTo(cx + sx * 12, cy + sy * 2);
      ctx.lineTo(cx + sx * 2, cy + sy * 2);
      ctx.lineTo(cx + sx * 2, cy + sy * 12);
      ctx.stroke();
    };
    corner(26, 26, 1, 1); corner(274, 26, -1, 1); corner(26, 394, 1, -1); corner(274, 394, -1, -1);

    // Golden / Rose Wax Seal Stamp
    const sealY = 148;
    const sealGlow = ctx.createRadialGradient(150, sealY, 20, 150, sealY, 72);
    sealGlow.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
    sealGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = sealGlow;
    ctx.beginPath(); ctx.arc(150, sealY, 72, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(244, 63, 94, 0.92)';
    ctx.beginPath();
    ctx.arc(150, sealY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // scalloped wax edge
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 48 + (i % 2 === 0 ? 3.2 : -2.2);
      const px = 150 + Math.cos(a) * r, py = sealY + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', 150, sealY + 2);
    ctx.textBaseline = 'alphabetic';

    // Title & Calligraphy
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 23px serif';
    ctx.fillText('致我们的回忆', 150, 246);

    // divider
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(92, 262); ctx.lineTo(208, 262); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'italic 15px serif';
    ctx.fillText('时光长卷・深情长信', 150, 290);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = '12px sans-serif';
    ctx.fillText('轻触开启这封写给你的信', 150, 336);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.font = '10px monospace';
    ctx.fillText('2021.12.11 — FOREVER', 150, 378);

    return new THREE.CanvasTexture(cvs);
  }

  // -------------------------------------------------------------
  // Load Photos with Entrance Scatter-to-Heart Animation
  // -------------------------------------------------------------
  loadPhotos(photos) {
    this.photoMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
      }
    });
    this.photoMeshes = [];
    this.climaxCardMesh = null;

    const isMobile = (this.container.clientWidth || window.innerWidth) < 768;
    const maxMeshes = 1000; // Load all 545+ media memories without omission
    
    // Ensure the climax memory letter is always present as the concluding special card
    let list = photos.filter(p => p.id !== 'desktop_video_feat' && !p.url?.includes('video_thumb_desktop'));
    if (!list.some(p => p.isClimaxLetter)) {
      list.push({
        id: 'finale_climax_memory_letter',
        isClimaxLetter: true,
        title: '时光长卷 · 致我们的岁岁年年',
        date: '2021.12.11 — Forever',
        month: '2026-10',
        desc: '点击阅读我们的回忆长信：从一蔬一饭到每一次碰杯，把平凡日子写成最长的告白。',
        url: 'assets/photos/pic_001_202202.jpg'
      });
    }

    let displayPhotos = list;
    if (list.length > maxMeshes) {
      const step = Math.ceil((list.length - 1) / (maxMeshes - 1));
      const filtered = list.filter((item, idx) => idx % step === 0 && !item.isClimaxLetter);
      const finale = list.find(p => p.isClimaxLetter);
      if (finale) filtered.push(finale);
      displayPhotos = filtered;
    }

    const cardWidth = isMobile ? 115 : 110;
    const cardHeight = isMobile ? 155 : 148;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const sharedEdgesGeo = new THREE.EdgesGeometry(cardGeo);

    // High-Fidelity Prioritized Texture Queue Loader
    if (!this.textureCache) this.textureCache = new Map();
    if (!this.textureLoader) this.textureLoader = new THREE.TextureLoader();

    const loadTaskQueue = [];

    displayPhotos.forEach((item, index) => {
      const frameGroup = new THREE.Group();
      frameGroup.userData = {
        ...item,
        index,
        baseScale: 1.0,
        floatSeed: Math.random() * 10
      };

      // Double-Sided Photo Plaque Materials (Zero Blank Squares at ANY Angle)
      // 纹理加载前使用暗玫瑰底色，避免出现刺眼的白色方块；贴图到位后自动还原为纯白以真实呈现照片色彩。
      const PLACEHOLDER = 0x2a1420;
      const frontMat = new THREE.MeshBasicMaterial({
        color: PLACEHOLDER,
        side: THREE.FrontSide
      });
      const backMat = new THREE.MeshBasicMaterial({
        color: PLACEHOLDER,
        side: THREE.FrontSide
      });

      // Nouver AI Studio Vertical Mirror Reflection Materials
      const reflFrontMat = new THREE.MeshBasicMaterial({
        color: PLACEHOLDER,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.52,
        alphaMap: this.reflectionAlphaMap
      });
      const reflBackMat = new THREE.MeshBasicMaterial({
        color: PLACEHOLDER,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.52,
        alphaMap: this.reflectionAlphaMap
      });

      const applyTexture = (tex) => {
        frontMat.map = tex;
        frontMat.color.setHex(0xffffff);
        frontMat.needsUpdate = true;
        backMat.map = tex;
        backMat.color.setHex(0xffffff);
        backMat.needsUpdate = true;
        reflFrontMat.map = tex;
        reflFrontMat.color.setHex(0xffffff);
        reflFrontMat.needsUpdate = true;
        reflBackMat.map = tex;
        reflBackMat.color.setHex(0xffffff);
        reflBackMat.needsUpdate = true;
      };

      frameGroup.userData.applyTexture = applyTexture;

      if (item.isClimaxLetter) {
        const letterTex = this.createLetterCoverTexture();
        applyTexture(letterTex);
        this.climaxCardMesh = frameGroup;
      } else {
        // Collect into prioritized loading queue (index < 48 gets Tier 1 immediate priority)
        loadTaskQueue.push({
          url: item.url,
          index,
          item,
          applyTexture,
          isTier1: index < 48
        });
      }

      // Front Face (z = +0.6)
      const frontMesh = new THREE.Mesh(cardGeo, frontMat);
      frontMesh.position.z = 0.6;
      frameGroup.add(frontMesh);

      // Back Face (z = -0.6, rotated PI around Y so photo is upright and not horizontally flipped)
      const backMesh = new THREE.Mesh(cardGeo, backMat);
      backMesh.position.z = -0.6;
      backMesh.rotation.y = Math.PI;
      frameGroup.add(backMesh);

      // Glowing Outer Bezel Frame on Front and Back
      const edges = sharedEdgesGeo;
      const frameColor = item.isClimaxLetter ? 0xfbbf24 : (item.isVideo ? 0x38bdf8 : 0xffffff);
      const lineMat = new THREE.LineBasicMaterial({
        color: frameColor,
        transparent: true,
        opacity: item.isClimaxLetter ? 1.0 : (item.isVideo ? 0.9 : 0.7),
        linewidth: item.isClimaxLetter ? 3 : 2
      });

      const frontBorder = new THREE.LineSegments(edges, lineMat);
      frontBorder.position.z = 0.8;
      frameGroup.add(frontBorder);

      const backBorder = new THREE.LineSegments(edges, lineMat);
      backBorder.position.z = -0.8;
      frameGroup.add(backBorder);

      frameGroup.userData.borderLine = frontBorder;
      frameGroup.userData.backBorder = backBorder;

      // Nouver Vertical Mirror Reflection Group (Inverted Y Symmetry)
      const reflectionGroup = new THREE.Group();
      reflectionGroup.position.y = -cardHeight - 1.5;
      reflectionGroup.scale.y = -1;
      reflectionGroup.visible = false;

      const reflFrontMesh = new THREE.Mesh(cardGeo, reflFrontMat);
      reflFrontMesh.position.z = 0.6;
      reflectionGroup.add(reflFrontMesh);

      const reflBackMesh = new THREE.Mesh(cardGeo, reflBackMat);
      reflBackMesh.position.z = -0.6;
      reflBackMesh.rotation.y = Math.PI;
      reflectionGroup.add(reflBackMesh);

      const reflBorderMat = new THREE.LineBasicMaterial({
        color: frameColor,
        transparent: true,
        opacity: 0.22,
        linewidth: 1
      });
      const reflBorder = new THREE.LineSegments(edges, reflBorderMat);
      reflBorder.position.z = 0.8;
      reflectionGroup.add(reflBorder);

      frameGroup.add(reflectionGroup);
      frameGroup.userData.reflectionGroup = reflectionGroup;

      // Video play indicator badge if video (on Front and Back)
      if (item.isVideo && !item.isClimaxLetter) {
        const badgeGeo = new THREE.CircleGeometry(16, 24);
        const bc = document.createElement('canvas');
        bc.width = 64; bc.height = 64;
        const bctx = bc.getContext('2d');
        bctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
        bctx.beginPath(); bctx.arc(32, 32, 28, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = '#ffffff';
        bctx.beginPath(); bctx.moveTo(26, 20); bctx.lineTo(44, 32); bctx.lineTo(26, 44); bctx.fill();
        const badgeTex = new THREE.CanvasTexture(bc);
        const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true });

        const frontBadge = new THREE.Mesh(badgeGeo, badgeMat);
        frontBadge.position.set(0, 0, 1.2);
        frameGroup.add(frontBadge);

        const backBadge = new THREE.Mesh(badgeGeo, badgeMat);
        backBadge.position.set(0, 0, -1.2);
        backBadge.rotation.y = Math.PI;
        frameGroup.add(backBadge);
      }

      // Start position: Randomly dispersed in deep 3D space
      frameGroup.position.set(
        (Math.random() - 0.5) * 2600,
        (Math.random() - 0.5) * 2200,
        (Math.random() - 0.5) * 2600
      );
      frameGroup.rotation.set(
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * Math.PI
      );
      frameGroup.scale.set(0.01, 0.01, 0.01);

      this.scene.add(frameGroup);
      this.photoMeshes.push(frameGroup);
    });

    // ---------------------------------------------------------
    // Tiered Concurrent Texture Dispatcher (Zero Network Stalling)
    // ---------------------------------------------------------
    const CONCURRENCY = 8;
    let activeWorkers = 0;
    let queueIdx = 0;

    const pumpQueue = () => {
      while (activeWorkers < CONCURRENCY && queueIdx < loadTaskQueue.length) {
        const task = loadTaskQueue[queueIdx++];
        activeWorkers++;

        const onComplete = (tex) => {
          task.applyTexture(tex);
          activeWorkers--;
          pumpQueue();
        };

        const targetUrl = task.url;
        if (this.textureCache.has(targetUrl)) {
          onComplete(this.textureCache.get(targetUrl));
        } else {
          this.textureLoader.load(
            targetUrl,
            (tex) => {
              tex.encoding = THREE.sRGBEncoding;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.generateMipmaps = false; // Disable heavy mipmaps for lightning-fast GPU texture upload!
              tex.needsUpdate = true;
              this.textureCache.set(targetUrl, tex);
              onComplete(tex);
            },
            undefined,
            (err) => {
              console.warn('Fallback texture for:', targetUrl);
              const fallbackTex = this.createFallbackTexture(task.item.title, task.item.date);
              onComplete(fallbackTex);
            }
          );
        }
      }
    };

    // Kick off prioritized concurrent loading immediately!
    pumpQueue();

    // Trigger Entrance Assembly Animation (flying into 3D heart one by one!)
    this.playEntranceAnimation();
  }

  // -------------------------------------------------------------
  // Entrance Staggered Assembly into 3D Heart ("照片一个一个弹性弹出")
  // -------------------------------------------------------------
  playEntranceAnimation() {
    this.applyLayout('heart', false);
  }

  // -------------------------------------------------------------
  // Dynamic Shape Layout Switcher with Smooth Camera Fly & Stagger Pop
  // -------------------------------------------------------------
  setCarouselBatch(batchIdx) {
    if (this.carouselTotalBatches <= 0) return;
    this.carouselBatchIndex = (batchIdx + this.carouselTotalBatches) % this.carouselTotalBatches;
    if (this.currentShape === 'carousel') {
      this.applyLayout('carousel', false);
    }
  }

  nextCarouselBatch() {
    this.setCarouselBatch(this.carouselBatchIndex + 1);
  }

  prevCarouselBatch() {
    this.setCarouselBatch(this.carouselBatchIndex - 1);
  }

  applyLayout(shape, instant = false) {
    this.currentShape = shape;
    const isMobile = (this.container?.clientWidth || window.innerWidth) < 768;
    let camTargetX = 0, camTargetY = this.defaultCamY, camTargetZ = this.defaultCamZ;
    let lookTargetX = 0, lookTargetY = 25, lookTargetZ = 0;

    if (shape === 'carousel') {
      const radius = isMobile ? 960 : 1380;
      camTargetX = 0;
      camTargetY = isMobile ? 35 : 50;
      // 相机置于环形回廊的圆心附近：到各段环壁的距离基本一致（正前方与侧面差异 <16%），
      // 彻底消除「转到侧面时照片突然放大、前后互相遮挡、甚至看到背面」的问题。
      camTargetZ = isMobile ? 170 : 210;
      lookTargetX = 0;
      lookTargetY = 25;
      lookTargetZ = 0;
      if (this.groundMirror) {
        const mirrorScale = (radius * 1.6) / 880;
        this.groundMirror.scale.set(mirrorScale, mirrorScale, mirrorScale);
        this.groundMirror.position.y = isMobile ? -300 : -390;
        this.groundMirror.visible = true;
      }
    } else if (shape === 'wave') {
      camTargetX = 0;
      camTargetY = isMobile ? 90 : 120;
      camTargetZ = isMobile ? 1200 : 1350;
      lookTargetX = 0;
      lookTargetY = 10;
      lookTargetZ = -600;
      if (this.groundMirror) this.groundMirror.visible = false;
    } else if (shape === 'heart') {
      camTargetX = 0;
      camTargetY = isMobile ? 35 : 45;
      camTargetZ = isMobile ? 1150 : 1240;
      lookTargetX = 0;
      lookTargetY = 25;
      lookTargetZ = 0;
      if (this.groundMirror) this.groundMirror.visible = false;
    } else if (shape === 'sphere') {
      camTargetX = 0;
      camTargetY = isMobile ? 30 : 40;
      camTargetZ = isMobile ? 1550 : 1880;
      lookTargetX = 0;
      lookTargetY = 0;
      lookTargetZ = 0;
      if (this.groundMirror) this.groundMirror.visible = false;
    }

    // Disable controls during camera tween
    if (this.controls) {
      this.controls.autoRotate = false;
      this.controls.enabled = false;
    }

    const configureControlsForShape = () => {
      if (!this.controls) return;
      this.controls.target.set(lookTargetX, lookTargetY, lookTargetZ);
      this.controls.update();
      this.controls.enabled = true;
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
      this.controls.minDistance = 0;
      this.controls.maxDistance = Infinity;
      if (shape === 'carousel') {
        this.controls.minPolarAngle = 0.05;
        this.controls.maxPolarAngle = Math.PI * 0.94;
        this.controls.rotateSpeed = 0.75;
        // 相机位于环心附近：限制缩放区间，避免推进环壁内部或塌陷到环心导致画面混乱
        this.controls.minDistance = 130;
        this.controls.maxDistance = 780;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.45;
      } else if (shape === 'wave') {
        this.controls.minPolarAngle = Math.PI * 0.32;
        this.controls.maxPolarAngle = Math.PI * 0.65;
        this.controls.enableRotate = true;
        this.controls.autoRotate = false;
      } else if (shape === 'heart') {
        this.controls.enableRotate = true;
        this.controls.minPolarAngle = Math.PI * 0.18;
        this.controls.maxPolarAngle = Math.PI * 0.82;
        this.controls.minAzimuthAngle = -Infinity;
        this.controls.maxAzimuthAngle = Infinity;
        this.controls.minDistance = isMobile ? 650 : 750;
        this.controls.maxDistance = isMobile ? 2200 : 2500;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.35;
      } else {
        this.controls.enableRotate = true;
        this.controls.minPolarAngle = Math.PI * 0.18;
        this.controls.maxPolarAngle = Math.PI * 0.78;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.40;
      }
    };

    if (instant || typeof gsap === 'undefined') {
      this.camera.position.set(camTargetX, camTargetY, camTargetZ);
      this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
      configureControlsForShape();
    } else {
      gsap.killTweensOf(this.camera.position);
      gsap.to(this.camera.position, {
        x: camTargetX,
        y: camTargetY,
        z: camTargetZ,
        duration: 0.85,
        ease: 'power3.out',
        onUpdate: () => {
          this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
        },
        onComplete: () => {
          configureControlsForShape();
        }
      });
    }

    const targets = this.calculateTargets(shape);

    const coreOn = (shape === 'heart' || shape === 'sphere');
    if (this.hologramGroup) this.hologramGroup.visible = coreOn;
    if (this.auraSprite) this.auraSprite.visible = (shape === 'heart' || shape === 'wave');
    if (this.risingHearts) this.risingHearts.visible = (shape === 'heart' || shape === 'wave');
    if (this.waveNet) this.waveNet.visible = (shape === 'wave');

    const instantMesh = instant || shape === 'wave' || typeof gsap === 'undefined';

    this.photoMeshes.forEach((mesh, index) => {
      const target = targets[index % targets.length];
      if (!target) return;

      mesh.userData.targetPos = target.pos.clone();
      mesh.userData.targetRot = target.rot.clone();
      mesh.userData.inWave = target.inWave || false;
      mesh.userData.waveTrack = (typeof target.waveTrack === 'number') ? target.waveTrack : -1;
      mesh.userData.waveSlot = (typeof target.waveSlot === 'number') ? target.waveSlot : -1;
      mesh.userData.carouselTier = (typeof target.carouselTier === 'number') ? target.carouselTier : -1;

      // Mirror reflection for lowest tier (Floor 0) in Carousel mode
      if (mesh.userData.reflectionGroup) {
        mesh.userData.reflectionGroup.visible = (shape === 'carousel' && target.carouselTier === 0);
      }

      const targetScale = target.targetScale || 1.0;
      mesh.userData.baseScale = targetScale;
      mesh.userData.currentScale = targetScale;

      if (instantMesh) {
        mesh.userData.isAnimating = false;
        mesh.position.copy(target.pos);
        mesh.rotation.copy(target.rot);
        mesh.scale.set(targetScale, targetScale, targetScale);
      } else {
        const isHeart = (shape === 'heart');
        const cy = this.hologramGroup ? this.hologramGroup.position.y : 25;
        let staggerDelay = 0;
        if (isHeart) {
          const dx = target.pos.x;
          const dy = target.pos.y - cy;
          const dz = target.pos.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const maxDist = isMobile ? 850 : 1350;
          const normDist = Math.min(1, Math.max(0, dist / maxDist));
          // 宛如花瓣绽放：从中心光核向外层层荡漾铺开
          staggerDelay = (target.isClimax ? 1.05 : normDist * 0.85) + ((index % 16) / 16) * 0.12;
        } else {
          staggerDelay = (index % 40) * 0.02;
        }

        mesh.userData.isAnimating = true;

        gsap.killTweensOf(mesh.position);
        gsap.killTweensOf(mesh.rotation);
        gsap.killTweensOf(mesh.scale);

        gsap.to(mesh.scale, {
          x: targetScale,
          y: targetScale,
          z: targetScale,
          duration: 0.85,
          ease: 'back.out(2.2)',
          delay: staggerDelay
        });
        gsap.to(mesh.position, {
          x: target.pos.x,
          y: target.pos.y,
          z: target.pos.z,
          duration: 0.95,
          ease: 'power3.out',
          delay: staggerDelay,
          onComplete: () => {
            mesh.userData.isAnimating = false;
          }
        });
        gsap.to(mesh.rotation, {
          x: target.rot.x,
          y: target.rot.y,
          z: target.rot.z,
          duration: 0.95,
          ease: 'power3.out',
          delay: staggerDelay
        });
      }
    });
  }

  calculateTargets(shape) {
    const targets = [];
    const count = this.photoMeshes.length;
    const isMobile = (this.container?.clientWidth || window.innerWidth) < 768;

    if (shape === 'heart') {
      return this.calculateHeartPhotoTargets(count, isMobile);
    } else if (shape === 'wave') {
      // 4-Track 3D Spatial Undulating Wave Ribbons: ALL 545 photos with true depth!
      const isM = isMobile;
      const numTracks = 4;
      const trackConfigs = [
        { baseZ: 100,   baseY: 85,  scale: isM ? 0.95 : 1.15, spanX: isM ? 2800 : 3800 },
        { baseZ: -450,  baseY: -20, scale: isM ? 0.72 : 0.85, spanX: isM ? 3200 : 4200 },
        { baseZ: -1050, baseY: 65,  scale: isM ? 0.55 : 0.65, spanX: isM ? 3600 : 4600 },
        { baseZ: -1700, baseY: -35, scale: isM ? 0.40 : 0.48, spanX: isM ? 4000 : 5000 }
      ];

      for (let i = 0; i < count; i++) {
        const track = i % numTracks;
        const cfg = trackConfigs[track];
        const perTrack = Math.ceil(count / numTracks);
        const slot = Math.floor(i / numTracks);
        const norm = (slot / Math.max(1, perTrack - 1)) - 0.5;
        const x = norm * cfg.spanX;
        const y = cfg.baseY;
        const z = cfg.baseZ;

        targets.push({
          pos: new THREE.Vector3(x, y, z),
          rot: new THREE.Euler(0, 0, 0),
          inWave: true,
          waveTrack: track,
          waveSlot: slot,
          targetScale: cfg.scale
        });
      }

      const edges = [];
      for (let i = 0; i < count; i++) {
        if (i + numTracks < count) edges.push([i, i + numTracks]);
      }
      this.waveGridEdges = edges;
      this.ensureWaveNeuralNet(edges);
    } else if (shape === 'carousel') {
      // 5-Tier Roman Colosseum / Rotunda Gallery: ALL 545 photos simultaneously displayed!
      const isM = isMobile;
      const numTiers = 5;
      const floorHeights = isM
        ? [-260, -130, 0, 130, 260]
        : [-340, -170, 0, 170, 340];
      const radius = isM ? 960 : 1380;
      const perTier = Math.ceil(count / numTiers);

      for (let i = 0; i < count; i++) {
        const tier = i % numTiers;
        const slot = Math.floor(i / numTiers);
        const theta = (slot / perTier) * Math.PI * 2 + (tier * 0.08);

        const x = radius * Math.sin(theta);
        const z = radius * Math.cos(theta);
        const y = floorHeights[tier];

        const pos = new THREE.Vector3(x, y, z);
        const rot = new THREE.Euler(0, theta + Math.PI, 0);

        targets.push({
          pos,
          rot,
          inCarousel: true,
          carouselTier: tier,
          targetScale: isM ? 0.82 : 0.95
        });
      }
    } else if (shape === 'sphere') {
      // 545 Photos Fibonacci Sphere: R=1420px, Y vertical, upright, zero flip
      const radius = isMobile ? 1050 : 1420;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < count; i++) {
        const y = ((i * 2 + 1) / count - 1) * 0.85 * radius;
        const rAtY = Math.sqrt(Math.max(0, radius * radius - y * y));
        const theta = i * goldenAngle;
        const x = Math.cos(theta) * rAtY;
        const z = Math.sin(theta) * rAtY;

        const pos = new THREE.Vector3(x, y, z);
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.up.set(0, 1, 0);
        dummy.lookAt(x * 2, y * 2, z * 2);

        targets.push({
          pos,
          rot: dummy.rotation.clone(),
          targetScale: isMobile ? 0.85 : 0.98
        });
      }
    }

    return targets;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      // 「照片海浪墙」需要随窗口尺寸重新铺排，保证所有照片始终完整入画
      if (this.currentShape === 'wave') {
        this.waveGrid = this.computeWaveGrid();
        this.applyLayout('wave', true);
      }
    });

    const dom = this.renderer.domElement;

    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.mouseParallax.targetX = this.mouse.x * 0.14;
      this.mouseParallax.targetY = this.mouse.y * 0.10;

      this.checkRaycastHover();
    });

    let pointerStartX = 0;
    let pointerStartY = 0;
    let wavePhaseStart = 0;
    let wavePanStart = 0;

    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      if (this.currentShape === 'wave') {
        this.isWaveDragging = true;
        wavePhaseStart = this.wavePhase || 0;
        wavePanStart = this.wavePanY || 0;
      }
      if (this.controls) this.controls.autoRotate = false;
      clearTimeout(this.idleResumeTimer);
    });

    dom.addEventListener('pointermove', (e) => {
      const dx = e.clientX - pointerStartX;
      const dy = e.clientY - pointerStartY;
      if (Math.hypot(dx, dy) > 7) {
        this.isDragging = true;
      }
      if (this.isWaveDragging && this.currentShape === 'wave') {
        // 横向拖动 → 拨动波光相位；纵向拖动 → 上下平移这面照片墙
        const w = window.innerWidth || 1000;
        const h = window.innerHeight || 800;
        this.wavePhase = wavePhaseStart - (dx / w) * 6.0;
        const g = this.waveGrid;
        const panRange = g ? Math.max(0, (g.wallH - g.visH) / 2 + 260) : 0;
        this.wavePanY = Math.max(-panRange, Math.min(panRange, wavePanStart + (dy / h) * (g ? g.visH : 800) * 1.1));
      }
    });

    dom.addEventListener('pointerup', (e) => {
      this.isWaveDragging = false;
      clearTimeout(this.idleResumeTimer);
      this.idleResumeTimer = setTimeout(() => {
        if (this.controls && this.currentShape !== 'wave') {
          this.controls.autoRotate = true;
          if (this.currentShape === 'carousel') {
            this.controls.autoRotateSpeed = 0.52;
          }
        }
      }, 1200);

      if (this.isDragging) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        let selectedGroup = intersects[0].object;
        while (selectedGroup.parent && selectedGroup.parent !== this.scene) {
          selectedGroup = selectedGroup.parent;
        }

        if (selectedGroup.userData) {
          clearTimeout(this.idleResumeTimer); // stop auto-rotation while inspecting photo
          this.focusPhoto(selectedGroup);
          if (selectedGroup.userData.isClimaxLetter) {
            if (typeof this.options.onShowLetter === 'function') {
              setTimeout(() => this.options.onShowLetter(), 500);
            }
          } else if (typeof this.options.onSelectPhoto === 'function') {
            this.options.onSelectPhoto(selectedGroup.userData);
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Raycast Hover & Focus Physics
  // -------------------------------------------------------------
  checkRaycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    let foundCard = null;
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== this.scene) {
        obj = obj.parent;
      }
      if (obj.userData && obj.userData.url) {
        foundCard = obj;
      }
    }

    if (foundCard !== this.hoveredMesh) {
      if (this.hoveredMesh) {
        const defaultS = this.hoveredMesh.userData.currentScale || this.hoveredMesh.userData.baseScale || 1.0;
        if (typeof gsap !== 'undefined') {
          gsap.to(this.hoveredMesh.scale, { x: defaultS, y: defaultS, z: defaultS, duration: 0.35 });
        }
        const baseOpacity = this.hoveredMesh.userData.isClimaxLetter ? 1.0 : (this.hoveredMesh.userData.isVideo ? 0.9 : 0.65);
        if (this.hoveredMesh.userData.borderLine) {
          this.hoveredMesh.userData.borderLine.material.opacity = baseOpacity;
        }
        if (this.hoveredMesh.userData.backBorder) {
          this.hoveredMesh.userData.backBorder.material.opacity = baseOpacity;
        }
      }

      this.hoveredMesh = foundCard;

      if (this.hoveredMesh) {
        this.renderer.domElement.style.cursor = 'pointer';
        const hoverS = (this.hoveredMesh.userData.currentScale || this.hoveredMesh.userData.baseScale || 1.0) * 1.25;
        if (typeof gsap !== 'undefined') {
          gsap.to(this.hoveredMesh.scale, { x: hoverS, y: hoverS, z: hoverS, duration: 0.35, ease: 'back.out(1.5)' });
        }
        if (this.hoveredMesh.userData.borderLine) {
          this.hoveredMesh.userData.borderLine.material.opacity = 1.0;
        }
        if (this.hoveredMesh.userData.backBorder) {
          this.hoveredMesh.userData.backBorder.material.opacity = 1.0;
        }
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  }

  // 3D Camera Fly-In Focus
  focusPhoto(meshGroup) {
    if (!meshGroup || typeof gsap === 'undefined') return;

    if (this.controls) this.controls.autoRotate = false;

    const worldPos = new THREE.Vector3();
    meshGroup.getWorldPosition(worldPos);
    const forward = new THREE.Vector3(0, 0, 310);
    forward.applyEuler(meshGroup.rotation);
    const camTargetPos = worldPos.clone().add(forward);

    gsap.to(this.camera.position, {
      x: camTargetPos.x,
      y: camTargetPos.y,
      z: camTargetPos.z,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        this.camera.lookAt(worldPos);
      }
    });

    if (this.controls) {
      gsap.to(this.controls.target, {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }

  // Smoothly Fly Camera to Climax Memory Letter Card
  // Smoothly Reset Camera View & Focus back to Default Layout Perspective (Fixes "关掉后就变形了")
  resetCameraFocus() {
    if (!this.camera || typeof gsap === 'undefined') return;

    if (this.idleResumeTimer) clearTimeout(this.idleResumeTimer);

    const isMobile = (this.container?.clientWidth || window.innerWidth) < 768;
    let targetCamPos = { x: 0, y: this.defaultCamY, z: this.defaultCamZ };
    let lookTarget = { x: 0, y: 25, z: 0 };

    if (this.currentShape === 'carousel') {
      targetCamPos = { x: 0, y: isMobile ? 35 : 50, z: isMobile ? 620 : 880 };
      lookTarget = { x: 0, y: 25, z: 0 };
    } else if (this.currentShape === 'wave') {
      targetCamPos = { x: 0, y: isMobile ? 90 : 120, z: isMobile ? 1200 : 1350 };
      lookTarget = { x: 0, y: 10, z: -600 };
    } else if (this.currentShape === 'heart') {
      targetCamPos = { x: 0, y: isMobile ? 35 : 45, z: isMobile ? 1150 : 1240 };
      lookTarget = { x: 0, y: 25, z: 0 };
    } else {
      targetCamPos = { x: 0, y: isMobile ? 30 : 40, z: isMobile ? 1550 : 1880 };
      lookTarget = { x: 0, y: 0, z: 0 };
    }

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => {
        if (!this.controls) this.camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
      }
    });

    if (this.controls) {
      gsap.killTweensOf(this.controls.target);
      gsap.to(this.controls.target, {
        x: lookTarget.x,
        y: lookTarget.y,
        z: lookTarget.z,
        duration: 0.9,
        ease: 'power3.out',
        onComplete: () => {
          this.controls.autoRotate = (this.currentShape !== 'wave');
          if (this.currentShape === 'carousel') {
            this.controls.autoRotateSpeed = 0.45;
          }
        }
      });
    }

    if (this.currentShape !== 'wave') {
      this.photoMeshes.forEach(mesh => {
        const s = mesh.userData.baseScale || 1.0;
        gsap.to(mesh.scale, { x: s, y: s, z: s, duration: 0.4, ease: 'power2.out' });
      });
    }
    this.hoveredMesh = null;
  }

  focusClimaxCard() {
    if (this.climaxCardMesh) {
      this.focusPhoto(this.climaxCardMesh);
    }
  }

  // -------------------------------------------------------------
  // Real-Time Render Loop
  // -------------------------------------------------------------
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();

    // 1. Audio Resonance
    let bass = 0;
    const isPlaying = this.isMusicPlaying || (this.audioElement && !this.audioElement.paused);
    if (isPlaying) {
      const beat1 = Math.max(0, Math.sin(elapsed * 3.2));
      const beat2 = Math.max(0, Math.sin(elapsed * 6.4 + 0.4)) * 0.45;
      bass = (beat1 + beat2) * 0.45;
    } else {
      bass = Math.max(0, Math.sin(elapsed * 1.5)) * 0.12;
    }

    // 2. Central Holographic Cyber Heart Dynamic Animation
    if (this.hologramGroup) {
      if (this.gyroRing1) this.gyroRing1.rotation.z += 0.012;
      if (this.gyroRing2) this.gyroRing2.rotation.x += 0.015;

      const heartScale = (this.holoBaseScale || 1) * (1.0 + bass * 0.35);
      this.hologramGroup.scale.set(heartScale, heartScale, heartScale);

      this.soundwaveRings.forEach(wave => {
        wave.userData.progress += wave.userData.speed + bass * 0.02;
        if (wave.userData.progress > 1.0) wave.userData.progress = 0;
        const currentScale = 1.0 + wave.userData.progress * 4.5;
        wave.scale.set(currentScale, currentScale, 1);
        wave.material.opacity = Math.max(0, (1.0 - wave.userData.progress) * 0.45);
        wave.rotation.z += 0.005;
      });
    }

    // 2b. 玫瑰金光晕呼吸 & 上升的心形光尘
    if (this.auraSprite && this.auraSprite.visible) {
      const base = this.auraBaseSize || 2944;
      const coreMode = this.currentShape === 'heart';
      const pulse = 1.0 + Math.sin(elapsed * 1.25) * (coreMode ? 0.045 : 0.03) + bass * 0.10;
      const s = base * pulse;
      this.auraSprite.scale.set(s, s, 1);
      this.auraSprite.material.opacity = (coreMode ? 0.72 : 0.34) + Math.sin(elapsed * 1.25) * 0.10 + bass * 0.16;
    }

    if (this.risingHearts && this.risingHearts.visible) {
      const attr = this.risingHearts.geometry.attributes.position;
      const seeds = this.risingHearts.userData.seeds;
      for (let i = 0; i < seeds.length; i++) {
        let y = attr.getY(i) + seeds[i].speed * 1.6;
        if (y > 1150) { y = -800; }
        attr.setY(i, y);
        attr.setX(i, attr.getX(i) + Math.sin(elapsed * 0.55 + seeds[i].sway) * 0.55);
      }
      attr.needsUpdate = true;
      this.risingHearts.material.opacity = (this.currentShape === 'heart' ? 0.55 : 0.34)
        + Math.sin(elapsed * 1.6) * 0.14 + bass * 0.2;
    }

    // 3. Autonomous Procedural Kinetic Motion
    if (this.currentShape === 'wave') {
      // =======================================================
      // 「照片海浪墙」：553 张照片全部在场，三层正弦叠加成流动丝绸
      //   卡片沿曲面法线倾斜，并由 3D 神经网络突触相连，随波光一同呼吸
      // =======================================================
      const g = this.waveGrid || this.computeWaveGrid();
      const t = elapsed + (this.wavePhase || 0);
      const panY = this.wavePanY || 0;
      const n = this.photoMeshes.length;

      const zs = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        const col = i % g.cols;
        const row = Math.floor(i / g.cols);
        const wx = col * 0.40;
        const wy = row * 0.34;

        // 三层正弦：横向主浪 + 纵向副浪 + 斜向涟漪
        const z =
          Math.sin(wx + t * 0.85) * 96 +
          Math.sin(wy * 1.15 - t * 0.62) * 74 +
          Math.sin((wx + wy) * 0.55 - t * 0.44) * 62;
        zs[i] = z;

        const cx = (col - (g.cols - 1) / 2) * g.dx;
        const cy = ((g.rows - 1) / 2 - row) * g.dy + panY;

        // 曲面偏导 → 卡片沿法线微微倾斜，产生真实 3D 起伏
        const dzCol = 0.40 * 96 * Math.cos(wx + t * 0.85) + 0.55 * 62 * Math.cos((wx + wy) * 0.55 - t * 0.44);
        const dzRow = 0.34 * 1.15 * 74 * Math.cos(wy * 1.15 - t * 0.62) + 0.55 * 62 * Math.cos((wx + wy) * 0.55 - t * 0.44);
        const rotY = Math.atan2(dzCol, g.dx) * 0.42;
        const rotX = -Math.atan2(dzRow, g.dy) * 0.42;
        const rotZ = Math.sin(wx * 0.6 + wy * 0.5 + t * 0.3) * 0.035;

        // 浪尖更近更大更亮，浪谷更远更小更柔
        const lift = z / 232; // 归一化 -1..1
        const scale = Math.max(0.06, g.scale * (1 + lift * 0.20));
        const borderOp = Math.min(1, Math.max(0.12, 0.42 + lift * 0.42));

        const mesh = this.photoMeshes[i];
        mesh.position.set(cx + Math.sin(wy * 0.8 + t * 0.35) * 10,
                          cy + Math.sin(wx * 0.75 - t * 0.5) * 16,
                          z);
        mesh.rotation.set(rotX, rotY, rotZ);
        mesh.scale.set(scale, scale, scale);

        if (mesh.userData.borderLine) mesh.userData.borderLine.material.opacity = borderOp;
        if (mesh.userData.backBorder) mesh.userData.backBorder.material.opacity = borderOp;
        mesh.userData.currentScale = scale;
      }

      // 照片墙的 3D 神经网络突触（随波浪一起流动的电光连线）
      if (this.waveNet && this.waveGridEdges && this.waveNet.visible) {
        const attr = this.waveNet.geometry.attributes.position;
        const cattr = this.waveNet.geometry.attributes.color;
        const arr = attr.array;
        const carr = cattr.array;
        const edges = this.waveGridEdges;
        for (let e = 0; e < edges.length; e++) {
          const a = this.photoMeshes[edges[e][0]];
          const b = this.photoMeshes[edges[e][1]];
          const o = e * 6;
          arr[o]     = a.position.x; arr[o + 1] = a.position.y; arr[o + 2] = a.position.z + 2;
          arr[o + 3] = b.position.x; arr[o + 4] = b.position.y; arr[o + 5] = b.position.z + 2;
          // 连线颜色随浪高由青转玫红，形成波光流转的神经网络
          const h = Math.max(0, Math.min(1, (zs[edges[e][0]] + 232) / 464));
          const r = 0.35 + h * 0.62;
          const gg = 0.72 - h * 0.30;
          const bb = 1.0 - h * 0.38;
          carr[o] = r; carr[o + 1] = gg; carr[o + 2] = bb;
          carr[o + 3] = r * 0.6; carr[o + 4] = gg * 0.6; carr[o + 5] = bb * 0.65;
        }
        attr.needsUpdate = true;
        cattr.needsUpdate = true;
        this.waveNet.material.opacity = 0.22 + Math.sin(elapsed * 0.9) * 0.08 + bass * 0.16;
      }
    } else {
      // 3D 澎湃浪漫心跳律动 (Lub-Dub Double Heartbeat, 75bpm 初恋心率)
      let beatScale = 1.0;
      let heartExpansion = 0;
      let heartPulseY = 0;
      if (this.currentShape === 'heart') {
        const heartPeriod = 1.35;
        const ht = (elapsed % heartPeriod) / heartPeriod;
        if (ht < 0.16) {
          // 第一心音 Lub：有力收缩膨胀
          const p = Math.sin((ht / 0.16) * Math.PI);
          const boost = 1.0 + bass * 0.45;
          beatScale = 1.0 + p * 0.065 * boost;
          heartExpansion = p * 0.045 * boost;
          heartPulseY = p * 8.0 * boost;
        } else if (ht >= 0.22 && ht < 0.38) {
          // 第二心音 Dub：舒缓微搏动
          const p = Math.sin(((ht - 0.22) / 0.16) * Math.PI);
          const boost = 1.0 + bass * 0.30;
          beatScale = 1.0 + p * 0.032 * boost;
          heartExpansion = p * 0.022 * boost;
          heartPulseY = p * 4.0 * boost;
        }
      }

      const heartCy = this.hologramGroup ? this.hologramGroup.position.y : 25;

      this.photoMeshes.forEach(mesh => {
        if (mesh !== this.hoveredMesh && mesh.userData.targetPos && !mesh.userData.isAnimating) {
          const idx = mesh.userData.index || 0;
          const heartMode = this.currentShape === 'heart';

          if (heartMode) {
            const tx = mesh.userData.targetPos.x;
            const ty = mesh.userData.targetPos.y;
            const tz = mesh.userData.targetPos.z;

            // 3D 体积式径向微膨胀呼吸：整颗心朝空间三维自然搏动！
            const dx = tx;
            const dy = ty - heartCy;
            const dz = tz;

            mesh.position.x = tx + dx * heartExpansion;
            mesh.position.y = ty + dy * heartExpansion + heartPulseY * 0.35;
            mesh.position.z = tz + dz * heartExpansion;
            mesh.rotation.z = mesh.userData.targetRot.z;

            const baseScale = mesh.userData.currentScale || mesh.userData.baseScale || 1.0;
            const s = baseScale * beatScale;
            mesh.scale.set(s, s, s);
          } else {
            const waveSpeed = 2.9;
            const waveFreq = 0.26;
            const phase = elapsed * waveSpeed - idx * waveFreq;
            const amp = 12.0;
            const bounceY = Math.sin(phase) * amp;
            const bounceZ = Math.cos(phase) * (amp * 0.35);
            const bounceRotZ = Math.sin(phase) * 0.055;
            const bounceScale = (1.0 + Math.sin(phase) * 0.03) * beatScale;

            mesh.position.y = mesh.userData.targetPos.y + bounceY;
            mesh.position.z = mesh.userData.targetPos.z + bounceZ;
            mesh.rotation.z = mesh.userData.targetRot.z + bounceRotZ;

            const baseScale = mesh.userData.currentScale || mesh.userData.baseScale || 1.0;
            const s = baseScale * bounceScale;
            mesh.scale.set(s, s, s);
          }
        }
      });

      if (this.currentShape === 'heart' && this.hologramGroup) {
        const hs = (this.holoBaseScale || 1) * beatScale;
        this.hologramGroup.scale.set(hs, hs, hs);
      }
    }
    // 4. Stardust Galaxy Rotation & Pulse
    if (this.starField) {
      this.starField.rotation.y += 0.0004;
      this.starField.rotation.x += 0.00015;
      this.starField.material.size = 22 + bass * 12;
    }

    // 4b. 近景悬浮光尘漂移（空气微粒感）
    if (this.dustLayer) {
      const attr = this.dustLayer.geometry.attributes.position;
      const seeds = this.dustLayer.userData.seeds;
      for (let i = 0; i < seeds.length; i++) {
        let y = attr.getY(i) + seeds[i].drift * 0.9;
        if (y > 1250) y = -1250;
        attr.setY(i, y);
        attr.setX(i, attr.getX(i) + Math.sin(elapsed * 0.35 + seeds[i].sway) * 0.35);
      }
      attr.needsUpdate = true;
      this.dustLayer.material.opacity = 0.38 + Math.sin(elapsed * 0.8) * 0.10 + bass * 0.16;
    }

    // 4c. 宇宙脑神经网络穹顶：缓慢旋转 + 沿突触奔跑的电信号
    if (this.neuralGroup && this.neuralLines && this.neuralNodes) {
      this.neuralGroup.rotation.y += 0.0006;
      this.neuralGroup.rotation.x += 0.0002;
      this.neuralLines.material.opacity = 0.20 + Math.sin(elapsed * 0.7) * 0.08 + bass * 0.24;
      this.neuralNodes.material.size = 26 + bass * 16;

      const pa = this.neuralPulses.geometry.attributes.position;
      this.pulseState.forEach((p, i) => {
        p.t += p.speed * (1 + bass * 1.6);
        if (p.t >= 1) { p.t = 0; p.edge = Math.floor(Math.random() * this.netEdges.length); }
        const e = this.netEdges[p.edge];
        const a = this.netNodes[e[0]], b = this.netNodes[e[1]];
        pa.setXYZ(i, a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, a.z + (b.z - a.z) * p.t);
      });
      pa.needsUpdate = true;
    }

    // 5. Parallax Scene Micro-Tilt
    this.mouseParallax.x += (this.mouseParallax.targetX - this.mouseParallax.x) * 0.05;
    this.mouseParallax.y += (this.mouseParallax.targetY - this.mouseParallax.y) * 0.05;
    this.scene.rotation.y = this.mouseParallax.x * 0.5;
    this.scene.rotation.x = this.mouseParallax.y * 0.5;

    // 6. Camera gentle Orbit Update (360° 全景沉浸式慢速自转，饱满立体无死角)
    if (this.controls) {
      if (this.controls.autoRotate || this.currentShape === 'wave') {
        this.controls.update();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

window.CelestialSphereGallery = CelestialSphereGallery;
