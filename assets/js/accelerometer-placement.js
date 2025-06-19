let viewfinder = { x: 0, y: 0, size: 60 };
let placedPlants = [];
let canvasW, canvasH;
let motionEnabled = false;

// Images
let bgImg;
let plantImgs = {
  milkweed: [],
  nymphaea: []
};

// Orientation state
let orientation = { gamma: 0, beta: 0 };

function preload() {
  bgImg = loadImage('assets/img/gvsu-hd.jpeg');
  // Milkweed stages 5-1 (reverse order for dropdown 1-5)
  plantImgs.milkweed[0] = loadImage('assets/img/milkweed-full/Milkweed_0000_5.png');
  plantImgs.milkweed[1] = loadImage('assets/img/milkweed-full/Milkweed_0001_4.png');
  plantImgs.milkweed[2] = loadImage('assets/img/milkweed-full/Milkweed_0002_3.png');
  plantImgs.milkweed[3] = loadImage('assets/img/milkweed-full/Milkweed_0003_2.png');
  plantImgs.milkweed[4] = loadImage('assets/img/milkweed-full/Milkweed_0004_1.png');
  // Nymphaea stages 1-5
  plantImgs.nymphaea[0] = loadImage('assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage1.png');
  plantImgs.nymphaea[1] = loadImage('assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage2.png');
  plantImgs.nymphaea[2] = loadImage('assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage3.png');
  plantImgs.nymphaea[3] = loadImage('assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage4.png');
  plantImgs.nymphaea[4] = loadImage('assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage5.png');
}

function setup() {
  canvasW = windowWidth;
  canvasH = windowHeight;
  createCanvas(canvasW, canvasH);
  viewfinder.x = width / 2;
  viewfinder.y = height / 2;
  noFill();
  strokeWeight(2);
}

function requestMotionPermission() {
  const msg = document.getElementById('motionMsg');
  // iOS 13+ requires permission for deviceorientation
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          motionEnabled = true;
          if (msg) msg.style.display = 'none';
        } else {
          if (msg) msg.textContent = 'Motion permission denied. Reload and try again.';
        }
      })
      .catch(err => {
        if (msg) msg.textContent = 'Error requesting motion permission.';
        console.error(err);
      });
  } else {
    // Non-iOS devices
    window.addEventListener('deviceorientation', handleOrientation);
    motionEnabled = true;
    if (msg) msg.style.display = 'none';
  }
}

function handleOrientation(event) {
  // gamma: left/right tilt (-90 to 90), beta: front/back tilt (-180 to 180)
  orientation.gamma = event.gamma || 0;
  orientation.beta = event.beta || 0;
}

// Only request permission on user gesture
window.addEventListener('click', function once() {
  if (!motionEnabled) requestMotionPermission();
  window.removeEventListener('click', once);
});

function draw() {
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background('#eaf6f6');
  }

  // Detect orientation
  let isPortrait = height >= width;
  let gamma = orientation.gamma;
  let beta = orientation.beta;

  if (isPortrait) {
    // Portrait: gamma (left/right) -> x, beta (front/back) -> y
    gamma = constrain(gamma, -45, 45);
    beta = constrain(beta, 0, 90);
    viewfinder.x = map(gamma, -45, 45, viewfinder.size/2, width - viewfinder.size/2);
    viewfinder.y = map(beta, 0, 90, viewfinder.size/2, height - viewfinder.size/2);
  } else {
    // Landscape: beta (left/right) -> x, -gamma (up/down) -> y
    beta = constrain(beta, -45, 45);
    gamma = constrain(gamma, -45, 45);
    viewfinder.x = map(beta, -45, 45, viewfinder.size/2, width - viewfinder.size/2);
    viewfinder.y = map(-gamma, -45, 45, viewfinder.size/2, height - viewfinder.size/2);
  }

  // Draw placed plants
  for (let p of placedPlants) {
    drawPlantImg(p.x, p.y, p.type, p.stage);
  }

  // Draw viewfinder
  push();
  stroke('#388e3c');
  strokeWeight(3);
  fill(255, 80);
  ellipse(viewfinder.x, viewfinder.y, viewfinder.size);
  line(viewfinder.x - viewfinder.size/2, viewfinder.y, viewfinder.x + viewfinder.size/2, viewfinder.y);
  line(viewfinder.x, viewfinder.y - viewfinder.size/2, viewfinder.x, viewfinder.y + viewfinder.size/2);
  pop();
}

function drawPlantImg(x, y, type, stage) {
  let img = plantImgs[type] && plantImgs[type][stage];
  if (img) {
    let scale = type === 'milkweed' ? 0.10 : 0.07;
    let w = img.width * scale;
    let h = img.height * scale;
    image(img, x - w/2, y - h/2, w, h);
  }
}

document.getElementById('placeBtn').addEventListener('click', function() {
  const type = document.getElementById('plantType').value;
  const stage = parseInt(document.getElementById('plantStage').value);
  placedPlants.push({ x: viewfinder.x, y: viewfinder.y, type, stage });
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvasW = windowWidth;
  canvasH = windowHeight;
} 