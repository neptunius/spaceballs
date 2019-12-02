let scene, renderer, camera, directionalLight;
let raycaster, mouse, intersectedShape;
let animating = true;
let canvas = document.getElementById("canvas");
let width = window.innerWidth;
let height = window.innerHeight;
let depth = (width + height) / 2;
let boundingBox = {};
let minSize = 10;
let maxSize = 80;
let numShapes = Math.floor(width * height / 10000);
let shapes = [];

// CREATE BOUNDING BOX
function initBoundingBox() {
  // Update dimensions
  width = window.innerWidth;
  height = window.innerHeight;
  depth = (width + height) / 2;
  // Update bounding box
  boundingBox = {
    right: width / 2,
    left: -width / 2,
    top: height / 2,
    bottom: -height / 2,
    front: depth / 2,
    back: -depth / 2,
  };
}

// SET UP RENDERER
function initRenderer() {
  // Raycaster allows us to interact with the mouse
  raycaster = new THREE.Raycaster();
  // Initialize renderer with the canvas DOM element
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  // Set renderer dimensions
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
}

// SET UP LIGHTS AND CAMERA
function initLightsCamera() {
  // Add ambient and directional light to the scene
  let ambientLight = new THREE.AmbientLight('#ffffff', 0.3);
  directionalLight = new THREE.DirectionalLight('#ffffff', 1);
  scene.add(ambientLight);
  scene.add(directionalLight);
  // Set up the camera to view the scene
  camera = new THREE.OrthographicCamera();
  updateLightsCamera();
}

// UPDATE LIGHTS AND CAMERA
function updateLightsCamera() {
  // Position the directional light in the corner
  directionalLight.position.x = boundingBox.left;
  directionalLight.position.y = boundingBox.top;
  directionalLight.position.z = boundingBox.front;
  directionalLight.lookAt(scene.position);
  // Set the camera boundaries and position
  camera.left = boundingBox.left;
  camera.right = boundingBox.right;
  camera.top = boundingBox.top;
  camera.bottom = boundingBox.bottom;
  camera.near = 0;
  camera.far = depth;
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = depth / 2;
  camera.lookAt(scene.position);
  camera.updateProjectionMatrix();
}

// CREATE SHAPES
function initShapes() {
  for (let i = 0; i < numShapes; i++) {
    // Create a shape of random size
    const size = randomInt(minSize, maxSize);
    const shape = new Shape({size: size});
    shapes.push(shape);
    scene.add(shape.mesh);
  }
}

// SET UP SCENE
function initScene() {
  scene = new THREE.Scene();
  initBoundingBox();
  initRenderer();
  initLightsCamera();
  initShapes();
  initMouse();
  renderer.render(scene, camera);
}

// WINDOW RESIZE
window.addEventListener('resize', function () {
  // Update dimensions and re-render scene
  initBoundingBox();
  updateLightsCamera();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
}, false);

// ANIMATE SHAPES
function animateShapes() {
  // Animate all shapes so they move, bounce, and rotate
  for (let i = 0; i < shapes.length; i++) {
    shapes[i].animate(boundingBox);
  }
  // Collide all pairs of shapes so they bounce off each other
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      shapes[i].collide(shapes[j]);
    }
  }
}

// ANIMATE SCENE
function animateScene() {
  // Animate shapes
  animateShapes();
  // Handle mouse interactions
  // handleMouse();
  // Render the scene
  renderer.render(scene, camera);
  // Loop the animation and save the request's ID
  animating = requestAnimationFrame(animateScene);
}

// SET UP MOUSE
function initMouse() {
  // Initialize mouse position
  mouse = new THREE.Vector2();
  mouse.x = 0;
  mouse.y = 0;
}

// HANDLE MOUSE MOVEMENT
document.addEventListener('mousemove', function (event) {
  event.preventDefault();
  // Translate mouse screen coordinates to 3D space coordinates
  mouse.x = (event.clientX / width) * 2 - 1;
  mouse.y = -(event.clientY / height) * 2 + 1;
}, false);

// HANDLE MOUSE CLICK
window.addEventListener('click', function () {
  if (animating) {
    // Stop animation
    cancelAnimationFrame(animating);
    animating = false;
  } else {
    // Start animation
    animateScene();
  }
  if (intersectedShape) {
    // Unfreeze the intersected shape and increase its velocity
    intersectedShape.frozen = false;
    intersectedShape.velocity.x *= 4;
    intersectedShape.velocity.y *= 4;
    intersectedShape.velocity.z *= 4;
  }
}, false);

// HANDLE MOUSE INTERACTIONS
function handleMouse() {
  // Look for mouse interactions. See https://threejs.org/examples/#webgl_interactive_cubes
  raycaster.setFromCamera(mouse, camera);
  const intersectedObjects = raycaster.intersectObjects(scene.children);
  // Check if mouse intersected any objects in the scene
  if (intersectedObjects.length > 0) {
    // Check if last intersected shape is different than this one
    if (intersectedShape != intersectedObjects[0].object) {
      if (intersectedShape) {
        // Return last intersected shape to prior state
        intersectedShape.frozen = false;
        intersectedShape.material.color.setHex(intersectedShape.priorColor);
      }
      // Freeze this shape and highlight it with a different color
      intersectedShape = intersectedObjects[0].object;
      intersectedShape.frozen = true;
      intersectedShape.priorColor = intersectedShape.material.color.getHex();
      intersectedShape.material.color.setHex(0x0080ff); // 0x913599);
      canvas.style.cursor = "pointer";
    }
  } else {
    if (intersectedShape) {
      // Return last intersected shape to prior state
      intersectedShape.frozen = false;
      intersectedShape.material.color.setHex(intersectedShape.priorColor);
    }
    intersectedShape = null;
    canvas.style.cursor = "default";
  }
}

// Initialize and animate the scene
initScene();
if (animating) {
  animateScene();
}
