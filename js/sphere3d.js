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

    // Exploding Cube state
    this.isCubeExploded = false;

    // Carousel state
    this.groundMirror = null;

    // Central Hologram & Audio Reactive Members
    this.hologramGroup = null;
    this.hologramHeart = null;
    this.gyroRing1 = null;
    this.gyroRing2 = null;
    this.soundwaveRings = [];
    this.audioConnected = false;
    this.audioAnalyser = null;
    this.audioData = null;

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

    // 1. Scene & Deep Space Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030305, 0.00065);

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

    // 7. Ambient Stardust Galaxy Field
    this.createStardust();

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
    this.hologramGroup.position.set(0, 30, 0);

    // Parametric 3D Wireframe Heart Core
    const heartPoints = [];
    const segments = 160;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3) * 6.5;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 6.5;
      const z = Math.sin(t * 3) * 18;
      heartPoints.push(new THREE.Vector3(x, y, z));
    }

    const heartGeo = new THREE.BufferGeometry().setFromPoints(heartPoints);
    const heartMat = new THREE.LineBasicMaterial({
      color: 0xf43f5e,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.hologramHeart = new THREE.LineLoop(heartGeo, heartMat);
    this.hologramGroup.add(this.hologramHeart);

    // Inner glowing crystal heart point cloud
    const innerPoints = [];
    for (let i = 0; i < 240; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6);
      const x = 16 * Math.pow(Math.sin(t), 3) * 5.8 * r;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 5.8 * r;
      const z = (Math.random() - 0.5) * 35 * r;
      innerPoints.push(new THREE.Vector3(x, y, z));
    }
    const innerGeo = new THREE.BufferGeometry().setFromPoints(innerPoints);
    const innerMat = new THREE.PointsMaterial({
      color: 0xfda4af,
      size: 5,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const innerCloud = new THREE.Points(innerGeo, innerMat);
    this.hologramGroup.add(innerCloud);

    // Gyroscope Planetary Orbit Rings
    const ring1Geo = new THREE.TorusGeometry(125, 1.2, 8, 80);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    this.gyroRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    this.gyroRing1.rotation.x = Math.PI / 3;
    this.hologramGroup.add(this.gyroRing1);

    const ring2Geo = new THREE.TorusGeometry(140, 1.2, 8, 80);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.5 });
    this.gyroRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.gyroRing2.rotation.y = Math.PI / 4;
    this.hologramGroup.add(this.gyroRing2);

    // Audio Ripple Soundwave Rings
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
  // Real-Time Web Audio Analyzer Integration
  // -------------------------------------------------------------
  connectAudio(audioElement) {
    if (this.audioConnected || !audioElement) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaElementSource(audioElement);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      this.audioAnalyser = analyser;
      this.audioData = new Uint8Array(analyser.frequencyBinCount);
      this.audioConnected = true;

      const resumeCtx = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        window.removeEventListener('pointerdown', resumeCtx);
      };
      window.addEventListener('pointerdown', resumeCtx, { once: true });
    } catch (e) {
      console.warn('Audio analyzer connected via synthetic pulse fallback:', e);
      this.audioConnected = false;
    }
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
  createFallbackTexture(title = '甜蜜瞬间') {
    const cvs = document.createElement('canvas');
    cvs.width = 256; cvs.height = 340;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 340);
    grad.addColorStop(0, '#2e1022');
    grad.addColorStop(1, '#0e0b16');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 340);
    ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 56px sans-serif'; ctx.fillText('♥', 105, 140);
    ctx.fillStyle = '#fda4af'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(title, 25, 210);
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

    // Decorative Golden Double Border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 276, 396);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, 264, 384);

    // Golden / Rose Wax Seal Stamp
    ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
    ctx.beginPath();
    ctx.arc(150, 140, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', 150, 152);

    // Title & Calligraphy
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px serif';
    ctx.fillText('致我们的回忆', 150, 235);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'italic 15px serif';
    ctx.fillText('时光长卷・深情长信', 150, 270);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '12px sans-serif';
    ctx.fillText('轻触开启两载春秋总结', 150, 330);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.font = '10px monospace';
    ctx.fillText('2022.02.14 — 2026.10.25', 150, 370);

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
    const maxMeshes = isMobile ? 56 : 76;
    
    // Ensure the climax memory letter is always present as the concluding special card
    let list = [...photos];
    if (!list.some(p => p.isClimaxLetter)) {
      list.push({
        id: 'finale_climax_memory_letter',
        isClimaxLetter: true,
        title: '时光长卷 · 致两载春秋',
        date: 'Forever & Beyond',
        month: '2026-10',
        desc: '点击阅读致两载春秋的深情长信：从初春微风到岁月长流，愿往后每一个春夏秋冬，我们依旧手牵着手。',
        url: 'assets/photos/video_thumb_desktop.jpg'
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

    displayPhotos.forEach((item, index) => {
      const frameGroup = new THREE.Group();
      frameGroup.userData = {
        ...item,
        index,
        baseScale: 1.0,
        floatSeed: Math.random() * 10
      };

      // Double-Sided Photo Plaque Materials (Zero Blank Squares at ANY Angle)
      const frontMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide
      });
      const backMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide
      });

      if (item.isClimaxLetter) {
        const letterTex = this.createLetterCoverTexture();
        frontMat.map = letterTex;
        frontMat.needsUpdate = true;
        backMat.map = letterTex;
        backMat.needsUpdate = true;
        this.climaxCardMesh = frameGroup;
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.encoding = THREE.sRGBEncoding;
          tex.needsUpdate = true;
          frontMat.map = tex;
          frontMat.needsUpdate = true;
          backMat.map = tex;
          backMat.needsUpdate = true;
        };
        img.onerror = () => {
          const fallbackTex = this.createFallbackTexture(item.title);
          frontMat.map = fallbackTex;
          frontMat.needsUpdate = true;
          backMat.map = fallbackTex;
          backMat.needsUpdate = true;
        };
        img.src = item.url;
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
      const edges = new THREE.EdgesGeometry(cardGeo);
      const frameColor = item.isClimaxLetter ? 0xfbbf24 : (item.isVideo ? 0x38bdf8 : 0xf43f5e);
      const lineMat = new THREE.LineBasicMaterial({
        color: frameColor,
        transparent: true,
        opacity: item.isClimaxLetter ? 1.0 : (item.isVideo ? 0.9 : 0.65),
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

    // Trigger Entrance Assembly Animation (flying into 3D heart one by one!)
    this.playEntranceAnimation();
  }

  // -------------------------------------------------------------
  // Entrance Staggered Assembly into 3D Heart ("一个一个相册蹦出来")
  // -------------------------------------------------------------
  playEntranceAnimation() {
    this.currentShape = 'heart';
    const targets = this.calculateTargets('heart');

    this.photoMeshes.forEach((mesh, index) => {
      const target = targets[index % targets.length];
      if (!target) return;

      mesh.userData.targetPos = target.pos.clone();
      mesh.userData.targetRot = target.rot.clone();

      if (typeof gsap !== 'undefined') {
        const delay = (index / this.photoMeshes.length) * 2.2;

        gsap.to(mesh.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 1.2,
          ease: 'back.out(1.4)',
          delay
        });

        gsap.to(mesh.position, {
          x: target.pos.x,
          y: target.pos.y,
          z: target.pos.z,
          duration: 1.6,
          ease: 'power3.out',
          delay
        });

        gsap.to(mesh.rotation, {
          x: target.rot.x,
          y: target.rot.y,
          z: target.rot.z,
          duration: 1.6,
          ease: 'power3.out',
          delay
        });
      } else {
        mesh.position.copy(target.pos);
        mesh.rotation.copy(target.rot);
        mesh.scale.set(1, 1, 1);
      }
    });
  }

  // -------------------------------------------------------------
  // Mathematical Target Geometries for 5 Viral Styles
  // -------------------------------------------------------------
  calculateTargets(shape) {
    const targets = [];
    const count = this.photoMeshes.length;

    if (shape === 'heart') {
      // Style 1: True 3D Volumetric Heart (Three Layers with pronounced normal curvature & deep Z-depth)
      const outerCount = Math.floor(count * 0.48);
      const midCount = Math.floor(count * 0.34);
      const innerCount = count - outerCount - midCount;

      for (let i = 0; i < count; i++) {
        // Special Climax Letter Card (last item) placed right at front bottom apex
        if (i === count - 1) {
          const pos = new THREE.Vector3(0, -90, 240);
          const rot = new THREE.Euler(-0.08, 0, 0);
          targets.push({ pos, rot, isClimax: true });
          continue;
        }

        let t, scale, zOffset, rotX, rotY, rotZ;
        if (i < outerCount) {
          // Layer 1: Front / Outer 3D Contour wrapping into deep space
          t = (i / outerCount) * Math.PI * 2;
          scale = 34;
          // Z ranges from -240 to +220
          zOffset = Math.sin(t) * 160 + Math.cos(t * 2) * 90;
          rotY = (Math.sin(t) > 0 ? -0.48 : 0.48) * Math.min(1.0, Math.abs(Math.sin(t) * 1.4));
          rotX = -Math.cos(t) * 0.35;
          rotZ = Math.sin(t) * 0.12;
        } else if (i < outerCount + midCount) {
          // Layer 2: Mid-Dome Shell
          const idx = i - outerCount;
          t = (idx / midCount) * Math.PI * 2;
          scale = 23;
          zOffset = 70 + Math.sin(t * 2) * 120;
          rotY = (Math.sin(t) > 0 ? -0.32 : 0.32) * Math.abs(Math.sin(t));
          rotX = -Math.cos(t) * 0.25;
          rotZ = Math.sin(t) * 0.08;
        } else {
          // Layer 3: Inner Heart Core
          const idx = i - outerCount - midCount;
          t = (idx / innerCount) * Math.PI * 2;
          scale = 13;
          zOffset = 160 + Math.cos(t * 3) * 60;
          rotY = 0;
          rotX = 0;
          rotZ = 0;
        }

        const x = 16 * Math.pow(Math.sin(t), 3) * scale;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale + 30;
        const z = zOffset;

        const pos = new THREE.Vector3(x, y, z);
        const rot = new THREE.Euler(rotX, rotY, rotZ);

        targets.push({ pos, rot });
      }
    } else if (shape === 'sphere') {
      // Style 2: 3D Rotating Memory Planet (Fibonacci Golden Ratio Distribution)
      const radius = 560;
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        const pos = new THREE.Vector3(x, y, z);
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(0, 0, 0);
        const rot = dummy.rotation.clone();
        rot.y += Math.PI;

        targets.push({ pos, rot });
      }
    } else if (shape === 'helix') {
      // Style 3: 3D Quantum DNA Double Helix Spiral
      const radius = 460;
      const heightStep = 36;
      const startY = -((count * heightStep) / 4);

      for (let i = 0; i < count; i++) {
        const phi = i * 0.44;
        const strand = i % 2 === 0 ? 0 : Math.PI;
        const x = radius * Math.sin(phi + strand);
        const y = startY + (i * heightStep * 0.5);
        const z = radius * Math.cos(phi + strand);

        const pos = new THREE.Vector3(x, y, z);
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(0, y, 0);
        const rot = dummy.rotation.clone();
        rot.y += Math.PI;

        targets.push({ pos, rot });
      }
    } else if (shape === 'carousel') {
      // Style 4: 3D Cinema Carousel / Coverflow (Circular Ring with Outward Face)
      const radius = 660;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const x = radius * Math.sin(theta);
        const y = Math.sin(i * 0.35) * 20; // gentle undulating wave
        const z = radius * Math.cos(theta);

        const pos = new THREE.Vector3(x, y, z);
        // Face outwards towards camera so photos are immediately visible
        const rot = new THREE.Euler(0, theta, 0);

        targets.push({ pos, rot });
      }
    } else if (shape === 'cube') {
      // Style 5: 3D Double-Layer Exploding Cube (Inner Cube + Outer Cube)
      // Inner cube: 6 faces at radius 140
      // Outer cube: 6 faces at radius 280
      // Remaining cards form an ambient orbit ring around the cube
      const innerDist = 135;
      const outerDist = 280;

      const cubeNormals = [
        { pos: new THREE.Vector3(0, 0, 1), rot: new THREE.Euler(0, 0, 0) },            // Front
        { pos: new THREE.Vector3(0, 0, -1), rot: new THREE.Euler(0, Math.PI, 0) },      // Back
        { pos: new THREE.Vector3(1, 0, 0), rot: new THREE.Euler(0, Math.PI / 2, 0) },   // Right
        { pos: new THREE.Vector3(-1, 0, 0), rot: new THREE.Euler(0, -Math.PI / 2, 0) }, // Left
        { pos: new THREE.Vector3(0, 1, 0), rot: new THREE.Euler(-Math.PI / 2, 0, 0) },  // Top
        { pos: new THREE.Vector3(0, -1, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0) }   // Bottom
      ];

      for (let i = 0; i < count; i++) {
        if (i < 6) {
          // Inner Cube (compact rotating core)
          const norm = cubeNormals[i];
          const pos = norm.pos.clone().multiplyScalar(innerDist);
          targets.push({ pos, rot: norm.rot, isCubeFace: 'inner', normal: norm.pos });
        } else if (i < 12) {
          // Outer Cube (faces that explode outward)
          const norm = cubeNormals[i - 6];
          const pos = norm.pos.clone().multiplyScalar(outerDist);
          targets.push({ pos, rot: norm.rot, isCubeFace: 'outer', normal: norm.pos });
        } else {
          // Orbit Ring of surrounding memories
          const ringIdx = i - 12;
          const ringTotal = count - 12;
          const theta = (ringIdx / ringTotal) * Math.PI * 2;
          const r = 580 + Math.sin(ringIdx * 0.5) * 60;
          const x = r * Math.sin(theta);
          const y = (Math.sin(theta * 3) * 120);
          const z = r * Math.cos(theta);

          const pos = new THREE.Vector3(x, y, z);
          const rot = new THREE.Euler(0, theta + Math.PI, Math.sin(theta) * 0.2);
          targets.push({ pos, rot, isCubeFace: 'orbit' });
        }
      }
    }

    return targets;
  }

  applyLayout(shape, instant = false) {
    this.currentShape = shape;

    // Toggle ground mirror visibility (only in carousel)
    if (this.groundMirror) {
      this.groundMirror.visible = (shape === 'carousel');
    }

    // Adjust camera & OrbitControls polar angle constraints per shape
    if (this.controls) {
      if (shape === 'carousel') {
        // Near-horizon tilt constraint for silky horizontal carousel spin (fixes "鼠标不好控制")
        this.controls.minPolarAngle = Math.PI * 0.35; // ~63 deg
        this.controls.maxPolarAngle = Math.PI * 0.58; // ~104 deg
        this.controls.target.set(0, 0, 0);
      } else if (shape === 'cube') {
        this.controls.minPolarAngle = Math.PI * 0.20;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.target.set(0, 20, 0);
      } else if (shape === 'heart') {
        this.controls.minPolarAngle = Math.PI * 0.18;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.target.set(0, 30, 0);
      } else {
        this.controls.minPolarAngle = Math.PI * 0.18;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.target.set(0, 25, 0);
      }
    }

    if (typeof gsap !== 'undefined') {
      if (shape === 'cube') {
        gsap.to(this.camera.position, { x: 0, y: 40, z: 820, duration: 0.9, ease: 'power2.out' });
      } else if (shape === 'carousel') {
        gsap.to(this.camera.position, { x: 0, y: 50, z: 980, duration: 0.9, ease: 'power2.out' });
      } else if (shape === 'heart') {
        gsap.to(this.camera.position, { x: 160, y: 95, z: 1080, duration: 0.9, ease: 'power2.out' });
      } else {
        gsap.to(this.camera.position, { x: 0, y: this.defaultCamY, z: this.defaultCamZ, duration: 0.9, ease: 'power2.out' });
      }
    }

    const targets = this.calculateTargets(shape);

    this.photoMeshes.forEach((mesh, index) => {
      const target = targets[index % targets.length];
      if (!target) return;

      mesh.userData.targetPos = target.pos.clone();
      mesh.userData.targetRot = target.rot.clone();
      mesh.userData.isCubeFace = target.isCubeFace;
      mesh.userData.cubeNormal = target.normal;

      if (instant || typeof gsap === 'undefined') {
        mesh.position.copy(target.pos);
        mesh.rotation.copy(target.rot);
      } else {
        // High-responsiveness: starts within 12ms, finishes in 0.85s
        const staggerDelay = (index % 8) * 0.012;
        gsap.to(mesh.position, {
          x: target.pos.x,
          y: target.pos.y,
          z: target.pos.z,
          duration: 0.85,
          ease: 'power3.out',
          delay: staggerDelay
        });
        gsap.to(mesh.rotation, {
          x: target.rot.x,
          y: target.rot.y,
          z: target.rot.z,
          duration: 0.85,
          ease: 'power3.out',
          delay: staggerDelay
        });
      }
    });
  }

  // -------------------------------------------------------------
  // Exploding Cube Physics (Hover / Touch triggers outer expansion)
  // -------------------------------------------------------------
  triggerCubeExplosion(explode) {
    if (this.currentShape !== 'cube' || this.isCubeExploded === explode) return;
    this.isCubeExploded = explode;

    const explodeDistance = explode ? 180 : 0;

    this.photoMeshes.forEach(mesh => {
      if (mesh.userData.isCubeFace === 'outer' && mesh.userData.cubeNormal && mesh.userData.targetPos) {
        const offset = mesh.userData.cubeNormal.clone().multiplyScalar(explodeDistance);
        const finalPos = mesh.userData.targetPos.clone().add(offset);

        if (typeof gsap !== 'undefined') {
          gsap.to(mesh.position, {
            x: finalPos.x,
            y: finalPos.y,
            z: finalPos.z,
            duration: 0.8,
            ease: explode ? 'back.out(1.8)' : 'power3.inOut'
          });
        }
      }
    });

    if (explode && typeof confetti === 'function') {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#f43f5e', '#fda4af', '#f472b6']
      });
    }
  }

  // -------------------------------------------------------------
  // Interactive Event Listeners & Hybrid Control
  // -------------------------------------------------------------
  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    const dom = this.renderer.domElement;

    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.mouseParallax.targetX = this.mouse.x * 0.14;
      this.mouseParallax.targetY = this.mouse.y * 0.10;

      this.checkRaycastHover();

      // Trigger cube explosion if hovering over cube center
      if (this.currentShape === 'cube') {
        const distFromCenter = Math.hypot(this.mouse.x, this.mouse.y);
        this.triggerCubeExplosion(distFromCenter < 0.45);
      }
    });

    dom.addEventListener('pointerdown', () => {
      this.isDragging = false;
      if (this.controls) this.controls.autoRotate = false;
      clearTimeout(this.idleResumeTimer);
    });

    dom.addEventListener('pointermove', () => {
      this.isDragging = true;
    });

    dom.addEventListener('pointerup', (e) => {
      clearTimeout(this.idleResumeTimer);
      this.idleResumeTimer = setTimeout(() => {
        if (this.controls) this.controls.autoRotate = true;
      }, 6000);

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
        if (typeof gsap !== 'undefined') {
          gsap.to(this.hoveredMesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.4 });
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
        if (typeof gsap !== 'undefined') {
          gsap.to(this.hoveredMesh.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 0.4, ease: 'back.out(1.5)' });
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
    if (this.audioAnalyser && this.audioData) {
      this.audioAnalyser.getByteFrequencyData(this.audioData);
      let sumBass = 0;
      for (let i = 1; i <= 6; i++) sumBass += this.audioData[i];
      bass = (sumBass / 6) / 255;
    } else {
      bass = Math.max(0, Math.sin(elapsed * 2.5)) * 0.35;
    }

    // 2. Central Holographic Cyber Heart Dynamic Animation
    if (this.hologramGroup) {
      if (this.gyroRing1) this.gyroRing1.rotation.z += 0.012;
      if (this.gyroRing2) this.gyroRing2.rotation.x += 0.015;

      const heartScale = 1.0 + bass * 0.35;
      if (this.hologramHeart) {
        this.hologramHeart.scale.set(heartScale, heartScale, heartScale);
      }

      this.soundwaveRings.forEach(wave => {
        wave.userData.progress += wave.userData.speed + bass * 0.02;
        if (wave.userData.progress > 1.0) wave.userData.progress = 0;
        const currentScale = 1.0 + wave.userData.progress * 4.5;
        wave.scale.set(currentScale, currentScale, 1);
        wave.material.opacity = Math.max(0, (1.0 - wave.userData.progress) * 0.45);
        wave.rotation.z += 0.005;
      });
    }

    // 3. Autonomous Procedural Floating Motion
    this.photoMeshes.forEach(mesh => {
      if (mesh !== this.hoveredMesh && mesh.userData.targetPos) {
        const seed = mesh.userData.floatSeed || 0;
        mesh.position.y = mesh.userData.targetPos.y + Math.sin(elapsed * 1.8 + seed) * 4.5;
        mesh.position.x = mesh.userData.targetPos.x + Math.cos(elapsed * 1.2 + seed) * 3.0;
        mesh.rotation.z = mesh.userData.targetRot.z + Math.sin(elapsed * 1.5 + seed) * 0.02;
      }
    });

    // 4. Stardust Galaxy Rotation & Pulse
    if (this.starField) {
      this.starField.rotation.y += 0.0004;
      this.starField.rotation.x += 0.00015;
      this.starField.material.size = 22 + bass * 12;
    }

    // 5. Parallax Scene Micro-Tilt
    this.mouseParallax.x += (this.mouseParallax.targetX - this.mouseParallax.x) * 0.05;
    this.mouseParallax.y += (this.mouseParallax.targetY - this.mouseParallax.y) * 0.05;
    this.scene.rotation.y = this.mouseParallax.x * 0.5;
    this.scene.rotation.x = this.mouseParallax.y * 0.5;

    // 6. Camera gentle Orbit Update
    if (this.controls && this.controls.autoRotate) {
      this.controls.update();
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
