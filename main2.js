import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "Stats";
import { RGBELoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/RGBELoader.js";

class App {
  constructor() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      500
    );
    this.camera.position.set(0, 1.6, 3);

    // Create a new dolly object
    const dollyGeom = new THREE.CapsuleGeometry(0.1, 0.5, 12);
    const dollyMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    });
    this.dolly = new THREE.Mesh(dollyGeom, dollyMaterial);
    this.dolly.position.set(0, 0,0); // Adjust the position if needed
    this.dolly.add(this.camera);
    this.dummyCam = new THREE.Object3D();
    this.camera.add(this.dummyCam);

    this.scene = new THREE.Scene();
    this.scene.add(this.dolly);

    // Add a basic light to ensure the dolly is visible
    const ambient = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.8);
    this.scene.add(ambient);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(this.renderer.domElement);

    // Environment setup (lighting)
    this.setEnvironment();

    // Window resize for responsiveness
    window.addEventListener("resize", this.resize.bind(this));

    // Some useful variables initialization
    this.clock = new THREE.Clock();
    this.up = new THREE.Vector3(0, 1, 0);
    this.origin = new THREE.Vector3();
    this.workingVec3 = new THREE.Vector3();
    this.workingQuaternion = new THREE.Quaternion();
    this.raycaster = new THREE.Raycaster();
    this.controller1;
    this.controller2;

    // For debugging
    this.stats = new Stats();
    container.appendChild(this.stats.dom);

    this.loadModel();

    if (!this.renderer.xr.isPresenting) {
      this.scene.add(this.camera);
      this.camera.position.set(0, 1.6, 3);
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      controls.maxZoom = 1;
      controls.update();
    }
  }

  async setEnvironment() {
    // Lightning -> HDR file
    const loader = new RGBELoader();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const self = this;

    await loader.load(
      "industrial_sunset_puresky_4k.HDR",
      (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();
        this.scene.environmentIntensity = 0.7;
        self.scene.environment = envMap;
      },
      undefined,
      (err) => {
        console.error("An error occurred setting the environment", err);
      }
    );
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  async loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      "Oxygenation.glb",
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        this.scene.add(model);
      },
      // Progress callback
      (xhr) => {
        const percentLoaded = (xhr.loaded / xhr.total) * 100;
        console.log(`Model loading: ${Math.round(percentLoaded)}%`);
      },
      // Error callback
      (error) => {
        console.error("An error occurred while loading the model:", error);
      }
    );
    this.setupXr();
  }

  setupXr() {
    this.renderer.xr.enabled = true;
    const self = this;

    function vrStatus(available) {
      if (available) {
        function onSelectStart(event) {
          this.userData.selectPressed = true;
        }
        function onSelectEnd(event) {
          this.userData.selectPressed = false;
        }
        self.controllers = self.buildControllers(self.dolly);
        self.controllers.forEach((controller) => {
          controller.addEventListener("selectstart", onSelectStart);
          controller.addEventListener("selectend", onSelectEnd);
        });
      } else {
        self.joystick = new JoyStick({
          onMove: self.onMove.bind(self),
        });
      }
    }

    const btn = VRButton.createButton(this.renderer);
    document.body.appendChild(btn);
    btn.addEventListener("click", vrStatus);
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  buildControllers(parent = this.scene) {

    function onControllerConnected1(e){
      console.log("Connected 1")  
      // console.log(this.controller1)
      this.controller1.userData = e.data;
    }

    function onControllerConnected2(e){
      console.log("Connected 1")  
      this.controller2.userData = e.data;
    }

    const controllerModelFactory = new XRControllerModelFactory();
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);
    
    const line = new THREE.Line(geometry);
    line.scale.z = 0;
    
    const controllers = [];
    
      this.controller1 = this.renderer.xr.getController(0);
      this.controller1.addEventListener("connected",onControllerConnected1)
      this.controller1.add(line.clone());
      this.controller1.userData.selectPressed = false;
      parent.add(this.controller1);
      controllers.push(this.controller1);  
      const grip1 = this.renderer.xr.getControllerGrip(0);
      grip1.add(controllerModelFactory.createControllerModel(grip1));
      parent.add(grip1);

      this.controller2 = this.renderer.xr.getController(0);
      this.controller2.add(line.clone());
      this.controller2.userData.selectPressed = false;
      this.controller2.addEventListener("connected",onControllerConnected2)
      parent.add(this.controller2);
      controllers.push(this.controller2);  
      const grip2 = this.renderer.xr.getControllerGrip(0);
      grip2.add(controllerModelFactory.createControllerModel(grip2));
      parent.add(grip2);
    
    return controllers;
  }

  moveDolly(dt){

  }

  render(timestamp, frame) {
    this.stats.update();
    this.renderer.render(this.scene, this.camera);


    //Controller Input

  }
}

export { App };
