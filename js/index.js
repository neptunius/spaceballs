let scene, camera, raycaster, renderer, directionalLight, cubeArray, wallArray;
let width = window.innerWidth;
let height = window.innerHeight;
let minSize = 10;
let maxSize = 80;
let maxVelocity = 1;
const cameraZ = 500;
const cubeQuantity = Math.floor(width / 15);

let spawnArea = {
  left: width / -2,
  right: width / 2,
  bottom: height / -2,
  top: height / 2,
  far: cameraZ - maxSize,
  near: -(cameraZ - maxSize)
}

// WINDOW RESIZE
window.addEventListener('resize', function () {
  width = window.innerWidth;
  height = window.innerHeight;

  spawnArea.left = width / -2;
  spawnArea.right = width / 2;
  spawnArea.bottom = height / -2;
  spawnArea.top = height / 2;

  directionalLight.position.x = spawnArea.left;
  directionalLight.position.y = spawnArea.top;

  camera.left = spawnArea.left;
  camera.right = spawnArea.right;
  camera.top = spawnArea.top;
  camera.bottom = spawnArea.bottom;

  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}, false);

// MOUSE CLICK
window.addEventListener('click', function () {
  if (INTERSECTED) {
    INTERSECTED.stayInPlace = false; // true;
    // INTERSECTED.gravity = true
    // INTERSECTED.reroll();
  }
}, false);

// MOUSE MOVE
document.addEventListener('mousemove', function (e) {
  e.preventDefault();
  mouse.x = (e.clientX / width) * 2 - 1;
  mouse.y = -(e.clientY / height) * 2 + 1;
}, false);

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

class Cube {
  constructor() {

    this.build = function (args) {
      args = args || {};
      this.size = args.size || randomInt(this.minSize, this.maxSize);
      // Cube mesh geometric properties
      this.cube.scale.x = this.size / 10;
      this.cube.scale.y = this.size / 10;
      this.cube.scale.z = this.size / 10;
      this.cube.position.x = args.posX || randomInt(spawnArea.left - maxSize, spawnArea.right + maxSize);
      this.cube.position.y = args.posY || randomInt(spawnArea.bottom - maxSize, spawnArea.top + maxSize);
      this.cube.position.z = args.posZ || randomInt(spawnArea.far, spawnArea.near);
      this.cube.rotation.x = args.rotX || randomInt(0, 360);
      this.cube.rotation.y = args.rotY || randomInt(0, 360);
      this.cube.rotation.z = args.rotZ || randomInt(0, 360);
      // Rotational velocity
      this.rotation = new THREE.Vector3(randomFloat(-.02, .02), randomFloat(-.02, .02), randomFloat(-.02, .02));
      // Translational velocity
      this.velocity = new THREE.Vector3(randomFloat(-5, 5), randomFloat(-5, 5), 0);
      // Larger cubes have higher friction and move slower
      this.friction = 1 + this.size / 50;
      this.cube.gravity = false;
    };

    this.init = function (args) {
      args = args || {};
      this.minSize = args.minSize || 10;
      this.maxSize = args.maxSize || 10;
      let scale = 0.2; // maxSize / 8;
      this.geometry = new THREE.SphereBufferGeometry(75 * scale / 2, 20, 10);
      // this.geometry = new THREE.BoxBufferGeometry(10, 10, 10);
      // this.geometry = new THREE.IcosahedronBufferGeometry(maxSize / 8, 1); // radius, ?
      // this.geometry = createShapeGeometry(6, maxSize / 2); // n, circumradius

      // Next 12 geometries from https://threejs.org/examples/#webgl_geometries
      // this.geometries = [];
      // this.geometries.push(new THREE.SphereBufferGeometry(75 * scale / 2, 20, 10)); // sphere/ball
      // this.geometries.push(new THREE.IcosahedronBufferGeometry(75 * scale / 2, 1)); // icosahedron/bumpy sphere
      // this.geometries.push(new THREE.OctahedronBufferGeometry(75 * scale / 2, 2)); // octahedron/bumpy sphere
      // this.geometries.push(new THREE.TetrahedronBufferGeometry(75 * scale, 0)); // tetrahedron/pyramid
      // this.geometries.push(new THREE.PlaneBufferGeometry(100 * scale, 100 * scale, 4, 4)); // plane/rectangle
      // this.geometries.push(new THREE.BoxBufferGeometry(100 * scale / 2, 100 * scale / 2, 100 * scale / 2, 4, 4, 4)); // cube/box
      // this.geometries.push(new THREE.CircleBufferGeometry(50 * scale, 20, 0, Math.PI * 2)); // circle/disk
      // this.geometries.push(new THREE.RingBufferGeometry(10 * scale, 50 * scale, 20, 5, 0, Math.PI * 2)); // ring/record
      // this.geometries.push(new THREE.CylinderBufferGeometry(20 * scale, 20 * scale, 80 * scale, 40, 5)); // cylinder/tube
      // var points = []; // points for LatheBufferGeometry
      // for (var i = 0; i < 50; i++) {
      //   points.push(new THREE.Vector2(Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 * scale + 50 * scale, (i - 5) * 2));
      // }
      // this.geometries.push(new THREE.LatheBufferGeometry(points, 20)); // lathe/vase
      // this.geometries.push(new THREE.TorusBufferGeometry(40 * scale, 15 * scale, 20, 20)); // torus/doughnut
      // this.geometries.push(new THREE.TorusKnotBufferGeometry(50 * scale, 10 * scale, 50, 20)); // knot/pretzel
      //
      // let pick = randomInt(1, this.geometries.length);
      // this.geometry = this.geometries[pick-1];

      const cubeColors = randomColor({
        count: 2,
        hue: 'random',
        luminosity: 'dark'
      });

      this.material = new THREE.MeshLambertMaterial({
        color: args.color || cubeColors[0],
        emissive: cubeColors[1]
      });

      this.cube = new THREE.Mesh(this.geometry, this.material);
      this.cube.stayInPlace = false; // initial movement
      this.build(args);
      scene.add(this.cube);
    };

    this.reroll = function () {
      // Mulligan the shape (reroll geometry)
      let pick = randomInt(1, this.geometries.length);
      this.geometry = this.geometries[pick - 1];
    };

    this.recolor = function () {
      // Position-based RGB color
      let color;
      let pn = this.cube.position.clone().normalize();
      let offset = new THREE.Vector3(1, 1, 1).multiplyScalar(-0.4);
      // pn = pn.sub(offset).normalize();
      pn = pn.multiplyScalar(0.5);
      pn = pn.sub(offset);
      color = new THREE.Color(pn.x, pn.y, pn.z);

      // Direction-based RGB color
      // let vn = this.velocity.clone().normalize();
      // vn = vn.multiplyScalar(0.5);
      // vn = vn.sub(offset);
      // color = new THREE.Color(vn.x, vn.y, vn.z);

      // Speed-based color
      // let speed = this.velocity.length();
      // let speedLimit = 10;
      // let speedClamped = Math.min(speed, speedLimit) / speedLimit;

      // Speed-based RGB color
      // let red = speedClamped;
      // let blue = (1 - speedClamped);
      // color = new THREE.Color(red, 0, blue);

      // Speed-based HSL color
      // let hue = 255 * (1 - speedClamped);
      // color = new THREE.Color("hsl("+hue+", 100%, 50%)");

      // Right-left red-blue
      // let red = (vn.x + 1) / 2;
      // let blue = (1 - red) - 0.5;
      // color = new THREE.Color(red, 0, blue);

      // Set the material's color
      this.material.color = color;

      // Set the material's emissive color to a darker shade of the same color
      // let lightColor = new THREE.Color(color.r * 2, color.g * 2, color.b * 2);
      let darkColor = new THREE.Color(color.r / 2, color.g / 2, color.b / 2);
      this.material.emissive = darkColor;
    };

    this.animate = function () {
      this.recolor();

      // Adjust rotation by rotational velocity
      this.cube.rotation.x += this.rotation.x;
      this.cube.rotation.y += this.rotation.y;
      this.cube.rotation.z += this.rotation.z;

      // Randomly perturb velocity (gettin jiggy wit it) but clamp if too fast (don't get TOO jiggy)
      this.velocity.x += (this.velocity.x < maxVelocity ? randomFloat(-0.2, 0.2) : 0);
      this.velocity.y += (this.velocity.y < maxVelocity ? randomFloat(-0.2, 0.2) : 0);

      // Axis Movement
      if (this.cube.gravity) {
        // Apply velocity with friction to make larger cubes move slower
        this.cube.position.x -= this.velocity.x * this.friction;
        this.cube.position.y -= this.velocity.y * this.friction;
        this.cube.position.z -= this.velocity.z * this.friction;
      } else if (!this.cube.stayInPlace) {
        this.cube.position.x += this.velocity.x;
        this.cube.position.y += this.velocity.y;
        this.cube.position.z += this.velocity.z;
      }

      // WRAPAROUND
      // If cube went out of bounds, move to opposite side of window
      // if (this.cube.position.y >= spawnArea.top + maxSize) { // top
      //   this.cube.position.y = spawnArea.bottom - maxSize; // bottom
      // } else if (this.cube.position.y < spawnArea.bottom - maxSize) { // bottom
      //   this.cube.position.y = spawnArea.top + maxSize; // top
      // } else if (this.cube.position.x < spawnArea.left - maxSize) { // left
      //   this.cube.position.x = spawnArea.right + maxSize; // right
      // } else if (this.cube.position.x >= spawnArea.right + maxSize) { // right
      //   this.cube.position.x = spawnArea.left - maxSize; // left
      // }

      // BOUNCE
      // If cube went out of bounds, reverse its direction
      if (this.cube.position.x - this.size/1.414 <= spawnArea.left && this.velocity.x < 0) { // left
        this.velocity.x *= -1;
      } else if (this.cube.position.x + this.size/1.414 >= spawnArea.right && this.velocity.x > 0) { // right
        this.velocity.x *= -1;
      }
      if (this.cube.position.y + this.size/1.414 >= spawnArea.top && this.velocity.y > 0) { // top
        this.velocity.y *= -1;
      } else if (this.cube.position.y - this.size/1.414 <= spawnArea.bottom && this.velocity.y < 0) { // bottom
        this.velocity.y *= -1;
      }
      if (this.cube.position.z - this.size/1.414 <= spawnArea.near && this.velocity.z < 0) { // near
        this.velocity.z *= -1;
      } else if (this.cube.position.z + this.size/1.414 >= spawnArea.far && this.velocity.z > 0) { // far
        this.velocity.z *= -1;
      }
    };
  }
}

// Create a new shape for a regular n-gon-ahedron
// Source: https://stackoverflow.com/questions/18514423/generating-a-regular-polygon-with-three-js
function createShapeGeometry(n, circumradius) {

  var shape = new THREE.Shape(),
    sides = 6,
    vertices = [],
    x;

  // Calculate the vertices of the n-gon.
  for (x = 1; x <= sides; x++) {
    vertices.push([
      circumradius * Math.sin((Math.PI / n) + (x * ((2 * Math.PI) / n))),
      circumradius * Math.cos((Math.PI / n) + (x * ((2 * Math.PI) / n)))
    ]);
  }

  // Start at the last vertex.
  shape.moveTo.apply(shape, vertices[sides - 1]);

  // Connect each vertex to the next in sequential order.
  for (x = 0; x < n; x++) {
    shape.lineTo.apply(shape, vertices[x]);
  }

  // It's shape and bake... and I helped!
  return new THREE.ShapeGeometry(shape);
}

// INITIALIZE SCENE
function init() {
  scene = new THREE.Scene();
  cubeArray = [];

  // Generate cubes.
  for (let i = 0; i < cubeQuantity; i++) {
    cubeArray.push(new Cube());
    cubeArray[i].init({
      minSize: minSize,
      maxSize: maxSize
    });
  }

  // Create walls
  wallArray = [];
  // let backWall = new THREE.PlaneBufferGeometry(width, height, 4, 4);
  var geometry = new THREE.PlaneBufferGeometry( width/2, height/2 );
  var material = new THREE.MeshBasicMaterial( {color: 0x0066dd, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.position.x = (spawnArea.left + spawnArea.right) / 2;
  plane.position.y = (spawnArea.bottom + spawnArea.top) / 2;
  plane.position.z = spawnArea.far; // (spawnArea.far + spawnArea.near) / 2;
  // plane.rotation.y = Math.PI * .25;
  // wallArray.push(plane);
  // scene.add(plane);

  // Add ambient and directional light to the scene.
  let ambientLight = new THREE.AmbientLight('#ffffff', 0.3);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight('#ffffff', 1);
  directionalLight.position.x = spawnArea.left;
  directionalLight.position.y = spawnArea.top;
  directionalLight.position.z = cameraZ;
  directionalLight.lookAt(scene.position);
  scene.add(directionalLight);

  // Set up the scene camera.
  camera = new THREE.OrthographicCamera(
    spawnArea.left,
    spawnArea.right,
    spawnArea.top,
    spawnArea.bottom,
    1,
    cameraZ * 2
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = cameraZ;
  camera.lookAt(scene.position);

  // Raycaster allows us to interact with the mouse.
  raycaster = new THREE.Raycaster();

  // Initialize the renderer.
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.domElement.id = "cubeCanvas";
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
}

function difference(pointA, pointB) {
  let dx = pointA.x - pointB.x;
  let dy = pointA.y - pointB.y;
  let dz = pointA.z - pointB.z;
  return new THREE.Vector3(dx, dy, dz);
}

function distance(pointA, pointB) {
  let dx2 = Math.pow(pointA.x - pointB.x, 2);
  let dy2 = Math.pow(pointA.y - pointB.y, 2);
  let dz2 = Math.pow(pointA.z - pointB.z, 2);
  return Math.sqrt(dx2 + dy2 + dz2);
}

// ANIMATE SCENE
function animate() {
  // Animate the cubes.
  for (let i = 0; i < cubeArray.length; i++) {
    cubeArray[i].animate();
  }

  // Bounce the cubes off each other.
  for (let i = 0; i < cubeArray.length; i++) {
    for (let j = i + 1; j < cubeArray.length; j++) {
      let cubeA = cubeArray[i];
      let cubeB = cubeArray[j];
      // Check if centers are closer than sum of radii
      let dist = distance(cubeA.cube.position, cubeB.cube.position);
      // let dist = cubeA.cube.position.distanceTo(cubeB.cube.position);
      if (dist < (cubeA.size + cubeB.size) / 1.414) {
        // Reverse each cube's velocity
        cubeA.velocity.x *= -1;
        cubeA.velocity.y *= -1;
        cubeB.velocity.x *= -1;
        cubeB.velocity.y *= -1;
        // Set each cube's velocity along the directional vector between centers
        let diff = difference(cubeA.cube.position, cubeB.cube.position);
        // let diff = cubeA.cube.position.sub(cubeB.cube.position);
        let diffLength = diff.length();
        let scaleA = cubeA.velocity.length() / diffLength;
        let scaleB = cubeB.velocity.length() / diffLength;
        cubeA.velocity.x = scaleA * diff.x;
        cubeA.velocity.y = scaleA * diff.y;
        cubeA.velocity.z = scaleA * diff.z;
        cubeB.velocity.x = scaleB * -diff.x;
        cubeB.velocity.y = scaleB * -diff.y;
        cubeB.velocity.z = scaleB * -diff.z;
      }
    }
  }

  // Rotate the walls.
  for (let i = 0; i < wallArray.length; i++) {
    wall = wallArray[i];
    wall.rotation.x += Math.PI/360;
    wall.rotation.y += Math.PI/360;
    wall.rotation.z += Math.PI/360;
  }

  // Look for mouse inteactions. See https://threejs.org/examples/#webgl_interactive_cubes.
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
        INTERSECTED.stayInPlace = false;
      }
      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
      INTERSECTED.material.color.setHex(0x0080ff); // 0x913599);
      INTERSECTED.stayInPlace = true;
      document.getElementById("cubeCanvas").style.cursor = "pointer";
    }
  }
  else {
    if (INTERSECTED) {
      INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
      INTERSECTED.stayInPlace = false;
    }
    INTERSECTED = null;
    document.getElementById("cubeCanvas").style.cursor = "default";
  }

  // Render and loop the animation.
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize mouse detection.
let mouse = new THREE.Vector2();
let INTERSECTED;
mouse.x = 0;
mouse.y = 0;

// Initialize the scene.
init();
animate();
