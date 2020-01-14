let scene, renderer, camera, directionalLight;
let raycaster, mouse, intersectedShape;
let animating = false; //true;
let canvas = document.getElementById("canvas");
let width = window.innerWidth;
let height = window.innerHeight;
let depth = (width + height) / 2;
let boundingBox = {};
let minSize = 20;
let maxSize = Math.min(width, height) / 15;
let maxSpeed = 5;
let mirrorDimensions = 2;
let numReflections = 1 << mirrorDimensions;
let numOriginals = 4;
let numShapes = numOriginals * numReflections;
// let numShapes = Math.floor(width * height / 10000);
let shapes = [];
let tubes = [];
let color = new THREE.Color(0.2, 0.4, 0.8);
const numSegments = 1;
const shapeType = 'random knot';
const pointType = 'sphere'; // 'disk';
const lineType = 'tube'; // 'plane';
const queue = [];
const queueSize = 20;
const frameDelay = 10;

// console.log("width:", width);
// console.log("height:", height);
// console.log("depth:", depth);
// console.log("maxSize:", maxSize);
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
  // console.log("boundingBox: ", boundingBox);
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
          shape: shapeType,
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
  const n = numShapes; // n balls make n/2 tubes
  const size = minSize; // 300/(n-1); // randomInt(10, 50);
  const speed = maxSpeed;
  // Create n bouncing balls in a line
  for (let i = 0; i < n; i++) {
    // Equally spaced x, y coordinates along axis within margins
    // const x = -width*3/8 + width*3/4 * i/(n-1);
    // const y = height*3/8 - height*3/4 * i/(n-1);
    // const y = height/8 - height*3/4 * i/(n-1)
    //         + (i % 8 < 4 ? 0 : height/2)
    //         - (i % 4 < 2 ? 0 : height/4)
    //         + (i % 2 < 1 ? 0 : height/4);
    // Random y coordinate within margins
    // const y = randomInt(-height/4, height/4);
    // Random x, y coordinates within the bounding box
    const x = randomInt(boundingBox.left + size, boundingBox.right - size);
    const y = randomInt(boundingBox.bottom + size, boundingBox.top - size);
    // const hasVel = i == 0 ? 1 : 0;
    const ball = new Shape({
      scene: scene,
      shape: pointType,
      size: size,
      position: new THREE.Vector3(x, y, 0),
      // velocity: new THREE.Vector3(hasVel*15, 0, 0),
      // velocity: new THREE.Vector3(0.9 * (n-i-1), 0, 0),
      velocity: new THREE.Vector3(randomInt(-speed, speed), randomInt(-speed, speed), 0),
      rotation: new THREE.Vector3(0, 0, 0), // randomVector3(),
      color: color,
      material: 'phong',
    });
    // console.log("position:", shape.mesh.position);
    shapes.push(ball);
    scene.add(ball.mesh);
  }
  console.log('shapes:', shapes);
  animateShapes();
}

// CREATE TUBES
function initTubes() {
  // Create n/2 cylindrical tubes connecting two shapes
  for (let i = 0; i < shapes.length/2; i++) {
    // Calculate midpoint of first two shapes
    const size = shapes[2*i].size;
    const posA = shapes[2*i].initPosition;
    const posB = shapes[2*i+1].initPosition;
    const midpoint = posA.clone().add(posB).multiplyScalar(0.5);
    const diff = posB.clone().sub(posA);
    const length = diff.length();
    // Calculate angle of rotation in x-y plane using T=O/A rule
    // since tangent of angle = rise (opposite) / run (adjacent)
    // angle rotXY = arctangent of rise (diff.y) / run (diff.x)
    const rotXY = Math.PI/2 + Math.atan(diff.y / diff.x);
    const tube = new Shape({
      scene: scene,
      shape: pointType,
      size: size,
      width: size * 2,
      height: length,
      position: midpoint,
      velocity: new THREE.Vector3(0, 0, 0), // Still
      rotation: new THREE.Vector3(0, 0, rotXY), // Rotate in x-y plane
      color: color,
      material: 'phong',
    });
    // tube.recolor();
    tubes.push(tube);
    scene.add(tube.mesh);
  }
  animateTubes();
}

// CREATE SEGMENTED TUBES
function initSegmentedTubes() {
  // Create n/2 cylindrical tubes connecting two shapes
  for (let i = 0; i < shapes.length/2; i++) {
    const size = shapes[2*i].size;
    const posA = shapes[2*i].initPosition;
    const posB = shapes[2*i+1].initPosition;
    // Calculate midpoint of first two shapes
    // const midpoint = posA.clone().add(posB).multiplyScalar(0.5);
    // Calculate vector between first two shapes
    const diff = posB.clone().sub(posA);
    // Calculate angle of rotation in x-y plane using T=O/A rule
    // since tangent of angle = rise (opposite) / run (adjacent)
    // angle rotXY = arctangent of rise (diff.y) / run (diff.x)
    const rotXY = Math.PI/2 + Math.atan(diff.y / diff.x);
    // Length of this segment along central column of tube
    const length = diff.length() / numSegments;
    // Vector along central column scaled by ratio of whole tube
    const axis = diff.clone().multiplyScalar(1 / numSegments);
    const basis = posA.clone().add(axis.clone().multiplyScalar(0.5));
    const segments = [];
    for (let j = 0; j < numSegments; j++) {
      const position = axis.clone().multiplyScalar(j).add(basis);
      const tube = new Shape({
        scene: scene,
        shape: lineType,
        size: size,
        width: size * 2,
        height: length,
        position: position,
        velocity: new THREE.Vector3(0, 0, 0), // Still
        rotation: new THREE.Vector3(0, 0, rotXY), // Rotate in x-y plane
        color: color,
        material: 'phong',
      });
      // tube.recolor();
      segments.push(tube);
      scene.add(tube.mesh);
    }
    tubes.push(segments);
  }
  animateSegmentedTubes();
}

// SET UP SCENE
function initScene() {
  scene = new THREE.Scene();
  initBoundingBox();
  initRenderer();
  initLightsCamera();
  // initShapes();
  initBalls();
  // initTubes();
  initSegmentedTubes();
  initMouse();
  renderer.render(scene, camera);
}

// ANIMATE SCENE
function animateScene() {
  // updateQueue();
  updateColor();
  // Animate shapes
  animateShapes();
  // animateTubes();
  animateSegmentedTubes();
  // Handle mouse interactions
  // handleMouse();
  // Render the scene
  renderer.render(scene, camera);
  // Loop the animation and save the request's ID
  animating = requestAnimationFrame(animateScene);
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
  console.log('shapes:', shapes);
  const n = Math.min(numOriginals, shapes.length);
  // Animate the original shapes so they move, bounce and rotate
  for (let i = 0; i < n; i++) {
    shapes[i].animate(boundingBox);
    // shapes[i].recolor();
    shapes[i].setColor(color);
  }
  // Animate the other shapes so they mirror the first two shapes
  for (let i = n; i < shapes.length; i++) {
    // Calculate mirrored position of corresponding first shape
    const pos = shapes[i % numOriginals].mesh.position;
    const mirrorX = i % 4 < 2 ? 1 : -1;
    const mirrorY = i % 8 < 4 ? 1 : -1;
    const mirrorZ = i % 16 < 8 ? 1 : -1;
    const mirroredPos = new THREE.Vector3(mirrorX*pos.x, mirrorY*pos.y, mirrorZ*pos.z);
    // Adjust shape's position and recolor
    shapes[i].moveTo(mirroredPos);
    // shapes[i].recolor();
    shapes[i].setColor(color);
  }
  return; // No collisions
  // Collide all pairs of shapes so they bounce off each other
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      shapes[i].collide(shapes[j]);
    }
  }
}

// ANIMATE TUBES
function animateTubes() {
  // let numReflections = 1 << mirrorDimensions;
  // let numOriginals = 3;
  // let numShapes = numOriginals * numReflections;
  // const n = Math.min(numOriginals, shapes.length);

  for (let i = 0; i < tubes.length; i++) {
    // Ensure this tube has two corresponding shapes
    if (2*i+1 < shapes.length) {
      // Calculate midpoint of first two shapes
      const posA = shapes[2*i].mesh.position;
      const posB = shapes[2*i+1].mesh.position;
      const midpoint = posA.clone().add(posB).multiplyScalar(0.5);
      const diff = posA.clone().sub(posB);
      const length = diff.length();
      // Calculate angle of rotation in x-y plane using T=O/A rule
      // since tangent of angle = rise (opposite) / run (adjacent)
      // angle rotXY = arctangent of rise (diff.y) / run (diff.x)
      const rotXY = Math.PI/2 + Math.atan(diff.y / diff.x);
      const tube = tubes[i];
      // tube.moveTo(midpoint);
      tube.mesh.position.x = midpoint.x;
      tube.mesh.position.y = midpoint.y;
      tube.mesh.position.z = midpoint.z;
      tube.mesh.rotation.z = rotXY;
      // Scale along x dimension to stretch the tube's length
      tube.mesh.scale.y = length/tube.height;
      // tube.recolor();
      tube.setColor(color);
    }
  }
}

// ANIMATE SEGMENTED TUBES
function animateSegmentedTubes() {
  for (let i = 0; i < tubes.length; i++) {
    // Ensure this tube has two corresponding shapes
    if (2*i+1 < shapes.length) {
      // Calculate midpoint of first two shapes
      const posA = shapes[2*i].mesh.position;
      const posB = shapes[2*i+1].mesh.position;
      const midpoint = posA.clone().add(posB).multiplyScalar(0.5);
      const diff = posA.clone().sub(posB);
      // Calculate angle of rotation in x-y plane using T=O/A rule
      // since tangent of angle = rise (opposite) / run (adjacent)
      // angle rotXY = arctangent of rise (diff.y) / run (diff.x)
      const rotXY = Math.PI/2 + Math.atan(diff.y / diff.x);
      let segments;
      if (tubes[i] instanceof Shape) {
        segments = [tubes[i]];
      } else if (tubes[i] instanceof Array) {
        segments = tubes[i];
      }
      const length = diff.length() / numSegments;
      const axis = diff.clone().multiplyScalar(1 / numSegments);
      const basis = posB.clone().add(axis.clone().multiplyScalar(0.5));
      for (let j = 0; j < numSegments; j++) {
        const position = axis.clone().multiplyScalar(j).add(basis);
        const tube = segments[j];
        // tube.moveTo(position);
        tube.mesh.position.x = position.x;
        tube.mesh.position.y = position.y;
        tube.mesh.position.z = position.z;
        tube.mesh.rotation.z = rotXY;
        // Scale along x dimension to stretch the tube's length
        tube.mesh.scale.y = length/tube.height;
        // tube.recolor();
        tube.setColor(color);
      }
    }
  }
}

// UPDATE QUEUE OF BALLS AND TUBES
function updateQueue() {
  if (animating % frameDelay != 0)
    return;
  // Copy all shapes
  const shapeCopies = [];
  for (let i = 0; i < shapes.length; i++) {
    // break;
    const shapeCopy = shapes[i].clone();
    scene.add(shapeCopy.mesh);
    shapeCopies.push(shapeCopy);
  }
  // Copy all tubes
  for (let i = 0; i < tubes.length; i++) {
    // break;
    if (tubes[i] instanceof Shape) {
      const tubeCopy = tubes[i].clone();
      tubeCopy.mesh.rotation.z = tubes[i].mesh.rotation.z;
      scene.add(tubeCopy.mesh);
      shapeCopies.push(tubeCopy);
    } else if (tubes[i] instanceof Array) {
      for (let j = 0; j < tubes[i].length; j++) {
        const tubeCopy = tubes[i][j].clone();
        tubeCopy.mesh.rotation.z = tubes[i][j].mesh.rotation.z;
        scene.add(tubeCopy.mesh);
        shapeCopies.push(tubeCopy);
      }
    }
  }
  // Push shape and tube copies
  queue.push(shapeCopies);
  // Pop old shapes and tubes
  if (queue.length > queueSize) {
    const oldShapes = queue.shift();
    for (let i = 0; i < oldShapes.length; i++) {
      // console.log(oldShapes[i]);
      scene.remove(oldShapes[i].mesh);
    }
  }
}

function updateColor() {
  // Advance hue to the next HSL color
  const hue = 255 - (animating % 255);
  color = new THREE.Color("hsl(" + hue + ", 100%, 50%)");
  // Generate a random color
  // const r = randomFloat(0, 1);
  // const g = randomFloat(0, 1);
  // const b = randomFloat(0, 1);
  // color = new THREE.Color(r, g, b);
  // Generate 2 random colors
  // const colors = randomColor({
  //   count: 2,
  //   hue: 'random',
  //   luminosity: 'dark',
  // });
  // color = colors[0];
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
