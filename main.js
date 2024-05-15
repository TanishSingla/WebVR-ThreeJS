import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";

// const scene = new THREE.Scene();

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
// document.body.appendChild( renderer.domElement );

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// // const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const m2 = new THREE.MeshPhysicalMaterial({color:0xB92A0B})

// const cube = new THREE.Mesh( geometry, m2 );
// const directionalLight = new THREE.DirectionalLight( 0xFFF6F4,10 );
// const ambientlight = new THREE.AmbientLight( 0xFFFFFF ); // soft white light
// // scene.add( cube );
// scene.add( ambientlight );
// scene.add( directionalLight );

// camera.position.z = 5;
// function animate() {
//     // cube.rotation.x += 0.01;
// 	// cube.rotation.y += 0.01;
//     renderer.render( scene, camera );
//     requestAnimationFrame( animate );
// }

// animate();

// //loading a 3d model.
// const loader = new GLTFLoader();

// loader.load('3DRoomBake/3DRoomBake.gltf',function(gltf){
//     console.log(gltf)
//     const model = gltf.scene;
//     model.scale.set(0.8,0.8,0.8);
//     scene.add(model)
// },function(xhr){
//     console.log(xhr.loaded/xhr.total*100 + "%Loaded")
// },function(e){
//     console.error(e);
// })	

// const controls = new OrbitControls(camera,renderer.domElement)

// const lightForModel = new THREE.DirectionalLight(0xffffff,1);
// lightForModel.position.set(2,2,5);
// scene.add(lightForModel);

// VR Related
// document.body.appendChild( VRButton.createButton( renderer ) );
// renderer.xr.enabled = true;

// renderer.setAnimationLoop( function () {

// 	renderer.render( scene, camera );

// } );

const scene = new THREE.Scene();

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 50;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 1.6, 0);

  
    const loader = new THREE.CubeTextureLoader();
  
    const color = 0xffffff;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance( geometry, color, x ) {

  	const material = new THREE.MeshPhongMaterial( { color } );

  	const cube = new THREE.Mesh( geometry, material );
  	scene.add( cube );

  	cube.position.x = x;
  	cube.position.y = 1.6;
  	cube.position.z = - 2;

  	return cube;

  }

  const cubes = [
  	makeInstance( geometry, 0x44aa88, 0 ),
  	makeInstance( geometry, 0x8844aa, - 2 ),
  	makeInstance( geometry, 0xaa8844, 2 ),
  ];

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    cubes.forEach( ( cube, ndx ) => {

    	const speed = 1 + ndx * .1;
    	const rot = time * speed;
    	cube.rotation.x = rot;
    	cube.rotation.y = rot;

    } );

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(render);
}

main();

// //loading a 3d model.
// const loader = new GLTFLoader();

// loader.load(
//   "3DRoomBake/3DRoomBake.gltf",
//   function (gltf) {
//     console.log(gltf);
//     const model = gltf.scene;
//     model.scale.set(0.8, 0.8, 0.8);
//     scene.add(model);
//   },
//   function (xhr) {
//     console.log((xhr.loaded / xhr.total) * 100 + "%Loaded");
//   },
//   function (e) {
//     console.error(e);
//   }
// );

// const lightForModel = new THREE.DirectionalLight(0xffffff, 1);
// lightForModel.position.set(2, 2, 5);
// scene.add(lightForModel);
