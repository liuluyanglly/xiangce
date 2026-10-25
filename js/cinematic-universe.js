/**
 * EternalEcho - Cinematic 3D Spatial Universe Engine
 * Transforms the album into an Awwwards-tier 3D Time-Warp Galaxy:
 * - 3D Logarithmic Memory Vortex / Spiral Cosmos
 * - Central Pulsing Quantum Holographic Crystal Heart
 * - Cinematic Warp-Speed Camera Transitions across Months (2022 -> 2024)
 * - Gyroscope Spatial Parallax for Mobile / iPad
 * - Auto-Tour Cinematic Movie Mode
 */

class CinematicUniverse {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      onSelectPhoto: null,
      onMonthChange: null
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.photos = [];
    this.photoMeshes = [];
    this.monthAnchors = {};
    this.currentMonth = 'all';

    // Cinematic Camera State
    this.camTargetPos = new THREE.Vector3(0, 0, 180);
    this.camTargetLook = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.isWarping = false;
    this.isAutoTouring = false;
    this.autoTourTimer = null;
    this.autoTourIndex = 0;

    // Mouse & Gyro parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.gyro = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();

    // Visual Elements
    this.crystalHeart = null;
    this.orbitalRings = [];
    this.shockwaveRings = [];
    this.warpParticles = null;
    this.stardustHearts = null;
    this.monthBadges = [];
    this.camLight = null;

    // Free flight scroll / drag state
    this.targetZ = 180;
    this.isFreeFlying = false;
    this.lastSparkleTime = 0;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Deep Space Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020204);
    this.scene.fog = new THREE.FogExp2(0x020204, 0.0016);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
    this.camera.position.set(0, 0, 180);

    // Dynamic Camera Headlight (warms up photos as camera approaches)
    this.camLight = new THREE.PointLight(0xffeedd, 2.2, 120);
    this.camera.add(this.camLight);
    this.scene.add(this.camera);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // 4. Romantic Lighting Matrix
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    this.mainLight = new THREE.PointLight(0xf43f5e, 3.8, 500);
    this.mainLight.position.set(0, 0, 20);
    this.scene.add(this.mainLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2.2, 420);
    cyanLight.position.set(-80, 50, -50);
    this.scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.8, 520);
    purpleLight.position.set(80, -60, -120);
    this.scene.add(purpleLight);

    // 5. Build Core Visuals
    this.buildCrystalHeart();
    this.buildCosmicHeartStardust();
    this.buildHyperspaceWarpLines();

    // 6. Bind User Controls
    this.bindEvents();
    this.animate();
  }

  // -------------------------------------------------------------
  // Central Giant 3D Holographic Crystal Heart
  // -------------------------------------------------------------
  buildCrystalHeart() {
    this.heartGroup = new THREE.Group();
    this.heartGroup.position.set(0, 0, -320); // Anchored at the finale climax!

    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo(x + 25, y + 25);
    shape.bezierCurveTo(x + 25, y + 25, x + 20, y, x, y);
    shape.bezierCurveTo(x - 30, y, x - 30, y + 35, x - 30, y + 35);
    shape.bezierCurveTo(x - 30, y + 55, x - 10, y + 77, x + 25, y + 95);
    shape.bezierCurveTo(x + 60, y + 77, x + 80, y + 55, x + 80, y + 35);
    shape.bezierCurveTo(x + 80, y + 35, x + 80, y, x + 50, y);
    shape.bezierCurveTo(x + 35, y, x + 25, y + 25, x + 25, y + 25);

    const extrudeSettings = {
      depth: 22,
      bevelEnabled: true,
      bevelSegments: 10,
      steps: 4,
      bevelSize: 7,
      bevelThickness: 7
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Glass Refraction Crystal Material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0x9f1239,
      emissiveIntensity: 0.5,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.75,
      thickness: 20,
      ior: 1.55,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = Math.PI;
    mesh.scale.set(0.65, 0.65, 0.65);
    this.heartGroup.add(mesh);

    // Glowing Golden Wireframe Cage
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    wireMesh.rotation.z = Math.PI;
    wireMesh.scale.set(0.67, 0.67, 0.67);
    this.heartGroup.add(wireMesh);

    // 3 Gyroscopic Orbiting Rings
    const ringColors = [0xf43f5e, 0xa855f7, 0x38bdf8];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(52 + i * 8, 0.6, 16, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = (i * Math.PI) / 3;
      ringMesh.rotation.y = (i * Math.PI) / 4;
      this.heartGroup.add(ringMesh);
      this.orbitalRings.push({ mesh: ringMesh, rx: 0.012 + i * 0.005, ry: 0.015 - i * 0.004 });
    }

    // Expanding Heartbeat Shockwave Rings
    for (let i = 0; i < 2; i++) {
      const shockGeo = new THREE.TorusGeometry(36, 0.45, 8, 80);
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      const shockMesh = new THREE.Mesh(shockGeo, shockMat);
      shockMesh.rotation.x = Math.PI / 2;
      this.heartGroup.add(shockMesh);
      this.shockwaveRings.push({ mesh: shockMesh, offset: i * 0.5 });
    }

    this.scene.add(this.heartGroup);
    this.crystalHeart = this.heartGroup;
  }

  // -------------------------------------------------------------
  // 3D Glass Milestone Portal Badge Generator
  // -------------------------------------------------------------
  createMonthBadgeMesh(monthKey, title, count) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Rounded Glass Plate background with luxury gradient
    const r = 24;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(512 - r, 0);
    ctx.quadraticCurveTo(512, 0, 512, r);
    ctx.lineTo(512, 256 - r);
    ctx.quadraticCurveTo(512, 256, 512 - r, 256);
    ctx.lineTo(r, 256);
    ctx.quadraticCurveTo(0, 256, 0, 256 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();

    // Dark ethereal glass background
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 256);
    bgGrad.addColorStop(0, 'rgba(28, 14, 28, 0.90)');
    bgGrad.addColorStop(0.5, 'rgba(12, 10, 18, 0.94)');
    bgGrad.addColorStop(1, 'rgba(18, 12, 30, 0.90)');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Luxury neon glowing border
    ctx.lineWidth = 4;
    const strokeGrad = ctx.createLinearGradient(0, 0, 512, 256);
    strokeGrad.addColorStop(0, 'rgba(244, 63, 94, 0.85)');
    strokeGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.85)');
    strokeGrad.addColorStop(1, 'rgba(168, 85, 247, 0.85)');
    ctx.strokeStyle = strokeGrad;
    ctx.stroke();

    // Category / Tag header
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('♥ MEMORY CHAPTER', 40, 52);

    // Primary Year & Month Big Typography
    const formattedMonth = monthKey.replace('-', ' · ');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(formattedMonth, 40, 126);

    // Subtitle / Sentiment and photo counter
    ctx.fillStyle = '#fda4af';
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const subText = `${title || '心动印记'} · ${count} 帧美好`;
    ctx.fillText(subText, 40, 186);

    // Glowing heart badge in top right
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('♥', 430, 65);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;

    const badgeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });

    const isMobile = window.innerWidth < 768;
    const badgeW = isMobile ? 18 : 22;
    const badgeH = isMobile ? 9 : 11;
    const badgeGeo = new THREE.PlaneGeometry(badgeW, badgeH);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);

    return badgeMesh;
  }

  // -------------------------------------------------------------
  // Heart-Shaped Stardust Texture
  // -------------------------------------------------------------
  createHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
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

  buildCosmicHeartStardust() {
    const count = 1800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 800;
      positions[i + 1] = (Math.random() - 0.5) * 600;
      positions[i + 2] = (Math.random() - 0.5) * 1200;

      const isWarm = Math.random() > 0.35;
      colors[i] = isWarm ? 0.98 : 0.65;
      colors[i + 1] = isWarm ? 0.35 : 0.55;
      colors[i + 2] = isWarm ? 0.65 : 0.98;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 14,
      map: this.createHeartTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stardustHearts = new THREE.Points(geo, mat);
    this.scene.add(this.stardustHearts);
  }

  // Hyperspace warp lines when flying fast
  buildHyperspaceWarpLines() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 6); // line segments

    for (let i = 0; i < count * 6; i += 6) {
      const x = (Math.random() - 0.5) * 350;
      const y = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 800;
      pos[i] = x;
      pos[i + 1] = y;
      pos[i + 2] = z;
      pos[i + 3] = x;
      pos[i + 4] = y;
      pos[i + 5] = z + 40; // streak length
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.0, // starts invisible, fades in during warp
      blending: THREE.AdditiveBlending
    });

    this.warpLines = new THREE.LineSegments(geo, mat);
    this.scene.add(this.warpLines);
  }

  // -------------------------------------------------------------
  // Load Photos into 3D Memory Vortex / Timeline Spiral
  // -------------------------------------------------------------
  loadPhotos(photos) {
    this.photos = photos;

    // Dispose old meshes
    this.photoMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
      }
    });
    this.photoMeshes = [];
    this.monthAnchors = {};

    // Dispose old month milestone badges
    this.monthBadges.forEach(badge => {
      this.scene.remove(badge);
      if (badge.geometry) badge.geometry.dispose();
      if (badge.material) badge.material.dispose();
    });
    this.monthBadges = [];

    const isMobile = window.innerWidth < 768;
    const cardW = isMobile ? 22 : 18;
    const cardH = isMobile ? 30 : 24;
    const cardGeo = new THREE.PlaneGeometry(cardW, cardH);
    const loader = new THREE.TextureLoader();

    // Count photos per month
    const monthCounts = {};
    photos.forEach(p => {
      monthCounts[p.month] = (monthCounts[p.month] || 0) + 1;
    });

    // Logarithmic Timeline Vortex parameters
    const total = photos.length;
    const zSpan = 520; // depth along tunnel
    const startZ = 120; // closest to initial camera
    const spiralRadius = isMobile ? 32 : 46;

    photos.forEach((item, index) => {
      const group = new THREE.Group();

      // Parametric Spiral placement along Z-axis
      const progress = index / total; // 0 to 1
      const theta = progress * Math.PI * 12 + (index % 3) * 0.4;
      const r = spiralRadius + Math.sin(progress * Math.PI * 4) * 8;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = startZ - progress * zSpan;

      group.position.set(x, y, z);
      // Gentle tilt facing camera path
      group.lookAt(0, 0, z + 60);
      group.userData = { ...item, index };

      // Textured Mesh
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.15,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      loader.load(item.url, (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        mat.map = tex;
        mat.needsUpdate = true;
      });

      const photoMesh = new THREE.Mesh(cardGeo, mat);
      group.add(photoMesh);

      // Glowing Double-Bezel Frame
      const edges = new THREE.EdgesGeometry(cardGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.65
      });
      const borderLine = new THREE.LineSegments(edges, lineMat);
      borderLine.position.z = 0.2;
      group.add(borderLine);

      // Back Plate
      const backGeo = new THREE.PlaneGeometry(cardW, cardH);
      const backMat = new THREE.MeshBasicMaterial({ color: 0x07070b, side: THREE.BackSide });
      const backMesh = new THREE.Mesh(backGeo, backMat);
      group.add(backMesh);

      this.scene.add(group);
      this.photoMeshes.push(group);

      // Register first photo of each month as anchor point & spawn 3D Milestone Gate
      if (!this.monthAnchors[item.month]) {
        this.monthAnchors[item.month] = {
          position: group.position.clone(),
          index: index,
          title: item.title,
          desc: item.desc,
          count: monthCounts[item.month] || 1
        };

        // Create 3D Floating Glass Milestone Portal Badge
        const badge = this.createMonthBadgeMesh(item.month, item.title, monthCounts[item.month] || 1);
        const badgeOffset = new THREE.Vector3(x > 0 ? -12 : 12, 12, z + 6);
        badge.position.copy(badgeOffset);
        badge.lookAt(0, 0, z + 60);
        this.scene.add(badge);
        this.monthBadges.push(badge);
      }
    });

    // Default view: in front of the vortex
    this.warpToMonth('all', true);
  }

  // -------------------------------------------------------------
  // Warp-Drive Camera Flight to Specific Month / Landmark
  // -------------------------------------------------------------
  warpToMonth(month, instant = false) {
    this.currentMonth = month;
    let targetCam = new THREE.Vector3(0, 0, 180);
    let targetLook = new THREE.Vector3(0, 0, 80);

    if (month === 'all') {
      targetCam.set(0, 0, 175);
      targetLook.set(0, 0, 0);
    } else if (month === 'climax') {
      // Fly right up to the 3D Quantum Crystal Heart!
      targetCam.set(0, 0, -260);
      targetLook.set(0, 0, -320);
    } else if (this.monthAnchors[month]) {
      const anchor = this.monthAnchors[month];
      // Position camera right in front of that month's first photo
      targetCam.copy(anchor.position).add(new THREE.Vector3(0, 0, 28));
      targetLook.copy(anchor.position);
    }

    if (instant || typeof gsap === 'undefined') {
      this.camera.position.copy(targetCam);
      this.currentLookAt.copy(targetLook);
      this.camera.lookAt(targetLook);
      return;
    }

    // Warp FX: streaking warp lines burst & FOV dynamic elasticity
    this.isWarping = true;
    if (this.warpLines) {
      gsap.to(this.warpLines.material, { opacity: 0.85, duration: 0.3, yoyo: true, repeat: 1 });
    }

    // Dynamic FOV Hyper-speed expansion and smooth recovery
    gsap.to(this.camera, {
      fov: 70,
      duration: 0.6,
      ease: 'power2.in',
      onUpdate: () => this.camera.updateProjectionMatrix(),
      onComplete: () => {
        gsap.to(this.camera, {
          fov: 50,
          duration: 1.1,
          ease: 'power2.out',
          onUpdate: () => this.camera.updateProjectionMatrix()
        });
      }
    });

    // Camera Flight with Cinematic Cubic Spring
    gsap.to(this.camera.position, {
      x: targetCam.x,
      y: targetCam.y,
      z: targetCam.z,
      duration: 1.8,
      ease: 'power3.inOut'
    });

    gsap.to(this.currentLookAt, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.currentLookAt);
      },
      onComplete: () => {
        this.isWarping = false;
        if (typeof this.options.onMonthChange === 'function') {
          this.options.onMonthChange(month);
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Free Flight Scroll / Swipe along Time-Warp Tunnel
  // -------------------------------------------------------------
  scrollFlight(delta) {
    if (this.isWarping || this.isAutoTouring) return;
    this.targetZ = THREE.MathUtils.clamp(this.camera.position.z - delta, -270, 185);

    gsap.to(this.camera.position, {
      z: this.targetZ,
      duration: 0.6,
      ease: 'power1.out',
      onUpdate: () => {
        this.updateActiveMonthFromZ();
      }
    });
  }

  updateActiveMonthFromZ() {
    const curZ = this.camera.position.z;
    if (curZ <= -250) {
      this.syncTimelineDock('climax');
      return;
    }

    let closestMonth = 'all';
    let minDiff = 9999;

    Object.keys(this.monthAnchors).forEach(m => {
      const anchorZ = this.monthAnchors[m].position.z;
      const diff = Math.abs(curZ - (anchorZ + 28));
      if (diff < minDiff) {
        minDiff = diff;
        closestMonth = m;
      }
    });

    if (minDiff > 60 && curZ > 140) {
      closestMonth = 'all';
    }

    this.syncTimelineDock(closestMonth);
  }

  syncTimelineDock(monthKey) {
    document.querySelectorAll('.universe-month-pill').forEach(pill => {
      const match = pill.dataset.month === monthKey;
      pill.classList.toggle('active', match);
      if (match) {
        pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  // -------------------------------------------------------------
  // Sparkle Hearts Trail for Mouse & Finger Touch
  // -------------------------------------------------------------
  spawnSparkleHeart(x, y) {
    const now = Date.now();
    if (now - this.lastSparkleTime < 45) return;
    this.lastSparkleTime = now;

    const heart = document.createElement('div');
    heart.textContent = '♥';
    const size = Math.random() * 12 + 12;
    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#fbbf24', '#c084fc'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rot = (Math.random() - 0.5) * 60;
    const dx = (Math.random() - 0.5) * 40;
    const dy = -(Math.random() * 45 + 35);

    heart.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: ${size}px;
      color: ${color};
      pointer-events: none;
      z-index: 9999;
      opacity: 0.95;
      transform: translate(-50%, -50%) rotate(${rot}deg) scale(0.8);
      transition: transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.75s ease;
      text-shadow: 0 0 12px ${color};
      user-select: none;
    `;
    document.body.appendChild(heart);

    requestAnimationFrame(() => {
      heart.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.35) rotate(${rot * 1.6}deg)`;
      heart.style.opacity = '0';
    });
    setTimeout(() => heart.remove(), 800);
  }

  // -------------------------------------------------------------
  // Cinematic Auto-Tour Mode (Plays like a romantic movie)
  // -------------------------------------------------------------
  toggleAutoTour() {
    this.isAutoTouring = !this.isAutoTouring;
    const tourBtn = document.getElementById('autoTourBtn');

    if (this.isAutoTouring) {
      if (tourBtn) {
        tourBtn.classList.add('bg-rose-500/40', 'border-rose-400', 'text-white');
        tourBtn.innerHTML = `<span>⏸</span> <span>停止漫游</span>`;
      }
      this.autoTourStep();
    } else {
      if (tourBtn) {
        tourBtn.classList.remove('bg-rose-500/40', 'border-rose-400', 'text-white');
        tourBtn.innerHTML = `<span>🎬</span> <span>电影级漫游</span>`;
      }
      if (this.autoTourTimer) clearTimeout(this.autoTourTimer);
    }
  }

  autoTourStep() {
    if (!this.isAutoTouring) return;

    const monthKeys = Object.keys(this.monthAnchors);
    if (this.autoTourIndex >= monthKeys.length) {
      // Arrive at Finale Crystal Heart!
      this.warpToMonth('climax');
      this.autoTourTimer = setTimeout(() => {
        this.autoTourIndex = 0;
        this.autoTourStep();
      }, 6000);
      return;
    }

    const currentM = monthKeys[this.autoTourIndex];
    this.warpToMonth(currentM);

    // Sync UI pill
    document.querySelectorAll('.universe-month-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.month === currentM);
    });

    this.autoTourIndex++;
    this.autoTourTimer = setTimeout(() => {
      this.autoTourStep();
    }, 4200);
  }

  // -------------------------------------------------------------
  // Events: Parallax Gyroscope & Touch/Mouse Drag
  // -------------------------------------------------------------
  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // Mouse Parallax & Sparkle Hearts
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      this.spawnSparkleHeart(e.clientX, e.clientY);
    });

    // Mobile / iPad Gyroscope Parallax
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          this.gyro.x = (e.gamma / 45); // Left/Right tilt
          this.gyro.y = ((e.beta - 45) / 45); // Up/Down tilt
        }
      }, { passive: true });
    }

    // Wheel flight along time tunnel
    window.addEventListener('wheel', (e) => {
      const artModal = document.getElementById('artworkModal');
      const climaxModal = document.getElementById('climaxLetterModal');
      if (artModal && artModal.classList.contains('active')) return;
      if (climaxModal && climaxModal.classList.contains('opacity-100')) return;
      this.scrollFlight(e.deltaY * 0.16);
    }, { passive: true });

    // Touch / Click on 3D Photos & Drag Flight
    let isDragging = false;
    let startX = 0, startY = 0;
    let touchLastY = 0;

    this.renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchLastY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.renderer.domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const deltaY = e.touches[0].clientY - touchLastY;
        touchLastY = e.touches[0].clientY;
        this.scrollFlight(-deltaY * 0.45);
        this.spawnSparkleHeart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
    });

    this.renderer.domElement.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) {
        isDragging = true;
      }
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      if (isDragging) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      this.raycaster.setFromCamera(pointer, this.camera);

      // Check click on crystal heart
      if (this.crystalHeart) {
        const heartHits = this.raycaster.intersectObjects(this.crystalHeart.children, true);
        if (heartHits.length > 0) {
          if (window.eternalApp) window.eternalApp.celebrateHeart();
          return;
        }
      }

      // Check click on photos
      const hits = this.raycaster.intersectObjects(this.scene.children, true);
      if (hits.length > 0) {
        let node = hits[0].object;
        while (node && !node.userData.url && node.parent && node.parent !== this.scene) {
          node = node.parent;
        }
        if (node && node.userData && node.userData.url) {
          if (typeof this.options.onSelectPhoto === 'function') {
            this.options.onSelectPhoto(node.userData);
          }
        }
      }
    });
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    // Smooth Parallax Interpolation (Lerp)
    this.mouse.x += (this.mouse.targetX + this.gyro.x * 0.8 - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY + this.gyro.y * 0.8 - this.mouse.y) * 0.05;

    // Apply gentle camera sway
    if (!this.isWarping) {
      this.camera.position.x += (this.mouse.x * 8 - this.camera.position.x) * 0.03;
      this.camera.position.y += (-this.mouse.y * 6 - this.camera.position.y) * 0.03;
    }

    // 3D Crystal Heart Beat & Shockwaves
    if (this.crystalHeart) {
      const beat = 1 + Math.pow(Math.sin(t * 3.2), 63) * 0.12 + Math.pow(Math.sin(t * 3.2 - 0.3), 63) * 0.07;
      this.crystalHeart.scale.set(beat, beat, beat);
      this.crystalHeart.rotation.y = Math.sin(t * 0.6) * 0.25;

      this.orbitalRings.forEach(ring => {
        ring.mesh.rotation.x += ring.rx;
        ring.mesh.rotation.y += ring.ry;
      });

      // Expand shockwave ripples
      this.shockwaveRings.forEach(sw => {
        const waveProgress = (t * 0.8 + sw.offset) % 1.0;
        const scale = 0.8 + waveProgress * 2.8;
        sw.mesh.scale.set(scale, scale, scale);
        sw.mesh.material.opacity = Math.max(0, 0.7 * (1.0 - waveProgress));
      });
    }

    // Drift Stardust Hearts
    if (this.stardustHearts) {
      this.stardustHearts.rotation.z += 0.0003;
      this.stardustHearts.rotation.y += 0.0002;
    }

    // Gently float Month Badges
    this.monthBadges.forEach((badge, idx) => {
      badge.position.y += Math.sin(t * 1.8 + idx) * 0.02;
    });

    // Gently float each photo in zero gravity
    this.photoMeshes.forEach((mesh, idx) => {
      const wave = Math.sin(t * 1.5 + idx * 0.3) * 0.003;
      mesh.rotation.z += wave;
    });

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.autoTourTimer) clearTimeout(this.autoTourTimer);
  }
}

window.CinematicUniverse = CinematicUniverse;
