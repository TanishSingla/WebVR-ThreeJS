import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';


// Variables
let scene, camera, renderer, controller;
let capsuleHeight = 1.6;
let collisionCapsule;

let controller1, controller2;
let controllerGrip1, controllerGrip2;

async function init() {
  scene = new THREE.Scene();

  // Set up the camera
  const fov = 75;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 50;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  //Controller related logic
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  scene.add(controller2);

  controller2.addEventListener('connected',(e)=>{
    controller2.gamepad = e.data.gamepad;
  })

function onSelectStart(){
    console.log("Button Pressed")
}

function onSelectEnd(){
    console.log("Button Released")
}

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  //create a collision sphere for character
  const CapsuleGeometry = new THREE.CapsuleGeometry(0.1, capsuleHeight, 12); // Radius 0.5\
  const CapsuleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
  });
  // const sphereMaterial = new THREE.MeshBasicMaterial({ visible: true });  // Invisible, but you can set visible to true for debugging
  collisionCapsule = new THREE.Mesh(CapsuleGeometry, CapsuleMaterial);
  collisionCapsule.add(camera); // Attach the camera to the collision sphere
  scene.add(collisionCapsule);
  collisionCapsule.visible = true;

  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
  scene.add(ambientLight);

  // Load the 3D model
  await loadModel();

  // Add VR controller
  controller = renderer.xr.getController(0);
  scene.add(controller);

  renderer.setAnimationLoop(render);
}

//function for loading 3d model.
async function loadModel() {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync("Oxygenation.glb");
    const model = gltf.scene;

    // Adjust model scale and position
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0); // Adjust the position as needed
    console.log("Model loaded:", model);

    // Add the model to the scene
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

// function for checking collision
function checkCollisions() {
  const originPoint = collisionSphere.position.clone();

  for (const vertexIndex of collisionSphere.geometry.vertices) {
    const localVertex = vertexIndex.clone();
    const globalVertex = localVertex.applyMatrix4(collisionSphere.matrix);
    const directionVector = globalVertex.sub(collisionSphere.position);

    const ray = new THREE.Raycaster(
      originPoint,
      directionVector.clone().normalize()
    );
    const collisionResults = ray.intersectObjects(collidableMeshList);
    if (
      collisionResults.length > 0 &&
      collisionResults[0].distance < directionVector.length()
    ) {
      console.log("Collision detected");
      // Handle collision here, e.g., stop movement, back up camera, etc.
      break;
    }
  }
}

function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  let location = collisionCapsule.position.clone(); // Clone the position to avoid direct modification
  camera.position
    .copy(location)
    .add(new THREE.Vector3(0, capsuleHeight / 2, 0)); // Add the (0, 0.8, 0) offset to the camera position

// console.log(controller1)
  renderer.render(scene, camera);

//   handleControllerInput(controller2);
// console.log(renderer.xr.isPresenting)
}

init();



function handleControllerInput(controller) {
    // if(renderer.xr.isPresenting)
    console.log(controller.gamepad  )
    if (!controller || !controller.gamepad) return;
    console.log("222")

    const thumbstick = controller.gamepad.axes;
    console.log(thumbstick)  
     
}