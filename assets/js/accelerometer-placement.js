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

// --- Modernized Accelerometer UI additions ---
let easedViewfinder = { x: 0, y: 0 };
let pulsePhase = 0;

const minCrosshair = 48;
const maxCrosshair = 120;

// Modern color palette
const hudColor = '#263238'; // blue-gray
const accentColor = '#26a69a'; // teal

// --- Modern UI Additions ---
let showSnackbar = false;
let snackbarTimer = 0;
let isLoadingPlants = true;
let placedPlantAnimations = [];

// SVG for flower icon (as a string)
const flowerSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="5" fill="#26a69a"/><g><ellipse cx="14" cy="5" rx="3" ry="5" fill="#80cbc4"/><ellipse cx="14" cy="23" rx="3" ry="5" fill="#80cbc4"/><ellipse cx="5" cy="14" rx="5" ry="3" fill="#80cbc4"/><ellipse cx="23" cy="14" rx="5" ry="3" fill="#80cbc4"/></g></svg>`;

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
  viewfinder.size = constrain(min(width, height) * 0.13, minCrosshair, maxCrosshair); // Responsive, clamped
  viewfinder.x = width / 2;
  viewfinder.y = height / 2;
  easedViewfinder.x = viewfinder.x;
  easedViewfinder.y = viewfinder.y;
  noFill();
  strokeWeight(2);
  createFAB();
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
    gamma = constrain(gamma, -45, 45);
    beta = constrain(beta, 0, 90);
    viewfinder.x = map(gamma, -45, 45, viewfinder.size/2, width - viewfinder.size/2);
    viewfinder.y = map(beta, 0, 90, viewfinder.size/2, height - viewfinder.size/2);
  } else {
    beta = constrain(beta, -45, 45);
    gamma = constrain(gamma, -45, 45);
    viewfinder.x = map(beta, -45, 45, viewfinder.size/2, width - viewfinder.size/2);
    viewfinder.y = map(-gamma, -45, 45, viewfinder.size/2, height - viewfinder.size/2);
  }

  // --- Easing for smooth movement ---
  const ease = 0.18;
  easedViewfinder.x += (viewfinder.x - easedViewfinder.x) * ease;
  easedViewfinder.y += (viewfinder.y - easedViewfinder.y) * ease;

  // Draw placed plants
  for (let p of placedPlants) {
    drawPlantImg(p.x, p.y, p.type, p.stage);
  }

  // --- Modern crosshair with pulse and glow ---
  push();
  // Drop shadow for the circle
  drawingContext.shadowBlur = 12;
  drawingContext.shadowColor = accentColor + '66'; // semi-transparent teal
  stroke(accentColor);
  strokeWeight(2);
  fill(255, 60);
  ellipse(easedViewfinder.x, easedViewfinder.y, viewfinder.size);
  drawingContext.shadowBlur = 0;

  // Four short lines (cardinal points)
  stroke(accentColor);
  strokeWeight(3);
  const len = viewfinder.size * 0.22;
  // Top
  line(easedViewfinder.x, easedViewfinder.y - viewfinder.size/2, easedViewfinder.x, easedViewfinder.y - viewfinder.size/2 + len);
  // Bottom
  line(easedViewfinder.x, easedViewfinder.y + viewfinder.size/2, easedViewfinder.x, easedViewfinder.y + viewfinder.size/2 - len);
  // Left
  line(easedViewfinder.x - viewfinder.size/2, easedViewfinder.y, easedViewfinder.x - viewfinder.size/2 + len, easedViewfinder.y);
  // Right
  line(easedViewfinder.x + viewfinder.size/2, easedViewfinder.y, easedViewfinder.x + viewfinder.size/2 - len, easedViewfinder.y);

  // --- Pulsing center dot ---
  pulsePhase += 0.07;
  let pulse = 1 + 0.18 * sin(pulsePhase * 2);
  // Glowing pulse
  drawingContext.shadowBlur = 18 + 8 * abs(sin(pulsePhase));
  drawingContext.shadowColor = accentColor + '77';
  noStroke();
  fill(accentColor);
  ellipse(easedViewfinder.x, easedViewfinder.y, 14 * pulse, 14 * pulse);
  drawingContext.shadowBlur = 0;
  // Solid center dot
  fill(accentColor);
  ellipse(easedViewfinder.x, easedViewfinder.y, 8, 8);
  pop();

  // --- Modern HUD for orientation values ---
  push();
  let hudW = 120, hudH = 54;
  let hudX = 18;
  let hudY = 18;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = accentColor + '22';
  fill(255, 220);
  stroke(accentColor);
  strokeWeight(1.2);
  rect(hudX, hudY, hudW, hudH, 14);
  drawingContext.shadowBlur = 0;
  noStroke();
  fill(hudColor);
  textFont('Inter, Segoe UI, Arial, sans-serif');
  textSize(15);
  textAlign(LEFT, TOP);
  text('γ: ' + nf(orientation.gamma, 2, 1), hudX + 14, hudY + 10);
  text('β: ' + nf(orientation.beta, 2, 1), hudX + 14, hudY + 30);
  pop();

  // --- Glassmorphic HUD ---
  drawGlassHUD();

  // --- Loading Spinner ---
  if (isLoadingPlants) {
    drawLoadingSpinner();
    return;
  }

  // --- Animate placed plants ---
  animatePlacedPlants();

  // --- Snackbar ---
  if (showSnackbar) drawSnackbar();
}

function drawPlantImg(x, y, type, stage) {
  let img = plantImgs[type] && plantImgs[type][stage];
  if (img) {
    // Responsive scale, clamped
    let baseScale = type === 'milkweed' ? 0.10 : 0.07;
    let scale = baseScale * (min(width, height) / 600); // 600 is a reference size
    scale = constrain(scale, 0.06, 0.16); // Clamp for reasonable min/max
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
  viewfinder.size = constrain(min(width, height) * 0.13, minCrosshair, maxCrosshair);
  redraw();
}

// --- Glassmorphic HUD ---
function drawGlassHUD() {
  push();
  let hudW = 160, hudH = 56;
  let x = 18, y = 18;
  drawingContext.save();
  drawingContext.filter = 'blur(8px)';
  fill(255, 120);
  stroke(255, 60);
  rect(x, y, hudW, hudH, 18);
  drawingContext.restore();
  pop();
  // Shadow
  push();
  drawingContext.shadowBlur = 12;
  drawingContext.shadowColor = 'rgba(38,166,154,0.18)';
  noFill();
  strokeWeight(2);
  rect(x, y, hudW, hudH, 18);
  pop();
  // HUD text
  push();
  fill(hudColor);
  noStroke();
  textFont('Inter, Segoe UI, Arial, sans-serif');
  textSize(16);
  textAlign(LEFT, TOP);
  text(`γ: ${nf(orientation.gamma, 2, 1)}°`, x + 18, y + 12);
  text(`β: ${nf(orientation.beta, 2, 1)}°`, x + 90, y + 12);
  pop();
}

// --- Floating Action Button (FAB) ---
function createFAB() {
  let fab = document.createElement('button');
  fab.id = 'fab-place-plant';
  fab.innerHTML = flowerSVG;
  fab.style.position = 'fixed';
  fab.style.right = '24px';
  fab.style.bottom = '32px';
  fab.style.width = '64px';
  fab.style.height = '64px';
  fab.style.borderRadius = '50%';
  fab.style.background = '#26a69a';
  fab.style.boxShadow = '0 4px 24px rgba(38,166,154,0.18)';
  fab.style.border = 'none';
  fab.style.display = 'flex';
  fab.style.alignItems = 'center';
  fab.style.justifyContent = 'center';
  fab.style.cursor = 'pointer';
  fab.style.zIndex = 1000;
  fab.style.transition = 'background 0.2s, box-shadow 0.2s, transform 0.1s';
  fab.onpointerdown = () => { fab.style.transform = 'scale(0.95)'; };
  fab.onpointerup = () => { fab.style.transform = 'scale(1)'; };
  fab.onmouseenter = () => { fab.style.background = '#2196f3'; };
  fab.onmouseleave = () => { fab.style.background = '#26a69a'; };
  fab.onclick = onPlacePlant;
  document.body.appendChild(fab);
}

function onPlacePlant() {
  // Place plant logic (call your existing placement function)
  placePlantWithAnimation();
  // Haptic feedback
  if (window.navigator.vibrate) window.navigator.vibrate(30);
  // Snackbar
  showSnackbar = true;
  snackbarTimer = millis();
}

// --- Snackbar ---
function drawSnackbar() {
  let msg = '🌱 Plant placed!';
  let w = textWidth(msg) + 48;
  let h = 44;
  let x = width/2 - w/2;
  let y = height - h - 32;
  push();
  drawingContext.save();
  drawingContext.filter = 'blur(6px)';
  fill(255, 220);
  stroke(255, 80);
  rect(x, y, w, h, 16);
  drawingContext.restore();
  pop();
  // Shadow
  push();
  drawingContext.shadowBlur = 8;
  drawingContext.shadowColor = 'rgba(38,166,154,0.18)';
  noFill();
  strokeWeight(2);
  rect(x, y, w, h, 16);
  pop();
  // Text
  push();
  fill(hudColor);
  noStroke();
  textFont('Inter, Segoe UI, Arial, sans-serif');
  textSize(18);
  textAlign(CENTER, CENTER);
  text(msg, width/2, y + h/2);
  pop();
  // Hide after 1.5s
  if (millis() - snackbarTimer > 1500) showSnackbar = false;
}

// --- Loading Spinner ---
function drawLoadingSpinner() {
  push();
  translate(width/2, height/2);
  let r = 32;
  let t = millis() / 600;
  stroke(accentColor);
  strokeWeight(6);
  noFill();
  arc(0, 0, r*2, r*2, t, t + PI*1.2);
  pop();
}

// --- Animate Plant Placement ---
function placePlantWithAnimation() {
  // Call your existing placePlant logic, but also add animation
  let plant = placePlant(); // Should return the placed plant object with xPercent/yPercent
  if (plant) {
    placedPlantAnimations.push({
      ...plant,
      startTime: millis(),
      duration: 700,
      animating: true
    });
  }
}

function animatePlacedPlants() {
  for (let i = placedPlantAnimations.length - 1; i >= 0; i--) {
    let anim = placedPlantAnimations[i];
    let elapsed = millis() - anim.startTime;
    let progress = constrain(elapsed / anim.duration, 0, 1);
    let scale = easeOutBack(progress);
    // Draw plant at anim.xPercent, anim.yPercent with scale
    drawPlantAt(anim, scale);
    if (progress >= 1) {
      placedPlantAnimations.splice(i, 1);
    }
  }
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
}

// --- Draw plant at percent position with scale ---
function drawPlantAt(plant, scale) {
  // Use your existing plant drawing logic, but apply scale
  let px = plant.xPercent * width;
  let py = plant.yPercent * height;
  push();
  translate(px, py);
  scale = scale || 1;
  scale(scale);
  // ... draw plant image based on plant.type and plant.stage ...
  pop();
} 