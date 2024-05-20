import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "Stats";
import { RGBELoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/RGBELoader.js";

let controller1, controller2;
let controllerGrip1, controllerGrip2;
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
    this.camera.position.set(0, 1.6, 0);

    this.dolly = new THREE.Object3D();
    this.dolly.position.set(0, 0, 10);
    this.dolly.add(this.camera);
    this.dummyCam = new THREE.Object3D();
    this.camera.add(this.dummyCam);

    this.scene = new THREE.Scene();
    this.scene.add(this.dolly);

    // const ambient = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.8);
    // this.scene.add(ambient);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(this.renderer.domElement);

    // Environment setup (lightning)
    this.setEnvironment();

    // window resize for responsivness
    window.addEventListener("resize", this.resize.bind(this));

    //some usefule variables initialization
    this.clock = new THREE.Clock();
    this.up = new THREE.Vector3(0, 1, 0);
    this.origin = new THREE.Vector3();
    this.workingVec3 = new THREE.Vector3();
    this.workingQuaternion = new THREE.Quaternion();
    this.raycaster = new THREE.Raycaster();

    //for debugging purpose
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
    //lightning -> hdr file
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
        console.log(available);
        function onSelectStart(event) {
          this.userData.selectPressed = true;
        }

        function onSelectEnd(event) {
          this.userData.selectPressed = false;
        }

        self.controllers = self.buildControllers(self.dolly);

        // self.controllers.forEach((controller) => {
        //   controller.addEventListener("selectstart", onSelectStart);
        //   controller.addEventListener("selectend", onSelectEnd);
        // });
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

    // const config = {
    //   panelSize: { height: 0.5 },
    //   height: 256,
    //   name: { fontSize: 50, height: 70 },
    //   info: {
    //     position: { top: 70, backgroundColor: "#ccc", fontColor: "#000" },
    //   },
    // };
    // const content = {
    //   name: "name",
    //   info: "info",
    // };

    // this.ui = new CanvasUI(content, config);
    // this.scene.add(this.ui.mesh);
  }

  //
  buildControllers(parent = this.scene) {
    // const controllerModelFactory = new XRControllerModelFactory();

    // const geometry = new THREE.BufferGeometry().setFromPoints([
    //   new THREE.Vector3(0, 0, 0),
    //   new THREE.Vector3(0, 0, -1),
    // ]);

    // const line = new THREE.Line(geometry);
    // line.scale.z = 0;

    // const controllers = [];

    // for (let i = 0; i <= 1; i++) {
    //   const controller = this.renderer.xr.getController(i);
    //   controller.add(line.clone());
    //   controller.userData.selectPressed = false;
    //   parent.add(controller);
    //   controllers.push(controller);

    //   const grip = this.renderer.xr.getControllerGrip(i);
    //   grip.add(controllerModelFactory.createControllerModel(grip));
    //   parent.add(grip);
    // }
    // return controllers;

    const controllerModelFactory = new XRControllerModelFactory();

    function onController1Connected() {}
    function onController2Connected() {}
    // Controller 1
    controller1 = this.renderer.xr.getController(0);
    controller1.addEventListener("connected", onController1Connected);

    controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    controllerGrip1.add(
      controllerModelFactory.createControllerModel(controllerGrip1)
    );
    parent.add(controllerGrip1);
    this.scene.add(controllerGrip1);

    // Controller 2
    controller2 = this.renderer.xr.getController(1);
    controller2.addEventListener("connected", onController2Connected);

    controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    controllerGrip2.add(
      controllerModelFactory.createControllerModel(controllerGrip2)
    );
    parent.add(controllerGrip2);
    this.scene.add(controllerGrip2);

    const controllers = [];
    controllers.push(controller1);
    controllers.push(controller2);
    return controllers;
  }

  render(timestamp, frame) {
    this.stats.update();
    this.renderer.render(this.scene, this.camera);
  }

  
}

export { App };
