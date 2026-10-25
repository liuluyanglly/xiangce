/**
 * EternalEcho - 3D Quantum Neon Crystal Heart (Finale Climax Engine)
 * Renders an ultra-cool, futuristic 3D holographic pulsing crystal heart
 * with orbital gyroscopic rings and iridescent particle shockwaves.
 */

class QuantumNeonHeart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.heartGroup = null;
    this.orbitalRings = [];
    this.haloParticles = null;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const rect = this.canvas.getBoundingClientRect();
    const width = this.canvas.clientWidth || 400;
    const height = this.canvas.clientHeight || 400;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 130);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 3. Heart Group Container
    this.heartGroup = new THREE.Group();
    this.scene.add(this.heartGroup);

    // 4. Build 3D Parametric Heart Mesh
    this.buildHeartGeometry();

    // 5. Build Gyroscopic Orbital Rings
    this.buildOrbitalRings();

    // 6. Build Stardust Halo
    this.buildHaloParticles();

    // 7. Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(amb);

    const pointLight = new THREE.PointLight(0xf43f5e, 3, 200);
    pointLight.position.set(0, 0, 30);
    this.scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2, 200);
    cyanLight.position.set(40, -30, -30);
    this.scene.add(cyanLight);

    // 8. Interactive Click Trigger
    this.canvas.addEventListener('pointerdown', () => this.pulseShockwave());

    this.animate();
  }

  buildHeartGeometry() {
    // 3D Mathematical Parametric Heart Mesh
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 25, y + 25);
    heartShape.bezierCurveTo(x + 25, y + 25, x + 20, y, x, y);
    heartShape.bezierCurveTo(x - 30, y, x - 30, y + 35, x - 30, y + 35);
    heartShape.bezierCurveTo(x - 30, y + 55, x - 10, y + 77, x + 25, y + 95);
    heartShape.bezierCurveTo(x + 60, y + 77, x + 80, y + 55, x + 80, y + 35);
    heartShape.bezierCurveTo(x + 80, y + 35, x + 80, y, x + 50, y);
    heartShape.bezierCurveTo(x + 35, y, x + 25, y + 25, x + 25, y + 25);

    const extrudeSettings = {
      depth: 18,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 3,
      bevelSize: 6,
      bevelThickness: 6
    };

    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geometry.center();

    // Holographic Crystal Material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0x881337,
      emissiveIntensity: 0.45,
      roughness: 0.1,
      metalness: 0.15,
      transmission: 0.65, // Glass crystal translucency
      ior: 1.5,
      thickness: 15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    this.heartMesh = new THREE.Mesh(geometry, material);
    this.heartMesh.rotation.z = Math.PI; // Flip upright
    this.heartMesh.scale.set(0.38, 0.38, 0.38);
    this.heartGroup.add(this.heartMesh);

    // Glowing Wireframe Outer Cage
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    this.wireMesh = new THREE.Mesh(geometry, wireMat);
    this.wireMesh.rotation.z = Math.PI;
    this.wireMesh.scale.set(0.395, 0.395, 0.395);
    this.heartGroup.add(this.wireMesh);
  }

  buildOrbitalRings() {
    const ringColors = [0xf43f5e, 0x8b5cf6, 0x06b6d4];
    for (let i = 0; i < 3; i++) {
      const radius = 34 + i * 5;
      const ringGeo = new THREE.TorusGeometry(radius, 0.45, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = (i * Math.PI) / 3;
      ringMesh.rotation.y = (i * Math.PI) / 4;
      this.scene.add(ringMesh);
      this.orbitalRings.push({ mesh: ringMesh, speedX: 0.012 + i * 0.005, speedY: 0.015 - i * 0.004 });
    }
  }

  buildHaloParticles() {
    const particleCount = 280;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 38 + Math.random() * 25;

      pos[i] = r * Math.sin(phi) * Math.cos(theta);
      pos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i + 2] = r * Math.cos(phi);

      colors[i] = 0.95;
      colors[i + 1] = Math.random() * 0.6;
      colors[i + 2] = 0.7 + Math.random() * 0.3;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.haloParticles = new THREE.Points(geo, mat);
    this.scene.add(this.haloParticles);
  }

  pulseShockwave() {
    if (typeof gsap !== 'undefined') {
      // Fast romantic heartbeat spasm
      gsap.timeline()
        .to(this.heartGroup.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.12, ease: 'power2.out' })
        .to(this.heartGroup.scale, { x: 0.95, y: 0.95, z: 0.95, duration: 0.15 })
        .to(this.heartGroup.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.12 })
        .to(this.heartGroup.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'elastic.out(1, 0.3)' });

      // Trigger global celebratory fireworks
      if (window.eternalApp) {
        window.eternalApp.celebrateHeart();
      }
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const t = this.clock.getElapsedTime();

    // Real-time Heartbeat Rhythm (Lub-Dub rhythm: sin with harmonics)
    const beat = 1 + Math.pow(Math.sin(t * 3.2), 63) * 0.14 + Math.pow(Math.sin(t * 3.2 - 0.3), 63) * 0.08;
    this.heartGroup.scale.set(beat, beat, beat);

    // Gentle 3D floating rotation
    this.heartGroup.rotation.y = Math.sin(t * 0.8) * 0.35;
    this.heartGroup.rotation.x = Math.cos(t * 0.6) * 0.15;

    // Orbital Gyroscopic Rings rotation
    this.orbitalRings.forEach(item => {
      item.mesh.rotation.x += item.speedX;
      item.mesh.rotation.y += item.speedY;
    });

    // Halo particles drift
    if (this.haloParticles) {
      this.haloParticles.rotation.y -= 0.003;
      this.haloParticles.rotation.z += 0.001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }
}

window.QuantumNeonHeart = QuantumNeonHeart;
