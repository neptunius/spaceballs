let scene, renderer, camera, directionalLight;
let raycaster, mouse, intersectedShape;
let animating = false; //true;
let canvas = document.getElementById("canvas");
let width = window.innerWidth;
let height = window.innerHeight;
let depth = (width + height) / 2;
let boundingBox = {};
let minSize = 10;
let maxSize = Math.min(width, height) / 15;
let numShapes = Math.floor(width * height / 10000);
let shapes = [];
let tubes = [];

console.log("width:", width);
console.log("height:", height);
console.log("depth:", depth);
console.log("maxSize:", maxSize);
console.log("numShapes:", numShapes);

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
  console.log("boundingBox: ", boundingBox);
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
  // 3D lattice of shapes inside bounding box
  // const rows = numShapes/12, cols = numShapes/rows;//, tabs = 8;
  const rows = 4, cols = 6, tabs = 5;
  const rowSize = height/rows/2, colSize = width/cols/2, tabSize = depth/tabs/2;
  numShapes = rows * cols * tabs;
  console.log("rows:", rows, "rowSize:", rowSize);
  console.log("cols:", cols, "colSize:", colSize);
  console.log("tabs:", tabs, "tabSize:", tabSize);
  for (let row = 1-rows; row < rows; row += 2) {
    for (let col = 1-cols; col < cols; col += 2) {
      for (let tab = 1-tabs; tab < tabs; tab += 2) {
        // Create a shape of random size
        // const size = randomInt(minSize, maxSize);
        // tab:  1-tabs  --  0  --  tabs-1
        // size: minSize -- avg -- maxSize
        // (tab + tabs) / 2*tabs
        const shape = new Shape({
          scene: scene,
          shape: 'random knot', // 'sphere',
          p: (row+1 + rows),
          q: (col+1 + cols),
          // size based on depth, small close and large far
          size: maxSize * (1-tab + tabs) / (2 * tabs),
          // position based on column, row, and table like a lattice
          position: new THREE.Vector3(col * colSize, row * rowSize, tab * tabSize).add(randomVector3(-50, 50)),
          // rotation: randomVector3(), // new THREE.Vector3(),
          color: new THREE.Color(
            (col + cols)/(2 * cols),
            (row + rows)/(2 * rows),
            (tab + tabs)/(2 * tabs),
          )
        });
        // console.log("position:", shape.mesh.position);
        shapes.push(shape);
        scene.add(shape.mesh);
      }
    }
  }
}

// CREATE BALLS
function initBalls() {
  const n = 8; // 8 balls make 4 tubes
  const size = 40; // 300/(n-1); // randomInt(10, 50);
  const speed = 6;
  // Create n bouncing balls in a line
  for (let i = 0; i < n; i++) {
    // Equally spaced x, y coordinates along a width within margins
    const x = -width*3/8 + width*3/4 * i/(n-1);
    // const y = height*3/8 - height*3/4 * i/(n-1);
    const y = height/8 - height*3/4 * i/(n-1)
            + (i % 8 < 4 ? 0 : height/2)
            - (i % 4 < 2 ? 0 : height/4)
            + (i % 2 < 1 ? 0 : height/4);
    // Random y coordinate within margins
    // const y = randomInt(-height/4, height/4);
    // Random x, y coordinates within the bounding box
    // const x = randomInt(boundingBox.left + size, boundingBox.right - size);
    // const y = randomInt(boundingBox.bottom + size, boundingBox.top - size);
    // const hasVel = i == 0 ? 1 : 0;
    const shape = new Shape({
      scene: scene,
      shape: 'sphere', // 'disk',
      size: size,
      position: new THREE.Vector3(x, y, 0),
      // velocity: new THREE.Vector3(hasVel*15, 0, 0),
      // velocity: new THREE.Vector3(0.9 * (n-i-1), 0, 0),
      velocity: new THREE.Vector3(randomInt(-speed, speed), randomInt(-speed, speed), 0),
      rotation: new THREE.Vector3(0, 0, 0), // randomVector3(),
      // color: new THREE.Color(r, g, b),
      material: 'phong',
    });
    // console.log("position:", shape.mesh.position);
    shapes.push(shape);
    scene.add(shape.mesh);
  }
  animateShapes();
}

// CREATE TUBES
function initTubes() {
  // Create n/2 cylindrical tubes connecting two shapes
  for (let i = 0; i < shapes.length/2; i++) {
    // Calculate midpoint of first two shapes
    const posA = shapes[2*i].initPosition;
    const posB = shapes[2*i+1].initPosition;
    const midpoint = posA.clone().add(posB).multiplyScalar(0.5);
    const diff = posA.clone().sub(posB);
    const dist = diff.length();
    // Calculate angle of rotation in x-y plane using T=O/A rule
    // since tangent of angle = rise (opposite) / run (adjacent)
    // angle rotXY = arctangent of rise (diff.y) / run (diff.x)
    const rotXY = Math.PI/2 + Math.atan(diff.y / diff.x);
    const tube = new Shape({
      scene: scene,
      shape: 'cylinder', // 'plane',
      size: 40,
      width: 80,
      height: dist,
      position: midpoint,
      velocity: new THREE.Vector3(0, 0, 0), // Still
      rotation: new THREE.Vector3(0, 0, rotXY), // Rotate in X-Y plane
      // color: new THREE.Color(r, g, b),
      material: 'phong',
    });
    tube.recolor();
    tubes.push(tube);
    scene.add(tube.mesh);
  }
  animateTubes();
}

// SET UP SCENE
function initScene() {
  scene = new THREE.Scene();
  initBoundingBox();
  initRenderer();
  initLightsCamera();
  // initShapes();
  initBalls();
  initTubes();
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
  const n = Math.min(2, shapes.length);
  // Animate the first two shapes so they move, bounce and rotate
  for (let i = 0; i < n; i++) {
    shapes[i].animate(boundingBox);
  }
  // Animate the other shapes so they mirror the first two shapes
  for (let i = n; i < shapes.length; i++) {
    // Calculate mirrored position of corresponding first shape
    const pos = shapes[i % 2].mesh.position;
    const mirrorX = i % 4 < 2 ? 1 : -1;
    const mirrorY = i % 8 < 4 ? 1 : -1;
    const mirroredPos = new THREE.Vector3(mirrorX*pos.x, mirrorY*pos.y, pos.z);
    // Adjust shape's position and recolor
    shapes[i].moveTo(mirroredPos);
    shapes[i].recolor();
  }
  // return; // No collisions
  // Collide all pairs of shapes so they bounce off each other
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      shapes[i].collide(shapes[j]);
    }
  }
}

// ANIMATE TUBES
function animateTubes() {
  for (let i = 0; i < tubes.length; i++) {
    // Ensure this tube has two corresponding shapes
    if (2*i+1 < shapes.length) {
      // Calculate midpoint of first two shapes
      const posA = shapes[2*i].mesh.position;
      const posB = shapes[2*i+1].mesh.position;
      const midpoint = posA.clone().add(posB).multiplyScalar(0.5);
      const diff = posA.clone().sub(posB);
      const dist = diff.length();
      tubes[i].mesh.position.x = midpoint.x;
      tubes[i].mesh.position.y = midpoint.y;
      tubes[i].mesh.position.z = midpoint.z;
      tubes[i].mesh.height = dist;
      // Calculate angle of rotation in x-y plane using T=O/A rule
      // since tangent of angle = rise (opposite) / run (adjacent)
      // angle rotXY = arctangent of rise (diff.y) / run (diff.x)
      const rotXY = Math.PI/2 + Math.atan(diff.y / diff.x);
      tubes[i].mesh.rotation.z = rotXY;
      // Scale along x dimension to stretch the tube's length
      tubes[i].mesh.scale.y = dist/tubes[i].height;
      tubes[i].recolor();
    }
  }
}

// ANIMATE SCENE
function animateScene() {
  // Animate shapes
  animateShapes();
  animateTubes();
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
// document.addEventListener('mousemove', function (event) {
//   event.preventDefault();
//   // Translate mouse screen coordinates to 3D space coordinates
//   mouse.x = (event.clientX / width) * 2 - 1;
//   mouse.y = -(event.clientY / height) * 2 + 1;
// }, false);

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
      if (!intersectedObjects[0].object instanceof Shape)
        return;
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
