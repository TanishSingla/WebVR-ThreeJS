import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as Controller from "./controller.js";

// Variables
let scene, camera, renderer;
let capsuleHeight = 1.6;
let collisionCapsule;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let LeftController_inputY, LeftController_inputX;
const characterSpeed = 0.05;
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
  
  //orbit Controls
  if(!renderer.xr.isPresenting){
      camera.position.set( 0, 1.6, 3 );
      controls = new OrbitControls(camera,renderer.domElement)
      controls.maxZoom = 1;
      controls.update();
    }


  // Controller logic
  setupControllers();

  // Create a collision capsule for character
  const capsuleGeometry = new THREE.CapsuleGeometry(0.1, capsuleHeight, 12);
  const capsuleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
  });
  collisionCapsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
  collisionCapsule.add(camera); // Attach the camera to the collision capsule
  scene.add(collisionCapsule);
  collisionCapsule.position.set(0,0,0);
  collisionCapsule.visible = true;

  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
  scene.add(ambientLight);

  // Load the 3D model
  await loadModel();

  renderer.setAnimationLoop(render);
}

function setupControllers() {
  const controllerModelFactory = new XRControllerModelFactory();

  // Controller 1
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("connected", onController1Connected);
  scene.add(controller1);

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  // Controller 2
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("connected", onController2Connected);
  scene.add(controller2);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);
}

function onController2Connected(event) {
  controller2.userData = event.data;
}
function onController1Connected(event) {
  controller1.userData = event.data;
}

async function loadModel() {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync("Oxygenation.glb");
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
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

function handleControllerInput(controller) {
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
        LeftController_inputX =  controller.userData.gamepad.axes[2];
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

//event tick
function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  handleControllerInput(controller1);
  //   handleControllerInput(controller2);

  if (renderer.xr.isPresenting) {
    handleMovement();
    console.log(collisionCapsule.position)
    let location = collisionCapsule.position.clone(); // Clone the position to avoid direct modification
    camera.position
      .copy(location)
      .add(new THREE.Vector3(0, capsuleHeight / 2, 0));
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

if (isNaN(LeftController_inputX) || isNaN(LeftController_inputY) || isNaN(characterSpeed)) {
    console.error('Invalid input:', LeftController_inputX, LeftController_inputY, characterSpeed);
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
  if (!isNaN(resultantVec.x) && !isNaN(resultantVec.y) && !isNaN(resultantVec.z)) {
    collisionCapsule.position.add(resultantVec);
  } else {
    console.error('NaN detected in resultant vector:', resultantVec);
  }

}
