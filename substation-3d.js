/* ==========================================================================
   EVA ELEKTROMEKANİK - 3D WEBGL ENGINE & PROCEDURAL SUBSTATION SIMULATION
   Three.js Interactive Exploded View of Monoblock Substation & MV Switchgear
   ========================================================================== */

class Substation3DEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.container = this.canvas.parentElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Component Groups
    this.substationRoot = null;
    this.roofGroup = null;
    this.doorsGroup = [];
    this.wallsGroup = null;
    this.baseGroup = null;
    this.ogSwitchgearGroup = null;
    this.centralCellExplodedGroup = {};
    this.transformerGroup = null;
    this.lvPanelGroup = null;
    this.lightCubesGroup = null;
    this.energyFlowLines = [];

    // State
    this.explodeFactor = 0; // 0 to 1
    this.targetExplodeFactor = 0;
    this.currentViewMode = 'pbr'; // 'pbr', 'light-cube', 'wireframe'
    this.isUserInteracting = false;
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);

    // Initial Camera Pos
    this.defaultCamPos = new THREE.Vector3(12, 7, 14);

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04070D);
    this.scene.fog = new THREE.FogExp2(0x04070D, 0.025);

    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.copy(this.defaultCamPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // 4. Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't go under floor
    this.controls.minDistance = 4;
    this.controls.maxDistance = 35;
    this.controls.target.copy(this.cameraTarget);

    // 5. Lighting
    this.setupLighting();

    // 6. Materials
    this.setupMaterials();

    // 7. Ground / Grid
    this.createGroundGrid();

    // 8. Build 3D Models
    this.buildSubstation();
    this.buildFloatingLightCubes();

    // 9. Resize & Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // 10. Start Loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x1a2638, 1.2);
    this.scene.add(ambientLight);

    // Main Directional Sun Light (casting soft shadows)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(15, 25, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Cyan High-Tech Rim Light
    const cyanRim = new THREE.DirectionalLight(0x00F2FE, 2.5);
    cyanRim.position.set(-18, 12, -15);
    this.scene.add(cyanRim);

    // Amber Energy Fill Light
    const amberFill = new THREE.PointLight(0xF59E0B, 2.0, 30);
    amberFill.position.set(4, 3, 2);
    this.scene.add(amberFill);

    // Blue Underglow
    const blueUnderglow = new THREE.PointLight(0x0066FF, 1.5, 25);
    blueUnderglow.position.set(0, -1, 0);
    this.scene.add(blueUnderglow);
  }

  setupMaterials() {
    // Procedural concrete texture using canvas
    const concreteCanvas = document.createElement('canvas');
    concreteCanvas.width = 512;
    concreteCanvas.height = 512;
    const ctx = concreteCanvas.getContext('2d');
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(0, 0, 512, 512);
    // Add noise
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(60 + Math.random() * 50);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, 2, 2);
    }
    const concreteTexture = new THREE.CanvasTexture(concreteCanvas);
    concreteTexture.wrapS = THREE.RepeatWrapping;
    concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(3, 3);

    this.materials = {
      // Concrete C35/45
      concrete: new THREE.MeshStandardMaterial({
        color: 0x5a6578,
        roughness: 0.88,
        metalness: 0.1,
        map: concreteTexture,
        bumpMap: concreteTexture,
        bumpScale: 0.05
      }),
      concreteBase: new THREE.MeshStandardMaterial({
        color: 0x333b48,
        roughness: 0.95,
        metalness: 0.05
      }),
      // Steel Doors / Panels RAL 7035 (Light Gray)
      paintedSteel: new THREE.MeshStandardMaterial({
        color: 0xCBD5E1,
        roughness: 0.35,
        metalness: 0.75
      }),
      // Louvers & Trims (Dark anodized aluminum)
      aluminumLouver: new THREE.MeshStandardMaterial({
        color: 0x1E293B,
        roughness: 0.4,
        metalness: 0.85
      }),
      // Switchgear Steel Enclosure RAL 7032
      switchgearSteel: new THREE.MeshStandardMaterial({
        color: 0x94A3B8,
        roughness: 0.3,
        metalness: 0.8
      }),
      // Switchgear Front Bezel (Cyan Accented High-Tech)
      switchgearFront: new THREE.MeshStandardMaterial({
        color: 0x0F172A,
        roughness: 0.25,
        metalness: 0.85
      }),
      // Copper Busbars (Cu)
      copper: new THREE.MeshStandardMaterial({
        color: 0xB87333,
        roughness: 0.25,
        metalness: 0.95
      }),
      // Epoxy Resin Insulators (Amber/Red)
      insulator: new THREE.MeshStandardMaterial({
        color: 0xA83232,
        roughness: 0.15,
        metalness: 0.1
      }),
      // Transformer Tank & Radiator Fins
      transformerSteel: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.4,
        metalness: 0.7
      }),
      // Bushings Porcelain
      porcelain: new THREE.MeshStandardMaterial({
        color: 0x5C241C,
        roughness: 0.1,
        metalness: 0.2
      }),
      // LV Switchboard
      lvSteel: new THREE.MeshStandardMaterial({
        color: 0xE2E8F0,
        roughness: 0.3,
        metalness: 0.6
      }),
      // Neon Cyan Glow Material (Light Cubes / Active power)
      neonCyanGlow: new THREE.MeshStandardMaterial({
        color: 0x00F2FE,
        emissive: 0x00F2FE,
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85
      }),
      // Holographic Glass (Magnific style)
      hologramGlass: new THREE.MeshPhysicalMaterial({
        color: 0x00F2FE,
        transmission: 0.85,
        opacity: 0.5,
        transparent: true,
        roughness: 0.1,
        metalness: 0.1,
        ior: 1.5,
        thickness: 0.5
      }),
      // Warning Yellow/Black
      warningSign: new THREE.MeshBasicMaterial({
        color: 0xF59E0B
      }),
      // LED Green Live Indicator
      ledGreen: new THREE.MeshBasicMaterial({
        color: 0x10B981
      })
    };
  }

  createGroundGrid() {
    // Blueprint Floor Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x00F2FE, 0x1e293b);
    gridHelper.position.y = -1.5;
    this.scene.add(gridHelper);

    // Subtle Ground Disc with radial gradient
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x04070D,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.51;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  /* ========================================================================
     PROCEDURAL SUBSTATION 3D MODELING
     Dimensions based on standard EVA-MBK 250/720 (2.5m x 7.2m x 2.6m)
     ======================================================================== */
  buildSubstation() {
    this.substationRoot = new THREE.Group();
    this.scene.add(this.substationRoot);

    const length = 7.2; // Z axis
    const width = 2.6;  // X axis
    const height = 2.6; // Y axis

    // 1. CONCRETE BASE & CABLE CELLAR (Temel ve Kablo Havuzu)
    this.baseGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(width + 0.3, 0.8, length + 0.3);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.concreteBase);
    baseMesh.position.y = -0.4;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    this.baseGroup.add(baseMesh);

    // Cable duct cutouts in base (glowing cables entering)
    const cableColors = [0xEF4444, 0xF59E0B, 0x10B981];
    for (let i = 0; i < 3; i++) {
      const cableCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-width / 2 + 0.5 + i * 0.4, -1.4, length / 2 - 1),
        new THREE.Vector3(-width / 2 + 0.5 + i * 0.4, -0.6, length / 2 - 1.2),
        new THREE.Vector3(-width / 2 + 0.5 + i * 0.4, 0.2, length / 2 - 1.5)
      ]);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 20, 0.05, 8, false);
      const cableMat = new THREE.MeshStandardMaterial({
        color: cableColors[i],
        roughness: 0.4,
        metalness: 0.5
      });
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      this.baseGroup.add(cableMesh);
    }
    this.substationRoot.add(this.baseGroup);

    // 2. CONCRETE WALLS & INTERIOR PARTITIONS (Monoblok Gövde)
    this.wallsGroup = new THREE.Group();
    this.substationRoot.add(this.wallsGroup);

    // Outer Back Wall
    const backWallGeo = new THREE.BoxGeometry(0.18, height, length);
    const backWall = new THREE.Mesh(backWallGeo, this.materials.concrete);
    backWall.position.set(-width / 2, height / 2, 0);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.wallsGroup.add(backWall);

    // Left End Wall (OG side)
    const leftEndGeo = new THREE.BoxGeometry(width, height, 0.18);
    const leftEnd = new THREE.Mesh(leftEndGeo, this.materials.concrete);
    leftEnd.position.set(0, height / 2, length / 2);
    leftEnd.castShadow = true;
    leftEnd.receiveShadow = true;
    this.wallsGroup.add(leftEnd);

    // Right End Wall (AG side)
    const rightEnd = leftEnd.clone();
    rightEnd.position.set(0, height / 2, -length / 2);
    this.wallsGroup.add(rightEnd);

    // Front Wall Framework (surrounding doors)
    const frontPillars = [
      length / 2, 
      length / 2 - 2.5, 
      -length / 2 + 2.3, 
      -length / 2
    ];
    for (let i = 0; i < frontPillars.length; i++) {
      const pillarGeo = new THREE.BoxGeometry(0.18, height, 0.25);
      const pillar = new THREE.Mesh(pillarGeo, this.materials.concrete);
      pillar.position.set(width / 2, height / 2, frontPillars[i] - (i === 0 ? 0.12 : i === 3 ? -0.12 : 0));
      this.wallsGroup.add(pillar);
    }

    // Top Lintels over doors
    const lintelGeo = new THREE.BoxGeometry(0.18, 0.35, length);
    const lintel = new THREE.Mesh(lintelGeo, this.materials.concrete);
    lintel.position.set(width / 2, height - 0.175, 0);
    this.wallsGroup.add(lintel);

    // Interior Fire Partition Walls separating the 3 rooms
    const partition1 = new THREE.BoxGeometry(width - 0.2, height, 0.15);
    const partMesh1 = new THREE.Mesh(partition1, this.materials.concrete);
    partMesh1.position.set(0, height / 2, length / 2 - 2.5);
    this.wallsGroup.add(partMesh1);

    const partMesh2 = new THREE.Mesh(partition1, this.materials.concrete);
    partMesh2.position.set(0, height / 2, -length / 2 + 2.3);
    this.wallsGroup.add(partMesh2);

    // 3. CONCRETE ROOF (Çatı) with Rain Slopes & 4 Heavy Lifting Lugs
    this.roofGroup = new THREE.Group();
    const roofBaseGeo = new THREE.BoxGeometry(width + 0.45, 0.28, length + 0.45);
    const roofMesh = new THREE.Mesh(roofBaseGeo, this.materials.concrete);
    roofMesh.position.set(0, height + 0.14, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    this.roofGroup.add(roofMesh);

    // 4 Corner Lifting Lugs (Kaldırma Mapaları)
    const lugPositions = [
      [-width / 2 - 0.1, height + 0.35, -length / 2 + 0.3],
      [width / 2 + 0.1, height + 0.35, -length / 2 + 0.3],
      [-width / 2 - 0.1, height + 0.35, length / 2 - 0.3],
      [width / 2 + 0.1, height + 0.35, length / 2 - 0.3]
    ];
    lugPositions.forEach(pos => {
      const torusGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16);
      const lugMesh = new THREE.Mesh(torusGeo, this.materials.aluminumLouver);
      lugMesh.rotation.y = Math.PI / 2;
      lugMesh.position.set(pos[0], pos[1], pos[2]);
      this.roofGroup.add(lugMesh);
    });
    this.substationRoot.add(this.roofGroup);

    // 4. THREE FRONT ACCESS DOORS WITH LOUVERS & HANDLES
    // Door 1: OG Compartment Door (Z = 2.3)
    // Door 2: Transformer Compartment Door (Double door with big ventilation louvers, Z = 0)
    // Door 3: LV Switchboard Compartment Door (Z = -2.3)
    this.doorsGroup = [];

    const doorSpecs = [
      { z: length / 2 - 1.25, width: 2.1, isDouble: false, label: 'OG ŞALT GİRİŞİ' },
      { z: -0.1, width: 2.2, isDouble: true, label: 'TRAFO GİRİŞİ' },
      { z: -length / 2 + 1.15, width: 2.0, isDouble: false, label: 'AG DAĞITIM GİRİŞİ' }
    ];

    doorSpecs.forEach(spec => {
      const doorPivot = new THREE.Group();
      doorPivot.position.set(width / 2 + 0.09, 0, spec.z - spec.width / 2);

      const leafGeo = new THREE.BoxGeometry(0.05, height - 0.4, spec.width);
      const leafMesh = new THREE.Mesh(leafGeo, this.materials.paintedSteel);
      leafMesh.position.set(0, (height - 0.4) / 2, spec.width / 2);
      leafMesh.castShadow = true;

      // Ventilation Louver Grille on Door
      const louverFrameGeo = new THREE.BoxGeometry(0.08, 0.7, spec.width * 0.7);
      const louverMesh = new THREE.Mesh(louverFrameGeo, this.materials.aluminumLouver);
      louverMesh.position.set(0, (height - 0.4) * 0.4, spec.width / 2);
      leafMesh.add(louverMesh);

      // Warning Sign
      const warningGeo = new THREE.PlaneGeometry(0.25, 0.25);
      const warningMesh = new THREE.Mesh(warningGeo, this.materials.warningSign);
      warningMesh.rotation.y = Math.PI / 2;
      warningMesh.position.set(0.035, (height - 0.4) * 0.75, spec.width / 2);
      leafMesh.add(warningMesh);

      // Door Handle
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
      const handle = new THREE.Mesh(handleGeo, this.materials.aluminumLouver);
      handle.position.set(0.04, 1.0, spec.width * 0.85);
      leafMesh.add(handle);

      doorPivot.add(leafMesh);
      this.substationRoot.add(doorPivot);

      this.doorsGroup.push({
        pivot: doorPivot,
        openAngle: -Math.PI / 2.2
      });
    });

    // 5. COMPARTMENT 1: ORTA GERİLİM (OG) HÜCRELERİ (EVA+ 36 kV Modular Switchgear)
    this.buildOGSwitchgearRoom(length, width, height);

    // 6. COMPARTMENT 2: TRANSFORMATÖR ODASI (Distribution Transformer)
    this.buildTransformerRoom(length, width, height);

    // 7. COMPARTMENT 3: ALÇAK GERİLİM (AG) PANOSU ODASI (LV Switchboard)
    this.buildLVPanelRoom(length, width, height);
  }

  /* ========================================================================
     OG MODULAR SWITCHGEAR MODELING (EVA+ 36 kV)
     ======================================================================== */
  buildOGSwitchgearRoom(length, width, height) {
    this.ogSwitchgearGroup = new THREE.Group();
    // Position inside the first compartment (Z ~ 2.3)
    this.ogSwitchgearGroup.position.set(0, 0, length / 2 - 1.25);

    const cellWidth = 0.65;
    const cellHeight = 2.0;
    const cellDepth = 1.35;
    const cellZPositions = [-0.7, 0, 0.7]; // 3 cells: Incomer, Breaker (Trafo), Metering

    cellZPositions.forEach((zOffset, index) => {
      const cellGroup = new THREE.Group();
      cellGroup.position.set(0, 0, zOffset);

      if (index === 1) {
        // CENTRAL CELL: This is our fully-exploded anatomical 3D showcase!
        this.buildCentralExplodedCell(cellGroup, cellWidth, cellHeight, cellDepth);
      } else {
        // Other 2 standard cells (Incomer & Metering)
        const cellBoxGeo = new THREE.BoxGeometry(cellDepth, cellHeight, cellWidth);
        const cellBox = new THREE.Mesh(cellBoxGeo, this.materials.switchgearSteel);
        cellBox.position.set(0, cellHeight / 2, 0);
        cellBox.castShadow = true;
        cellGroup.add(cellBox);

        // Front Panel
        const frontPanelGeo = new THREE.BoxGeometry(0.02, cellHeight * 0.95, cellWidth * 0.92);
        const frontPanel = new THREE.Mesh(frontPanelGeo, this.materials.switchgearFront);
        frontPanel.position.set(cellDepth / 2 + 0.01, cellHeight / 2, 0);
        cellGroup.add(frontPanel);

        // Mimic Bus line (Yellow)
        const mimicGeo = new THREE.PlaneGeometry(0.02, cellHeight * 0.6);
        const mimicMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
        const mimic = new THREE.Mesh(mimicGeo, mimicMat);
        mimic.rotation.y = Math.PI / 2;
        mimic.position.set(cellDepth / 2 + 0.025, cellHeight / 2, 0);
        cellGroup.add(mimic);

        // Relay Screen
        const relayGeo = new THREE.PlaneGeometry(0.18, 0.12);
        const relayMat = new THREE.MeshBasicMaterial({ color: 0x00F2FE });
        const relay = new THREE.Mesh(relayGeo, relayMat);
        relay.rotation.y = Math.PI / 2;
        relay.position.set(cellDepth / 2 + 0.025, cellHeight * 0.85, 0);
        cellGroup.add(relay);
      }

      this.ogSwitchgearGroup.add(cellGroup);
    });

    this.substationRoot.add(this.ogSwitchgearGroup);
  }

  /* ========================================================================
     ANATOMICAL EXPLODED CELL (Hücrenin İç Anatomisi)
     4 Segregated Compartments:
     1. Busbar Compartment (Üst Bara Bölmesi)
     2. Switching/Breaker Compartment (Kesici & Ayırıcı Bölmesi)
     3. Cable & Instrument Transformer Compartment (Kablo & Trafo Bölmesi)
     4. Low Voltage Relay Box (Sekonder Kumanda Dolabı)
     ======================================================================== */
  buildCentralExplodedCell(parentGroup, width, height, depth) {
    const root = new THREE.Group();
    parentGroup.add(root);

    // Frame skeleton
    const skeletonGeo = new THREE.BoxGeometry(depth, height, width);
    const skeleton = new THREE.Mesh(skeletonGeo, this.materials.switchgearSteel);
    skeleton.position.set(0, height / 2, 0);
    skeleton.castShadow = true;
    root.add(skeleton);

    // 1. TOP BUSBAR COMPARTMENT (Üst Bara Bölmesi) - Lifts up
    const busbarGroup = new THREE.Group();
    busbarGroup.position.set(0, height * 0.82, 0);

    // 3 Copper Busbars (Cu L1, L2, L3)
    for (let i = -1; i <= 1; i++) {
      const barGeo = new THREE.BoxGeometry(0.04, 0.1, width * 1.5);
      const bar = new THREE.Mesh(barGeo, this.materials.copper);
      bar.position.set(i * 0.25, 0, 0);
      busbarGroup.add(bar);

      // Support Insulators
      const insGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8);
      const ins = new THREE.Mesh(insGeo, this.materials.insulator);
      ins.position.set(i * 0.25, -0.12, 0);
      busbarGroup.add(ins);
    }
    root.add(busbarGroup);
    this.centralCellExplodedGroup.busbar = busbarGroup;

    // 2. BREAKER CARRIAGE (Vakumlu Kesici Arabası) - Slides forward (+X)
    const breakerGroup = new THREE.Group();
    breakerGroup.position.set(0, height * 0.5, 0);

    const breakerBodyGeo = new THREE.BoxGeometry(depth * 0.5, 0.65, width * 0.75);
    const breakerBody = new THREE.Mesh(breakerBodyGeo, this.materials.aluminumLouver);
    breakerGroup.add(breakerBody);

    // 3 Vacuum Interrupter Bottles (Vakum Tüpleri)
    for (let i = -1; i <= 1; i++) {
      const bottleGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.35, 12);
      const bottle = new THREE.Mesh(bottleGeo, this.materials.insulator);
      bottle.position.set(0.1, 0.15, i * 0.18);
      breakerGroup.add(bottle);

      // Copper Contacts
      const contactGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8);
      const contact = new THREE.Mesh(contactGeo, this.materials.copper);
      contact.position.set(0.1, 0.35, i * 0.18);
      breakerGroup.add(contact);
    }

    // Mechanism Spring & Handles
    const mechGeo = new THREE.BoxGeometry(0.15, 0.25, 0.45);
    const mech = new THREE.Mesh(mechGeo, this.materials.paintedSteel);
    mech.position.set(depth * 0.25 + 0.05, 0, 0);
    breakerGroup.add(mech);

    root.add(breakerGroup);
    this.centralCellExplodedGroup.breaker = breakerGroup;

    // 3. LOWER CABLE & CT/VT COMPARTMENT - Slides down/forward
    const cableCompGroup = new THREE.Group();
    cableCompGroup.position.set(0, height * 0.2, 0);

    // 3 Toroidal Current Transformers (Akım Trafoları)
    for (let i = -1; i <= 1; i++) {
      const ctGeo = new THREE.TorusGeometry(0.09, 0.04, 8, 16);
      const ct = new THREE.Mesh(ctGeo, this.materials.insulator);
      ct.rotation.x = Math.PI / 2;
      ct.position.set(0, 0, i * 0.18);
      cableCompGroup.add(ct);

      // Cable Termination Boot
      const bootGeo = new THREE.ConeGeometry(0.06, 0.25, 8);
      const boot = new THREE.Mesh(bootGeo, this.materials.aluminumLouver);
      boot.position.set(0, -0.15, i * 0.18);
      cableCompGroup.add(boot);
    }

    // Earthing Switch (Topraklama Bıçağı)
    const earthKnifeGeo = new THREE.BoxGeometry(0.3, 0.03, 0.03);
    const earthKnife = new THREE.Mesh(earthKnifeGeo, this.materials.copper);
    earthKnife.position.set(-0.2, 0.12, 0);
    cableCompGroup.add(earthKnife);

    root.add(cableCompGroup);
    this.centralCellExplodedGroup.cableComp = cableCompGroup;

    // 4. LOW VOLTAGE RELAY BOX (Sekonder Kumanda Dolabı) - Pivots open
    const relayDoorGroup = new THREE.Group();
    relayDoorGroup.position.set(depth / 2 + 0.02, height * 0.85, -width / 2);

    const relayDoorGeo = new THREE.BoxGeometry(0.02, 0.35, width);
    const relayDoor = new THREE.Mesh(relayDoorGeo, this.materials.switchgearFront);
    relayDoor.position.set(0, 0, width / 2);

    // Touchscreen / Digital Relay Screen
    const screenGeo = new THREE.PlaneGeometry(0.18, 0.12);
    const screen = new THREE.Mesh(screenGeo, this.materials.neonCyanGlow);
    screen.rotation.y = Math.PI / 2;
    screen.position.set(0.015, 0, width / 2);
    relayDoor.add(screen);

    relayDoorGroup.add(relayDoor);
    root.add(relayDoorGroup);
    this.centralCellExplodedGroup.relayDoor = relayDoorGroup;
  }

  /* ========================================================================
     TRANSFORMER ROOM (1600 / 2500 kVA Dağıtım Trafosu)
     ======================================================================== */
  buildTransformerRoom(length, width, height) {
    this.transformerGroup = new THREE.Group();
    this.transformerGroup.position.set(0, 0, -0.1);

    // Base Mounting Rails with Vibration Dampers
    for (let i = -1; i <= 1; i += 2) {
      const railGeo = new THREE.BoxGeometry(1.6, 0.12, 0.12);
      const rail = new THREE.Mesh(railGeo, this.materials.aluminumLouver);
      rail.position.set(0, 0.06, i * 0.65);
      this.transformerGroup.add(rail);

      // 4 Wheels
      for (let j = -1; j <= 1; j += 2) {
        const wheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12);
        const wheel = new THREE.Mesh(wheelGeo, this.materials.aluminumLouver);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(j * 0.65, 0.06, i * 0.65);
        this.transformerGroup.add(wheel);
      }
    }

    // Transformer Main Tank Body
    const tankGeo = new THREE.BoxGeometry(1.2, 1.25, 1.1);
    const tank = new THREE.Mesh(tankGeo, this.materials.transformerSteel);
    tank.position.set(0, 0.75, 0);
    tank.castShadow = true;
    this.transformerGroup.add(tank);

    // Corrugated Radiator Cooling Fins (Dalga Duvarlar) on both sides
    for (let side = -1; side <= 1; side += 2) {
      for (let f = -7; f <= 7; f++) {
        const finGeo = new THREE.BoxGeometry(0.02, 1.05, 0.25);
        const fin = new THREE.Mesh(finGeo, this.materials.transformerSteel);
        fin.position.set(f * 0.075, 0.75, side * 0.65);
        this.transformerGroup.add(fin);
      }
    }

    // Conservator Tank on Top (Yağ Genleşme Deposu)
    const conservatorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.95, 16);
    const conservator = new THREE.Mesh(conservatorGeo, this.materials.transformerSteel);
    conservator.rotation.z = Math.PI / 2;
    conservator.position.set(0, 1.55, 0.35);
    this.transformerGroup.add(conservator);

    // Buchholz Relay & Piping
    const pipeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const pipe = new THREE.Mesh(pipeGeo, this.materials.aluminumLouver);
    pipe.position.set(0, 1.42, 0.15);
    this.transformerGroup.add(pipe);

    // 3 High Voltage Porcelain Bushings (OG Porselen İzolatörler)
    for (let i = -1; i <= 1; i++) {
      const bushingGeo = new THREE.ConeGeometry(0.075, 0.38, 12);
      const bushing = new THREE.Mesh(bushingGeo, this.materials.porcelain);
      bushing.position.set(i * 0.32, 1.55, -0.28);
      this.transformerGroup.add(bushing);

      // Terminal Lug
      const lugGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
      const lug = new THREE.Mesh(lugGeo, this.materials.copper);
      lug.position.set(i * 0.32, 1.76, -0.28);
      this.transformerGroup.add(lug);
    }

    // 4 Low Voltage Terminals (AG Baraları: 3 Faz + Nötr)
    for (let i = 0; i < 4; i++) {
      const lvBushing = new THREE.BoxGeometry(0.04, 0.22, 0.08);
      const lvMesh = new THREE.Mesh(lvBushing, this.materials.copper);
      lvMesh.position.set(-0.35 + i * 0.22, 1.5, 0.05);
      this.transformerGroup.add(lvMesh);
    }

    this.substationRoot.add(this.transformerGroup);
  }

  /* ========================================================================
     LOW VOLTAGE SWITCHBOARD ROOM (AG Dağıtım & Kompanzasyon Panosu)
     ======================================================================== */
  buildLVPanelRoom(length, width, height) {
    this.lvPanelGroup = new THREE.Group();
    this.lvPanelGroup.position.set(0, 0, -length / 2 + 1.15);

    // Panel Cabinet Frame
    const cabinetGeo = new THREE.BoxGeometry(0.65, 2.05, 1.85);
    const cabinet = new THREE.Mesh(cabinetGeo, this.materials.lvSteel);
    cabinet.position.set(0, 2.05 / 2, 0);
    cabinet.castShadow = true;
    this.lvPanelGroup.add(cabinet);

    // Front Doors with Meters
    const frontDoorGeo = new THREE.BoxGeometry(0.02, 1.95, 1.75);
    const frontDoor = new THREE.Mesh(frontDoorGeo, this.materials.paintedSteel);
    frontDoor.position.set(0.65 / 2 + 0.015, 2.05 / 2, 0);
    this.lvPanelGroup.add(frontDoor);

    // Main Air Circuit Breaker (ACB) Bezel
    const acbGeo = new THREE.BoxGeometry(0.06, 0.45, 0.45);
    const acb = new THREE.Mesh(acbGeo, this.materials.aluminumLouver);
    acb.position.set(0.65 / 2 + 0.035, 1.35, 0.4);
    this.lvPanelGroup.add(acb);

    // Vertical Fuse Switch Disconnectors (Dikey Yük Ayırıcılar)
    for (let i = 0; i < 4; i++) {
      const vSwitchGeo = new THREE.BoxGeometry(0.05, 0.6, 0.12);
      const vSwitch = new THREE.Mesh(vSwitchGeo, this.materials.aluminumLouver);
      vSwitch.position.set(0.65 / 2 + 0.03, 0.65, -0.4 + i * 0.22);
      this.lvPanelGroup.add(vSwitch);
    }

    // Digital Multimeter / Energy Analyzer Screen
    const multiGeo = new THREE.PlaneGeometry(0.16, 0.12);
    const multi = new THREE.Mesh(multiGeo, this.materials.neonCyanGlow);
    multi.rotation.y = Math.PI / 2;
    multi.position.set(0.65 / 2 + 0.03, 1.65, -0.3);
    this.lvPanelGroup.add(multi);

    this.substationRoot.add(this.lvPanelGroup);
  }

  /* ========================================================================
     FLOATING LIGHT CUBES (Magnific Aesthetic Ambient 3D Elements)
     ======================================================================== */
  buildFloatingLightCubes() {
    this.lightCubesGroup = new THREE.Group();
    this.scene.add(this.lightCubesGroup);

    const cubeCount = 14;
    this.cubeObjects = [];

    for (let i = 0; i < cubeCount; i++) {
      const size = 0.4 + Math.random() * 0.9;
      const cubeGeo = new THREE.BoxGeometry(size, size, size);
      
      // Wireframe Edges
      const edges = new THREE.EdgesGeometry(cubeGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: Math.random() > 0.4 ? 0x00F2FE : 0xF59E0B,
        transparent: true,
        opacity: 0.75
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);

      // Translucent Inner Cube
      const cubeMat = new THREE.MeshPhysicalMaterial({
        color: Math.random() > 0.4 ? 0x00F2FE : 0xF59E0B,
        transmission: 0.9,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.2
      });
      const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
      cubeMesh.add(wireframe);

      // Random position orbiting the substation
      const angle = (i / cubeCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 6 + Math.random() * 7;
      const x = Math.cos(angle) * radius;
      const y = 1.5 + Math.random() * 6;
      const z = Math.sin(angle) * radius;

      cubeMesh.position.set(x, y, z);
      cubeMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      this.lightCubesGroup.add(cubeMesh);

      this.cubeObjects.push({
        mesh: cubeMesh,
        speedX: 0.005 + Math.random() * 0.01,
        speedY: 0.008 + Math.random() * 0.012,
        floatBaseY: y,
        floatFreq: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  /* ========================================================================
     SCROLL & SLIDER DRIVEN EXPLODED ANIMATION LERP
     ======================================================================== */
  setExplode(factor) {
    this.targetExplodeFactor = THREE.MathUtils.clamp(factor, 0, 1);
  }

  updateExplodedPositions() {
    // Smooth lerp to target
    this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;
    const t = this.explodeFactor;

    // 1. ROOF LIFTS (+Y)
    if (this.roofGroup) {
      this.roofGroup.position.y = t * 3.8;
      this.roofGroup.rotation.z = t * 0.08;
    }

    // 2. DOORS SWING OPEN
    this.doorsGroup.forEach(door => {
      door.pivot.rotation.y = t * door.openAngle;
    });

    // 3. WALLS TRANSLUCENCY / PULL BACK
    if (this.wallsGroup) {
      if (this.currentViewMode === 'pbr') {
        this.materials.concrete.transparent = t > 0.05;
        this.materials.concrete.opacity = THREE.MathUtils.lerp(1.0, 0.25, t);
      }
    }

    // 4. OG SWITCHGEARS PULL FORWARD (+X)
    if (this.ogSwitchgearGroup) {
      this.ogSwitchgearGroup.position.x = t * 1.5;
    }

    // 5. CELL INTERNAL ANATOMY EXPLODES
    if (this.centralCellExplodedGroup.busbar) {
      this.centralCellExplodedGroup.busbar.position.y = 2.0 * 0.82 + t * 1.2;
    }
    if (this.centralCellExplodedGroup.breaker) {
      this.centralCellExplodedGroup.breaker.position.x = t * 1.6;
    }
    if (this.centralCellExplodedGroup.cableComp) {
      this.centralCellExplodedGroup.cableComp.position.y = 2.0 * 0.2 - t * 0.6;
    }
    if (this.centralCellExplodedGroup.relayDoor) {
      this.centralCellExplodedGroup.relayDoor.rotation.y = t * (Math.PI / 2.2);
    }

    // 6. TRANSFORMER PULLS FORWARD (+X)
    if (this.transformerGroup) {
      this.transformerGroup.position.x = t * 1.6;
    }

    // 7. LV PANEL PULLS FORWARD (+X)
    if (this.lvPanelGroup) {
      this.lvPanelGroup.position.x = t * 1.4;
    }
  }

  /* ========================================================================
     VIEW MODE TOGGLES (PBR / HOLOGRAPHIC LIGHT CUBE / CAD WIREFRAME)
     ======================================================================== */
  setViewMode(mode) {
    this.currentViewMode = mode;

    this.substationRoot.traverse(child => {
      if (child.isMesh) {
        if (mode === 'light-cube') {
          // Cyberpunk glowing glass aesthetic
          child.originalMaterial = child.originalMaterial || child.material;
          child.material = this.materials.hologramGlass;
        } else if (mode === 'wireframe') {
          child.originalMaterial = child.originalMaterial || child.material;
          child.material = new THREE.MeshBasicMaterial({
            color: 0x00F2FE,
            wireframe: true
          });
        } else {
          // Back to PBR
          if (child.originalMaterial) {
            child.material = child.originalMaterial;
          }
        }
      }
    });
  }

  /* ========================================================================
     CAMERA FOCUS TWEENING (HOTSPOTS)
     ======================================================================== */
  focusHotspot(spotName) {
    let targetPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3();
    let targetExplode = this.targetExplodeFactor;

    switch (spotName) {
      case 'all':
        targetPos.set(12, 7, 14);
        lookTarget.set(0, 1.2, 0);
        targetExplode = 0;
        break;
      case 'roof':
        targetPos.set(4, 9, 8);
        lookTarget.set(0, 3, 0);
        targetExplode = 0.35;
        break;
      case 'og':
        targetPos.set(5, 2.5, 4.5);
        lookTarget.set(0.5, 1.2, 2.3);
        targetExplode = 0.65;
        break;
      case 'breaker':
        targetPos.set(3.2, 1.6, 2.6);
        lookTarget.set(0.8, 1.0, 2.3);
        targetExplode = 0.85;
        break;
      case 'busbar':
        targetPos.set(2.8, 3.2, 2.5);
        lookTarget.set(0.2, 2.4, 2.3);
        targetExplode = 0.9;
        break;
      case 'transformer':
        targetPos.set(5.5, 2.5, 0.2);
        lookTarget.set(0.8, 1.1, -0.1);
        targetExplode = 0.7;
        break;
      case 'lv':
        targetPos.set(5.0, 2.4, -3.2);
        lookTarget.set(0.7, 1.2, -2.3);
        targetExplode = 0.65;
        break;
      default:
        targetPos.set(12, 7, 14);
        lookTarget.set(0, 1.2, 0);
    }

    this.setExplode(targetExplode);

    // Smooth Camera Tween using GSAP if present, else manual lerp
    if (window.gsap) {
      gsap.to(this.camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: "power2.inOut"
      });
      gsap.to(this.controls.target, {
        x: lookTarget.x,
        y: lookTarget.y,
        z: lookTarget.z,
        duration: 1.5,
        ease: "power2.inOut"
      });
    } else {
      this.camera.position.copy(targetPos);
      this.controls.target.copy(lookTarget);
    }
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // Update Exploded Positions
    this.updateExplodedPositions();

    // Animate Floating Ambient Light Cubes
    if (this.cubeObjects) {
      this.cubeObjects.forEach(cube => {
        cube.mesh.rotation.x += cube.speedX;
        cube.mesh.rotation.y += cube.speedY;
        cube.mesh.position.y = cube.floatBaseY + Math.sin(time * cube.floatFreq + cube.phase) * 0.35;
      });
    }

    // Controls update
    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Attach to window
window.Substation3DEngine = Substation3DEngine;
