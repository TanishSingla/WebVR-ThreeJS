import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
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
let raycaster, intersectedObject, rayLine, listener;
let isRaycasting = false;
let audioLoader,sound;
let grp;
let rayLength = 5;

async function init() {
  scene = new THREE.Scene();
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(), 
  new THREE.Vector3(0, 0, -1), 
  0,rayLength);
  listener = new THREE.AudioListener();
  audioLoader = new THREE.AudioLoader();
  sound = new THREE.Audio(listener);
  grp = new THREE.Group();

  // Set up the camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 500);
  camera.position.set(0, 1.6, 3);
  camera.add(listener);

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
  setupLightning(renderer, scene);

  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

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

  // Create a line to represent the ray
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -rayLength)
  ]);

  const rayMaterial = new THREE.LineBasicMaterial({
    color: 0x00EAFF
  });

  setupControllers();
  
  rayLine = new THREE.Line(rayGeometry, rayMaterial);
  controller1.add(rayLine);
  rayLine.visible = false;
  
  // Load the 3D model
  await loadModel("Oxygenation.glb",false);
  await loadModel("/assets/Oxygenation_Collidors.glb",true);

  scene.add(grp);

  renderer.setAnimationLoop(render);
}
window.addEventListener("resize", resize.bind(this));
function setupControllers() {
  const controllerModelFactory = new XRControllerModelFactory();

  // Controller 1
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("connected", onController1Connected);
  controller1.addEventListener("selectstart", onSelectStartController1);
  controller1.addEventListener("selectend", onSelectEndController1);
  collisionCapsule.add(controller1);

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  collisionCapsule.add(controllerGrip1);

  // Controller 2
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("connected", onController2Connected);
  controller2.addEventListener("selectstart", onSelectStartController2);
  controller2.addEventListener("selectend", onSelectEndController2);
  collisionCapsule.add(controller2);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  collisionCapsule.add(controllerGrip2);
}

// Function for handling inputs...
function onController2Connected(event) {
  controller2.userData = event.data;
}
function onController1Connected(event) {
  controller1.userData = event.data;
}

function onSelectStartController1(event) {
  if (!isRaycasting) {
    rayLine.visible = true;
    isRaycasting = true; // Enable raycasting
  } else {
    rayLine.visible = false;
    isRaycasting = false;
  }
}

function onSelectEndController1() {}

function onSelectStartController2() {
  console.log("Input Triggered");
}

function onSelectEndController2() {
  console.log("Input Ended");
}

async function loadModel(path,hide) {
  const loader = new GLTFLoader();

  try {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        // scene.add(model);
        if(hide){
          grp.add(model);
          model.visible = false;
        }else{
          scene.add(model);
        }
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
      // For deadzone...
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
      // For deadzone...
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

// Event tick
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
    // Orientation
    handleMovement();
    handleTurn();

    let location = collisionCapsule.position.clone(); // Clone the position to avoid direct modification
    camera.position.copy(location).add(new THREE.Vector3(0, capsuleHeight / 2, 0));

    // Update the ray's position and direction if raycasting is enabled
    if (isRaycasting) {
      updateRay(controller1);
    }
  }
  renderer.render(scene, camera);
}


function playAudio(obj){
 
  let path = "";
  if(obj.name=="Oil_Absorber" ){
    path = '/assets/Audio/Oil_Absorber.wav';
  }
  else if(obj.name=="Moisture_Absorber"){
    path = '/assets/Audio/Moisture_Absorber.wav';
  }else if(obj.name=="Purger"){
    path = '/assets/Audio/Purger.wav';
  }else if(obj.name=="Carbon_Dioxide_Drying_Unit"){
    path = '/assets/Audio/Carbon_Dioxide_Drying_Unit.wav';
  }else if(obj.name=="After_Cooler"){
    path = '/assets/Audio/After_Cooler.wav';
  }else if(obj.name=="Nitrogen_Cooler"){
    path = '/assets/Audio/Nitrogen_Cooler.wav';
  }else if(obj.name=="Freon_Cooler"){
    path = '/assets/Audio/Freon_Cooler.wav';
  }else if(obj.name=="Cold_Box"){
    path = '/assets/Audio/Cold_Box.wav';
  }else if(obj.name=="Air_Expander"){
    path = '/assets/Audio/Air_Expander.wav';
  }else if(obj.name=="Air_Filter"){
    path = '/assets/Audio/Air_Filter.wav';
  }else if(obj.name == "Air_Compressor"){
    path = '/assets/Audio/Air_Compressor.wav';
  }else if(obj.name == "Cylinder_Filling_Ramp"){
    path = '/assets/Audio/Cylinder_Filling_Ramp.wav';
  }else if(obj.name == "Liquid_Oxygen_Pump"){
    path = '/assets/Audio/Liquid_Oxygen_Pump.wav';
  }else if(obj.name == "Regeneration_Heater"){
    path = '/assets/Audio/Regeneration_Heater.wav';
  }

  if(path!=""){
    if(sound.isPlaying){
      sound.stop();
    }
      audioLoader.load(path,function(buffer){
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.6);
      sound.play();
    });
    sound.onEnded = ()=>{

    }
  }
}

let prevIntersectObject = null;
function updateRay(controller) {

  raycaster.setFromXRController( controller1);
  
  const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(controller.matrixWorld).sub(raycaster.ray.origin).normalize();
  raycaster.ray.direction.copy(direction);

  const intersects = raycaster.intersectObjects(grp.children, true);
  if (intersects.length > 0) {
    intersectedObject = intersects[0].object;
    console.log(intersectedObject.name)
    if((prevIntersectObject==null) || (prevIntersectObject.name!=intersectedObject.name)){
      playAudio(intersectedObject);
    }
    prevIntersectObject = intersectedObject;
    
  } else {
    intersectedObject = null;
    prevIntersectObject  = null;
  }
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
  resultantVec.y = 0;
  if (!isNaN(resultantVec.x) && !isNaN(resultantVec.y) && !isNaN(resultantVec.z)) {
    collisionCapsule.position.add(resultantVec);
  } else {
    console.error("NaN detected in resultant vector:", resultantVec);
  }
}

let isStarted = false;
function handleTurn(check = true) {
  if (!isStarted && (RightController_inputX > 0 || RightController_inputX < 0)) {
    isStarted = true;
    if (isNaN(RightController_inputX) || isNaN(RightController_inputY) || isNaN(TurningSpeed)) {
      console.error("Invalid input:", RightController_inputX, RightController_inputY, TurningSpeed);
      return;
    }
    let rotationAmount = 0;

    if (RightController_inputX < 0) {
      rotationAmount = 45;
    } else {
      rotationAmount = -45;
    }
    // Apply rotation to the collision capsule
    collisionCapsule.rotateY(rotationAmount);
  } else if (RightController_inputX >= -0.1 && RightController_inputX <= 0.1) {
    isStarted = false;
  }
}

async function setupLightning(renderer, scene) {
  const loader = new RGBELoader();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  pmremGenerator.compileEquirectangularShader();

  await loader.load(
    "industrial_sunset_puresky_4k.HDR",
    (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();
      scene.environment = envMap;
      scene.environmentIntensity = 0.8;
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
