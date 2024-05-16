import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as Controller from "./controller.js";
import { RGBELoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/RGBELoader.js";

// Variables
let scene, camera, renderer;
let capsuleHeight = 1.6;
let collisionCapsule;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let LeftController_inputY, LeftController_inputX;
let RightController_inputY, RightController_inputX;
const characterSpeed = 0.05;
const TurningSpeed = 0.01;
let controls;

async function init() {
  scene = new THREE.Scene();

  // Set up the camera
  const fov = 75;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 40;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  setupLightning(renderer, scene);

  //orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  camera.position.set(0, 1.6, 3);

  // Create a collision capsule for character
  const capsuleGeometry = new THREE.CapsuleGeometry(0, 0.01, 12);
  const capsuleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
  });
  collisionCapsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
  scene.add(collisionCapsule);
  collisionCapsule.add(camera);
  collisionCapsule.position.set(0, 0, 0);

  // if (renderer.xr.isPresenting) {
  //   collisionCapsule.visible = true;
  // } else {
  //   collisionCapsule.visible = false;
  // }

  // Controller logic
  setupControllers();

  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(5, 10, 7);
  light.castShadow = true;
  // light.shadow.camera.top = 10;
  // light.shadow.camera.bottom = -10;
  // light.shadow.camera.left = -10;
  // light.shadow.camera.right = 10;
  // light.shadow.camera.near = 0.1;
  // light.shadow.camera.far = 50;
  // light.shadow.mapSize.width = 1024; 
  // light.shadow.mapSize.height = 1024;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
  scene.add(ambientLight);

  // Load the 3D model
  await loadModel();

  renderer.setAnimationLoop(render);
}
window.addEventListener("resize", resize.bind(this));

function setupControllers() {
  const controllerModelFactory = new XRControllerModelFactory();

  // Controller 1
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("connected", onController1Connected);
  collisionCapsule.add(controller1);
  // scene.add(controller1);

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  collisionCapsule.add(controllerGrip1);
  // scene.add(controllerGrip1);

  // Controller 2
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("connected", onController2Connected);
  collisionCapsule.add(controller2);
  // scene.add(controller2);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  collisionCapsule.add(controllerGrip2);
  // scene.add(controllerGrip2);
}

function onController2Connected(event) {
  console.log("askjdnasjkbd", controller2);
  controller2.userData = event.data;
}
function onController1Connected(event) {
  console.log("askjdnasjkbd2", controller1);
  controller1.userData = event.data;
}

async function loadModel() {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync("Oxygenation.glb");
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    model.castShadow  = true;
    scene.add(model);
  } catch (error) {
    console.error("An error occurred while loading the model:", error);
  }
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize && !renderer.xr.isPresenting) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function handleControllerInputForLeft(controller) {
  if (renderer.xr.isPresenting) {
    if (
      controller.userData.gamepad &&
      controller.userData.gamepad.axes &&
      controller.userData.gamepad.axes
    ) {
      //for deadzone...
      if (
        controller.userData.gamepad.axes[2] <= 0.1 &&
        controller.userData.gamepad.axes[2] >= -0.1
      ) {
        LeftController_inputX = 0;
      } else {
        LeftController_inputX = controller.userData.gamepad.axes[2];
      }

      if (
        controller.userData.gamepad.axes[3] <= 0.1 &&
        controller.userData.gamepad.axes[3] >= -0.1
      ) {
        LeftController_inputY = 0;
      } else {
        LeftController_inputY = -1 * controller.userData.gamepad.axes[3];
      }
    }
  }
}

function handleControllerInputForRight(controller) {
  if (renderer.xr.isPresenting) {
    if (
      controller.userData.gamepad &&
      controller.userData.gamepad.axes &&
      controller.userData.gamepad.axes
    ) {
      //for deadzone...
      if (
        controller.userData.gamepad.axes[2] <= 0.1 &&
        controller.userData.gamepad.axes[2] >= -0.1
      ) {
        RightController_inputX = 0;
      } else {
        RightController_inputX = controller.userData.gamepad.axes[2];
      }

      if (
        controller.userData.gamepad.axes[3] <= 0.1 &&
        controller.userData.gamepad.axes[3] >= -0.1
      ) {
        RightController_inputY = 0;
      } else {
        RightController_inputY = -1 * controller.userData.gamepad.axes[3];
      }
    }
  }
}

//event tick

let lastFrameValue = 0;

function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  handleControllerInputForLeft(controller1);
  handleControllerInputForRight(controller2);

  if (renderer.xr.isPresenting) {
    console.clear();
    if (controller1.userData.gamepad?.buttons) {
      console.log(controller1.userData.gamepad?.buttons[3]);
    }
    handleMovement();

    // let temp = true;
    // if(lastFrameValue <= 0.2 && lastFrameValue >= -1*(0.2)){
    //   temp = true;
    // }else{
    //   temp = false;
    // }
    handleTurn();

    let location = collisionCapsule.position.clone(); // Clone the position to avoid direct modification
    camera.position
      .copy(location)
      .add(new THREE.Vector3(0, capsuleHeight / 2, 0));

    const vrCamera = renderer.xr.getCamera(camera);
    const cameraWorldPosition = new THREE.Vector3();
    vrCamera.getWorldPosition(cameraWorldPosition);
    lastFrameValue = RightController_inputX;
  }
  renderer.render(scene, camera);
}

init();

function getForwardVector(object) {
  // Create a new Vector3 object pointing to the negative z-axis
  var forward = new THREE.Vector3(0, 0, -1);
  // Apply the object's rotation to the vector
  forward.applyQuaternion(object.quaternion);
  forward.normalize();
  return forward;
}

function getRightVector(object) {
  // Create a new Vector3 object pointing to the positive x-axis
  var right = new THREE.Vector3(1, 0, 0);
  // Apply the object's rotation to the vector
  right.applyQuaternion(object.quaternion);
  right.normalize();
  return right;
}
function handleMovement() {
  if (
    isNaN(LeftController_inputX) ||
    isNaN(LeftController_inputY) ||
    isNaN(characterSpeed)
  ) {
    console.error(
      "Invalid input:",
      LeftController_inputX,
      LeftController_inputY,
      characterSpeed
    );
    return;
  }

  const forwardVec = getForwardVector(collisionCapsule);
  const rightVec = getRightVector(collisionCapsule);

  // Scale the vectors by the controller inputs
  forwardVec.multiplyScalar(LeftController_inputY);
  rightVec.multiplyScalar(LeftController_inputX);

  // Combine the scaled vectors to get the resultant movement vector
  let resultantVec = new THREE.Vector3();
  resultantVec.addVectors(forwardVec, rightVec); // This adds the vectors correctly in 3D space
  resultantVec.multiplyScalar(characterSpeed); // Apply movement speed scaling

  // Check for NaN before updating the position to prevent errors
  if (
    !isNaN(resultantVec.x) &&
    !isNaN(resultantVec.y) &&
    !isNaN(resultantVec.z)
  ) {
    collisionCapsule.position.add(resultantVec);
  } else {
    console.error("NaN detected in resultant vector:", resultantVec);
  }
}
let isStarted = false;
let prevValue = 0;
function handleTurn(check = true) {
  if (
    !isStarted &&
    (RightController_inputX > 0 || RightController_inputX < 0)
  ) {
    isStarted = true;
    if (
      isNaN(RightController_inputX) ||
      isNaN(RightController_inputY) ||
      isNaN(TurningSpeed)
    ) {
      console.error(
        "Invalid input:",
        RightController_inputX,
        RightController_inputY,
        TurningSpeed
      );
      return;
    }
    // console.log(RightController_inputX)
    let rotationAmount = 0;

    // if(RightController_inputX > 0.7 && check){
    if (RightController_inputX < 0) {
      rotationAmount = 45;
    } else {
      rotationAmount = -45;
    }
    // }else if(RightController_inputX < -1*(0.7) && check){
    // rotationAmount = RightController_inputX * 45;
    // }

    // Apply rotation to the collision capsule
    collisionCapsule.rotateY(rotationAmount);
  } else if (RightController_inputX >= -0.1 && RightController_inputX <= 0.1) {
    isStarted = false;
  }
  prevValue = RightController_inputX;
}

async function setupLightning(renderer, scene) {
  const loader = new RGBELoader();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  pmremGenerator.compileEquirectangularShader();
  // console.log(pmremGenerator)
  await loader.load(
    "industrial_sunset_puresky_4k.HDR",
    (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      console.log(scene);
      pmremGenerator.dispose();
      scene.environment = envMap;
      scene.environmentIntensity = 0.7;
    },
    undefined,
    (err) => {
      console.error("An error occurred setting the environment", err);
    }
  );
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
