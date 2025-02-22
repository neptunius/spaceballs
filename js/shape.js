class Shape {
  // INITIALIZE SHAPE
  constructor(args) {
    args = args || {};
    this.size = args.size || randomInt(10, 50);
    // Initialize geometry and mesh
    this.initGeometry(args);
    this.initMesh(args);
    // Translational velocity
    this.velocity = randomVector3(-5, 5);
    // Rotational velocity
    this.rotation = randomVector3(-0.02, 0.02);
    // Stop movement during mouse interactions
    this.mesh.frozen = false;
    this.recolor();
  };

  static randomShape() {
    const shapes = [ // 'plane', 'circle', 'ring', // 2D shapes
      // 'cone', 'cylinder', 'sphere', 'box', // 3D shapes
      'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', // Polyhedra
      'torus', 'knot', 'random knot', 'random knot', 'lathe', // Irregular shapes
    ];
    return randomValue(shapes);
  }

  initGeometry(args) {
    args = args || {};
    // Set up geometry properties
    const size = this.size;
    const radius = this.size;
    const height = this.size * Math.sqrt(2);
    // Create geometry based on shape name
    const shape = args.shape || Shape.randomShape();
    // 2D shapes
    if (shape === 'plane' || shape === 'square' || shape === 'rectangle')
      this.geometry = new THREE.PlaneBufferGeometry(size * 1.8, size * 1.8);
    else if (shape === 'circle' || shape === 'disk')
      this.geometry = new THREE.CircleBufferGeometry(radius, 24);
    else if (shape === 'ring' || shape === 'record')
      this.geometry = new THREE.RingBufferGeometry(radius / 2, radius, 24);
    // 3D circular shapes
    else if (shape === 'cone' || shape === 'ice cream')
      this.geometry = new THREE.ConeBufferGeometry(radius, height, 24);
    else if (shape === 'cylinder' || shape === 'tube')
      this.geometry = new THREE.CylinderBufferGeometry(radius, radius, height, 24);
    else if (shape === 'sphere' || shape === 'ball')
      this.geometry = new THREE.SphereBufferGeometry(radius, 20, 16);
    // 3D regular polyhedra (Platonic solids)
    else if (shape === 'box' || shape === 'cube' || shape === 'd6')
      this.geometry = new THREE.BoxBufferGeometry(height, height, height);
    else if (shape === 'tetrahedron' || shape === 'pyramid' || shape === 'd4')
      this.geometry = new THREE.TetrahedronBufferGeometry(size * 1.5);
    else if (shape === 'octahedron' || shape === 'd8')
      this.geometry = new THREE.OctahedronBufferGeometry(size * 1.3);
    else if (shape === 'dodecahedron' || shape === 'd12')
      this.geometry = new THREE.DodecahedronBufferGeometry(size * 1.2);
    else if (shape === 'icosahedron' || shape === 'd20')
      this.geometry = new THREE.IcosahedronBufferGeometry(size * 1.2);
    // 3D irregular shapes
    else if (shape === 'torus' || shape === 'donut')
      this.geometry = new THREE.TorusBufferGeometry(radius * 3/4, radius / 4, 12, 24);
    else if (shape === 'knot' || shape === 'pretzel')
      this.geometry = new THREE.TorusKnotBufferGeometry(radius * 2/3, radius / 6, 64, 12);
    else if (shape === 'random knot' || shape === 'random pretzel') {
      // See https://threejs.org/docs/#api/en/geometries/TorusKnotBufferGeometry
      const p = randomInt(1, 8); // How many times to wind around axis of rotational symmetry
      const q = randomInt(1, 8); // How many times to wind around circle in interior of torus
      this.geometry = new THREE.TorusKnotBufferGeometry(radius * 2/3, radius / 8, 128, 12, p, q);
    }
    // 3D parametric rotational shapes
    else if (shape === 'lathe' || shape === 'vase') {
      const numPoints = 64;
      const points = [];
      for (let i = 0; i < numPoints; i++) {
        const x = size * 3/4 + size/4 * Math.sin(i * 0.18) * Math.sin(i * 0.1);
        const y = (i - numPoints/2) * 1.4;
        points.push(new THREE.Vector2(x, y));
      }
      this.geometry = new THREE.LatheBufferGeometry(points, 24);
    }
  }

  initMesh(args) {
    args = args || {};
    // Generate 2 random colors
    const colors = randomColor({
      count: 2,
      hue: 'random',
      luminosity: 'dark',
    });
    // Create material and mesh
    this.material = new THREE.MeshPhongMaterial({
      color: args.color || colors[0],
      emissive: colors[1],
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // Shape mesh coordinate properties
    this.mesh.position.x = randomInt(boundingBox.left + this.size, boundingBox.right - this.size);
    this.mesh.position.y = randomInt(boundingBox.bottom + this.size, boundingBox.top - this.size);
    this.mesh.position.z = randomInt(boundingBox.back + this.size, boundingBox.front - this.size);
    this.mesh.rotation.x = randomInt(0, 360);
    this.mesh.rotation.y = randomInt(0, 360);
    this.mesh.rotation.z = randomInt(0, 360);
  }

  // ANIMATE SHAPE
  animate(boundingBox) {
    this.move();
    this.bounce(boundingBox);
    this.rotate();
    this.recolor();
  }

  move() {
    if (!this.mesh.frozen) {
      // Adjust position by translational velocity
      this.mesh.position.x += this.velocity.x;
      this.mesh.position.y += this.velocity.y;
      this.mesh.position.z += this.velocity.z;
    }
  }

  rotate() {
    if (!this.mesh.frozen) {
      // Adjust rotation by rotational velocity
      this.mesh.rotation.x += this.rotation.x;
      this.mesh.rotation.y += this.rotation.y;
      this.mesh.rotation.z += this.rotation.z;
    }
  }

  bounce(boundingBox) {
    const size = this.size;
    const position = this.mesh.position;
    const velocity = this.velocity;
    // If shape went out of bounds, put it back in bounds
    // and reverse its direction to bounce it back inward
    // Bounce x-coordinate of position and velocity
    if (position.x <= boundingBox.left + size) {
      position.x = boundingBox.left + size;
      if (velocity.x < 0)
        velocity.x *= -1;
    } else if (position.x >= boundingBox.right - size) {
      position.x = boundingBox.right - size;
      if (velocity.x > 0)
        velocity.x *= -1;
    }
    // Bounce y-coordinate of position and velocity
    if (position.y <= boundingBox.bottom + size) {
      position.y = boundingBox.bottom + size;
      if (velocity.y < 0)
        velocity.y *= -1;
    } else if (position.y >= boundingBox.top - size) {
      position.y = boundingBox.top - size;
      if (velocity.y > 0)
        velocity.y *= -1;
    }
    // Bounce z-coordinate of position and velocity
    if (position.z <= boundingBox.back + size) {
      position.z = boundingBox.back + size;
      if (velocity.z < 0)
        velocity.z *= -1;
    } else if (position.z >= boundingBox.front - size) {
      position.z = boundingBox.front - size;
      if (velocity.z > 0)
        velocity.z *= -1;
    }
  }

  wrap(boundingBox) {
    const size = this.size;
    const position = this.mesh.position;
    // If shape went out of bounds, move it to opposite side of bounding box
    // Wrap x-coordinate of position
    if (position.x < boundingBox.left - size) {
      position.x = boundingBox.right + size;
    } else if (position.x > boundingBox.right + size) {
      position.x = boundingBox.left - size;
    }
    // Wrap y-coordinate of position
    if (position.y < boundingBox.bottom - size) {
      position.y = boundingBox.top + size;
    } else if (position.y > boundingBox.top + size) {
      position.y = boundingBox.bottom - size;
    }
    // Wrap z-coordinate of position
    if (position.z < boundingBox.back + size) {
      position.z = boundingBox.front - size;
    } else if (position.z > boundingBox.front - size) {
      position.z = boundingBox.back + size;
    }
  }

  collide(that) {
    if (!that instanceof Shape)
      return;
    // Check if shape centers are closer than sum of sizes
    const difference = this.mesh.position.clone().sub(that.mesh.position);
    const distance = difference.length();
    if (distance < this.size + that.size) {
      // Reverse each shape's velocity
      this.velocity.x *= -1;
      this.velocity.y *= -1;
      this.velocity.z *= -1;
      that.velocity.x *= -1;
      that.velocity.y *= -1;
      that.velocity.z *= -1;
      // Set each shape's velocity along the directional vector between centers
      const thisScale = that.velocity.length() / distance;
      const thatScale = this.velocity.length() / distance;
      this.velocity.x = thisScale * difference.x;
      this.velocity.y = thisScale * difference.y;
      this.velocity.z = thisScale * difference.z;
      that.velocity.x = thatScale * -difference.x;
      that.velocity.y = thatScale * -difference.y;
      that.velocity.z = thatScale * -difference.z;
    }
  }

  recolor() {
    if (!this.mesh.frozen)
      this.recolorPosition();
  }

  recolorPosition() {
    // Position-based color in RGB space
    const offset = new THREE.Vector3(1, 1, 1).multiplyScalar(0.4);
    const position = this.mesh.position.clone()
    const posNorm = position.normalize().multiplyScalar(0.5).add(offset);
    const color = new THREE.Color(posNorm.x, posNorm.y, posNorm.z);
    this.setColor(color);
  }

  recolorSpeed() {
    // Speed-based color in HSL space
    const speed = this.velocity.length();
    const speedLimit = 7;
    const speedClamped = Math.min(speed, speedLimit) / speedLimit;
    const hue = 255 * (1 - speedClamped);
    const color = new THREE.Color("hsl(" + hue + ", 100%, 50%)");
    this.setColor(color);
  }

  setColor(color) {
    if (this.material.color) {
      // Set this shape's material color
      this.material.color = color;
    }
    if (this.material.emissive) {
      // Set this shape's emissive color to a darker shade of the same color
      const darkColor = new THREE.Color(color.r / 2, color.g / 2, color.b / 2);
      this.material.emissive = darkColor;
    }
  }
}
