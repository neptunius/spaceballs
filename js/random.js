// RANDOM NUMBER FUNCTIONS
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return (Math.random() * (max - min + 1) + min) << 0;
}

function randomValue(array) {
  return array[randomInt(0, array.length - 1)];
}

function randomVector3(min, max) {
  const x = randomFloat(min, max);
  const y = randomFloat(min, max);
  const z = randomFloat(min, max);
  return new THREE.Vector3(x, y, z);
}
