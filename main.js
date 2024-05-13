import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const m2 = new THREE.MeshPhysicalMaterial({color:0xB92A0B})

const cube = new THREE.Mesh( geometry, m2 );
const directionalLight = new THREE.DirectionalLight( 0xFFF6F4,10 );
const ambientlight = new THREE.AmbientLight( 0xFFFFFF ); // soft white light
// scene.add( cube );
scene.add( ambientlight );
scene.add( directionalLight );

camera.position.z = 5;
function animate() {
    // cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
    renderer.render( scene, camera ); 
    requestAnimationFrame( animate );
}

animate();


//loading a 3d model.
const loader = new GLTFLoader();

loader.load('3DRoomBake/3DRoomBake.gltf',function(gltf){
    console.log(gltf)
    const model = gltf.scene;
    model.scale.set(0.8,0.8,0.8);
    scene.add(model)
},function(xhr){
    console.log(xhr.loaded/xhr.total*100 + "%Loaded")
},function(e){
    console.error(e);
})


const lightForModel = new THREE.DirectionalLight(0xffffff,1);
lightForModel.position.set(2,2,5);
scene.add(lightForModel);