// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// global vars
let bg, mask, overlay;
let flowers;
let redraw;
let isPlacingFlower = false;
let pendingFlowerColor = null;

// temp variables
let debug = false;

// load in background and flowers at full resolution
function preload() {
  // bg = loadImage("assets/img/gvsu-bg.jpg");
  bg = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.png");;
  mask = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.mask.png");
  overlay = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.overlay.png");
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER);
  loadData(); // Load flower data from Firestore
  redraw = false;
  
  // Setup popup event listeners
  const popup = document.getElementById('flowerPopup');
  const cancelBtn = document.getElementById('cancelPlacement');
  const placeBtn = document.getElementById('placeFlower');
  const colorInput = document.getElementById('flowerColor');
  const colorPreview = document.querySelector('.color-preview');
  
  cancelBtn.addEventListener('click', () => {
    isPlacingFlower = false;
    pendingFlowerColor = null;
    popup.classList.remove('active');
  });
  
  placeBtn.addEventListener('click', () => {
    if (isPlacingFlower) {
      pendingFlowerColor = colorInput.value;
      popup.classList.remove('active');
    }
  });
  
  colorInput.addEventListener('input', (e) => {
    colorPreview.style.backgroundColor = e.target.value;
  });
  
  // Initialize color preview
  colorPreview.style.backgroundColor = colorInput.value;
}


  /* // loadData();
  flowers = setupRandomData(bg.width, bg.height);

  drawEverything();

  redraw = false;
  debug = false;
} */



function draw() {
  if (redraw) drawEverything();
}

// draw everything with respect to the canvas size
function drawEverything() {
  background(0);

  // force landscape mode
  if (width < height) {
    push();
    fill(255);
    textSize(width * 0.05);
    textAlign(CENTER, CENTER);
    translate(width * 0.5, height * 0.5);
    text("Please rotate your device", 0, 0);
    pop();
  } else {
    background(0);

    // landscape image - maintain aspect ratio wrt width
    let w_aspect = bg.width / width;
    let h = bg.height / w_aspect;
    image(bg, 0, 0, width, h, 0, 0, bg.width, bg.height);

    // debug
    if (debug) {
      tint(255, 127);
      image(mask, 0, 0, width, h, 0, 0, bg.width, bg.height);
      noTint();
    }

    for (let f of flowers) {
      fill(f.color);

      let h_aspect = bg.height / h;


      circle(f.location.x / w_aspect, f.location.y / h_aspect, 20 / w_aspect);
    }

    image(overlay, 0, 0, width, h, 0, 0, bg.width, bg.height);
  }

  redraw = false;
}

// reads in plant information from database
async function loadData() {
  if (!window.getFlowerData) {
    console.warn("Firestore loader not available");
    return;
  }

  try {
    const rawData = await window.getFlowerData();
    flowers = rawData.map(f => ({
      location: f.location,
      color: color(f.color || "white")
    }));
    redraw = true;
  } catch (err) {
    console.error("Error loading flowers from Firestore:", err);
  }
}

// resize all images wrt aspect ratio
function resizeImages() {

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeImages();
  drawEverything();
}

function mousePressed() {
  if (isPlacingFlower && pendingFlowerColor) {
    const w_aspect = bg.width / width;
    const h_aspect = bg.height / (bg.height / w_aspect);
    
    // Convert mouse coordinates to image coordinates
    const imageX = mouseX * w_aspect;
    const imageY = mouseY * h_aspect;
    
    // Check if click is within image bounds
    if (imageX >= 0 && imageX <= bg.width && imageY >= 0 && imageY <= bg.height) {
      // Check if the clicked position is valid (on grass)
      const maskX = Math.floor(imageX);
      const maskY = Math.floor(imageY);
      const maskPixel = mask.get(maskX, maskY);
      
      // If the mask pixel is black (0,0,0), it's a valid position (grass)
      if (maskPixel[0] === 0 && maskPixel[1] === 0 && maskPixel[2] === 0) {
        const newFlower = {
          location: {
            x: imageX,
            y: imageY
          },
          color: color(pendingFlowerColor)
        };
        
        flowers.push(newFlower);
        redraw = true;
      }
      
      // Reset placement state regardless of whether flower was placed
      isPlacingFlower = false;
      pendingFlowerColor = null;
    }
  }
}

function keyPressed() {
  if (key == " ") {
    debug = !debug;
    redraw = true;
  } else if (key >= "1" && key <= "9") {
    // Show popup for flower placement
    isPlacingFlower = true;
    pendingFlowerColor = null;
    document.getElementById('flowerPopup').classList.add('active');
  }
}

