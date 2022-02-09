import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const COLORS = {
  BLUE: 0x000088,
  RED: 0x880000,
  GREEN: 0x008800,
  WHITE: 0xffffff,
  LIGHTEST_GREY: 0xdadada,
  LIGHT_GREY: 0x888888,
  DARK_GREY: 0x0f0f0f,
  BLACK: 0x000000
};

const container: HTMLElement = document.createElement("div");
document.body.appendChild(container);

const params = {
  projection: "normal",
  autoRotate: true,
  reflectivity: 1,
  background: false,
  exposure: 2,
  gemColor: "Black"
};

let camera: THREE.Camera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let gemBackMaterial: THREE.MeshPhysicalMaterial;
let gemFrontMaterial: THREE.MeshPhysicalMaterial;
let hdrCubeRenderTarget;
let background;

const objects: any[] = [];

const generateBackground = () => {
  const backgroundScene = new THREE.Scene();
  backgroundScene.background = new THREE.Color(COLORS.WHITE);

  // const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
  const cubeGeometry = new THREE.SphereGeometry(5, 32, 32);
  const cubeMaterial = new THREE.MeshNormalMaterial({ side: THREE.BackSide });

  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

  backgroundScene.add(cube);

  const backgroundLight = new THREE.AmbientLight(0xffffff, 1);
  backgroundScene.add(backgroundLight);

  const backgroundCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  //backgroundCamera.position.set(0, 0, 1);
  backgroundCamera.position.set(0, 0, 8);

  const backgroundRenderTarget = new THREE.WebGLRenderTarget(512, 512);

  return {
    target: backgroundRenderTarget,
    camera: backgroundCamera,
    scene: backgroundScene
  };
};

init();
animate();

function init() {
  background = generateBackground();

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, -10, 20 * 3.5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.LIGHTEST_GREY);

  renderer = new THREE.WebGLRenderer({ antialias: true });

  const gemMaterialDefaults = {
    map: null,
    color: 0x0000ff,
    roughness: 0,
    transparent: true,
    premultipliedAlpha: true
  };

  gemBackMaterial = new THREE.MeshPhysicalMaterial({
    ...gemMaterialDefaults,
    metalness: 1,
    opacity: 0.5,
    side: THREE.BackSide,
    envMapIntensity: 5
    // TODO: Add custom blend mode that modulates background color by this materials color.
  });

  gemFrontMaterial = new THREE.MeshPhysicalMaterial({
    ...gemMaterialDefaults,
    metalness: 0,
    opacity: 0.25,
    side: THREE.FrontSide,
    envMapIntensity: 10
  });

  const manager = new THREE.LoadingManager();
  manager.onProgress = (item, loaded, total) =>
    console.log(item, loaded, total);

  const loader = new OBJLoader(manager);
  loader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/obj/emerald.obj",
    (object) => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = gemBackMaterial;
          const second = child.clone();
          second.material = gemFrontMaterial;

          const parent = new THREE.Group();
          parent.add(second);
          parent.add(child);
          scene.add(parent);

          objects.push(parent);
        }
      });
    }
  );

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const texture = background.target.texture;
  texture.mapping = THREE.CubeReflectionMapping;

  gemBackMaterial.envMap = texture;
  gemFrontMaterial.envMap = texture;
  /*
   */

  new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    //.setPath("textures/equirectangular/")
    .setPath(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/"
    )
    .load("royal_esplanade_1k.hdr", (hdrEquirect) => {
      hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
      //hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrEquirect);
      pmremGenerator.dispose();

      gemFrontMaterial.envMap = hdrCubeRenderTarget.texture;
      gemBackMaterial.envMap = hdrCubeRenderTarget.texture;
      /*
       */

      gemFrontMaterial.needsUpdate = gemBackMaterial.needsUpdate = true;

      hdrEquirect.dispose();
    });

  // Lights

  scene.add(new THREE.AmbientLight(0x222222));

  const pointLight1 = new THREE.PointLight(COLORS.WHITE);
  pointLight1.position.set(150, 10, 0);
  pointLight1.castShadow = false;
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(COLORS.WHITE);
  pointLight2.position.set(-150, 0, 0);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(COLORS.WHITE);
  pointLight3.position.set(0, -10, -150);
  scene.add(pointLight3);

  const pointLight4 = new THREE.PointLight(COLORS.WHITE);
  pointLight4.position.set(0, 0, 150);
  scene.add(pointLight4);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  renderer.outputEncoding = THREE.sRGBEncoding;

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    // new THREE.MeshBasicMaterial({ map: background.texture })
    // new THREE.MeshNormalMaterial()
    new THREE.MeshPhongMaterial({ map: background.target.texture })
  );

  // scene.add(cube);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 20;
  controls.maxDistance = 200;

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

//

function animate() {
  window.requestAnimationFrame(animate);
  background.scene.children[0].rotation.x += 0.005;
  background.scene.children[0].rotation.y += 0.01;
  render();
}

function render() {
  if (gemBackMaterial && gemFrontMaterial) {
    gemFrontMaterial.reflectivity = params.reflectivity;
    gemBackMaterial.reflectivity = params.reflectivity;

    let newColor = gemBackMaterial.color;
    switch (params.gemColor) {
      case "Blue":
        newColor = new THREE.Color(COLORS.BLUE);
        break;
      case "Red":
        newColor = new THREE.Color(COLORS.RED);
        break;
      case "Green":
        newColor = new THREE.Color(COLORS.GREEN);
        break;
      case "White":
        newColor = new THREE.Color(COLORS.LIGHT_GREY);
        break;
      case "Black":
        newColor = new THREE.Color(COLORS.DARK_GREY);
        break;
    }

    gemBackMaterial.color = newColor;
    gemFrontMaterial.color = newColor;
  }

  renderer.toneMappingExposure = params.exposure;

  camera.lookAt(scene.position);

  if (params.autoRotate) {
    for (let i = 0, l = objects.length; i < l; i++) {
      const object = objects[i];
      object.rotation.y += 0.005;
    }
  }

  renderer.setRenderTarget(background.target);
  renderer.render(background.scene, background.camera);

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}
