/**
 * EternalEcho - 3D Virtual Art Museum & Private Exhibition Hall
 * Built with Three.js. Supports first-person navigation, spotlight focus,
 * polished reflective marble floor, and multi-touch mobile/iPad controls.
 */

class VirtualArtGallery {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      onSelectArtwork: null
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.artworks = [];
    this.currentArtworkIndex = 0;
    this.animationFrameId = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-10, -10);

    // Camera navigation state
    this.targetCameraPos = new THREE.Vector3(0, 30, 200);
    this.targetLookAt = new THREE.Vector3(0, 30, 0);
    this.currentLookAt = new THREE.Vector3(0, 30, 0);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060609);
    this.scene.fog = new THREE.Fog(0x060609, 80, 550);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.copy(this.targetCameraPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // 4. Ambient & Atmosphere Lights
    const ambient = new THREE.AmbientLight(0xffeedd, 0.45);
    this.scene.add(ambient);

    // Subtle ceiling strip light
    const ceilingLight = new THREE.DirectionalLight(0xfff5ea, 0.5);
    ceilingLight.position.set(0, 100, 0);
    this.scene.add(ceilingLight);

    // 5. Build Architectural Elements
    this.buildMuseumArchitecture();

    // 6. Bind Events
    this.bindEvents();
    this.animate();
  }

  buildMuseumArchitecture() {
    // 1. Polished Reflective Marble Floor
    const floorGeo = new THREE.PlaneGeometry(600, 600);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c12,
      roughness: 0.15,
      metalness: 0.65
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid lines on floor
    const grid = new THREE.GridHelper(600, 40, 0x242436, 0x141420);
    grid.position.y = 0.1;
    this.scene.add(grid);

    // 2. Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(600, 600);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 80;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 3. Floating Golden Love Hearts
    const dustCount = 350;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 350;
      dustPos[i + 1] = Math.random() * 65 + 5;
      dustPos[i + 2] = (Math.random() - 0.5) * 350;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    // Generate Golden Heart Texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    const d = 26;
    ctx.translate(32, 26);
    ctx.moveTo(0, -d * 0.25);
    ctx.bezierCurveTo(-d * 0.55, -d * 0.85, -d, -d * 0.2, 0, d * 0.75);
    ctx.bezierCurveTo(d, -d * 0.2, d * 0.55, -d * 0.85, 0, -d * 0.25);
    ctx.fill();
    const goldenHeartTex = new THREE.CanvasTexture(canvas);

    const dustMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 10,
      map: goldenHeartTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);
  }

  loadArtworks(photos) {
    // Remove old artworks
    this.artworks.forEach(art => {
      this.scene.remove(art.group);
      if (art.spotLight) this.scene.remove(art.spotLight);
    });
    this.artworks = [];

    // Optimize gallery spacing: if total photos > 36, sample evenly so salon walls look spacious
    let displayPhotos = photos;
    if (photos.length > 36) {
      const step = Math.ceil(photos.length / 32);
      displayPhotos = photos.filter((_, idx) => idx % step === 0);
    }

    const loader = new THREE.TextureLoader();
    const frameWidth = 36;
    const frameHeight = 48;
    const frameDepth = 1.6;

    // Gallery wall positions (semi-circle / octagon salon curve)
    const radius = 130;
    const total = displayPhotos.length;
    const angleStep = (Math.PI * 1.5) / Math.max(total - 1, 1);
    const startAngle = -Math.PI * 0.75;

    displayPhotos.forEach((item, index) => {
      const angle = startAngle + index * angleStep;
      const x = radius * Math.sin(angle);
      const z = -radius * Math.cos(angle) + 20;
      const y = 32; // Eye level

      const group = new THREE.Group();
      group.position.set(x, y, z);
      // Face towards center salon
      group.lookAt(0, y, 20);
      group.userData = { ...item, index };

      // Golden Bezel Outer Frame
      const frameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // Champagne gold
        metalness: 0.85,
        roughness: 0.25
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.castShadow = true;
      group.add(frameMesh);

      // Inner Canvas
      const canvasGeo = new THREE.PlaneGeometry(frameWidth - 4, frameHeight - 4);
      const canvasMat = new THREE.MeshStandardMaterial({
        roughness: 0.35,
        metalness: 0.05
      });

      loader.load(item.url, (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        canvasMat.map = tex;
        canvasMat.needsUpdate = true;
      }, undefined, () => {
        canvasMat.color.setHex(0x381824);
      });

      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.z = frameDepth / 2 + 0.05;
      group.add(canvasMesh);

      // Artwork Stand / Pedestal Wall Segment behind
      const wallGeo = new THREE.BoxGeometry(frameWidth + 16, frameHeight + 35, 2);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x12121b, roughness: 0.8 });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(0, -6, -frameDepth / 2 - 1);
      wallMesh.receiveShadow = true;
      group.add(wallMesh);

      // Warm Dedicated Spotlight for each artwork
      const spotLight = new THREE.SpotLight(0xfff2e0, 2.2, 120, Math.PI / 5, 0.45, 1.2);
      spotLight.position.set(x * 0.8, y + 35, z * 0.8);
      spotLight.target = group;
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 512;
      spotLight.shadow.mapSize.height = 512;
      this.scene.add(spotLight);

      this.scene.add(group);
      this.artworks.push({ group, spotLight, data: item, index });
    });

    if (this.artworks.length > 0) {
      this.navigateToArtwork(0, true);
    }
  }

  navigateToArtwork(index, instant = false) {
    if (!this.artworks[index]) return;
    this.currentArtworkIndex = index;
    const art = this.artworks[index];
    const group = art.group;

    // Calculate view position in front of artwork (closer on mobile for large display)
    const isMobile = window.innerWidth < 768;
    const viewDistance = isMobile ? 35 : 52;
    const forward = new THREE.Vector3(0, 0, viewDistance);
    forward.applyEuler(group.rotation);
    const targetPos = group.position.clone().add(forward);
    targetPos.y = group.position.y; // Eye level

    const targetLook = group.position.clone();

    if (instant || typeof gsap === 'undefined') {
      this.camera.position.copy(targetPos);
      this.camera.lookAt(targetLook);
      this.currentLookAt.copy(targetLook);
    } else {
      gsap.to(this.camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.6,
        ease: 'power3.inOut'
      });
      gsap.to(this.currentLookAt, {
        x: targetLook.x,
        y: targetLook.y,
        z: targetLook.z,
        duration: 1.6,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.camera.lookAt(this.currentLookAt);
        }
      });
    }

    if (typeof this.options.onSelectArtwork === 'function') {
      this.options.onSelectArtwork(art.data, index);
    }
  }

  nextArtwork() {
    const nextIdx = (this.currentArtworkIndex + 1) % this.artworks.length;
    this.navigateToArtwork(nextIdx);
  }

  prevArtwork() {
    const prevIdx = (this.currentArtworkIndex - 1 + this.artworks.length) % this.artworks.length;
    this.navigateToArtwork(prevIdx);
  }

  resetSalonView() {
    if (typeof gsap === 'undefined') {
      this.camera.position.set(0, 35, 140);
      this.currentLookAt.set(0, 30, 0);
      this.camera.lookAt(this.currentLookAt);
      return;
    }
    gsap.to(this.camera.position, {
      x: 0,
      y: 35,
      z: 140,
      duration: 1.8,
      ease: 'power3.inOut'
    });
    gsap.to(this.currentLookAt, {
      x: 0,
      y: 30,
      z: 0,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.currentLookAt);
      }
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // Keyboard navigation (WASD / Arrows)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.nextArtwork();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.prevArtwork();
      } else if (e.key === 'Escape' || e.key === ' ') {
        this.resetSalonView();
      }
    });

    // Click on paintings
    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = [];
      this.artworks.forEach(art => {
        art.group.traverse(child => {
          if (child.isMesh) meshes.push(child);
        });
      });

      const intersects = this.raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent && !parent.userData.url && parent.parent) {
          parent = parent.parent;
        }
        if (parent && parent.userData && typeof parent.userData.index === 'number') {
          this.navigateToArtwork(parent.userData.index);
        }
      }
    });
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Gently drift golden fireflies
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.05;
        if (positions[i] > 70) positions[i] = 5;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
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

window.VirtualArtGallery = VirtualArtGallery;
