class Shape {
  // INITIALIZE SHAPE
  constructor(args) {
    args = args || {};
    this.size = args.size || randomInt(10, 50);
    // Initialize geometry and mesh
    this.initGeometry(args);
    // Translational velocity
    this.velocity = randomVector3(-5, 5);
    // Rotational velocity
    this.rotation = randomVector3(-0.02, 0.02);
    // Stop movement during mouse interactions
    this.mesh.frozen = false;
    this.recolor();
  };

  initGeometry(args) {
    args = args || {};
    // Create sphere geometry
    this.geometry = new THREE.SphereBufferGeometry(this.size, 20, 16);
    // Generate 2 random colors
    const colors = randomColor({
      count: 2,
      hue: 'random',
      luminosity: 'dark',
    });
    // Create material and mesh
    this.material = new THREE.MeshLambertMaterial({
      color: args.color || colors[0],
      emissive: colors[1],
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
      const thisScale = this.velocity.length() / distance;
      const thatScale = that.velocity.length() / distance;
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
