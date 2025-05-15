// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// global vars
let bg, mask, overlay;
let flowers = [];
let redraw;
let isPlacingFlower = false;
let pendingFlowerColor = null;

let wind_fs;
let wind_material;

let dither_fs, tv_fs, rgb_fs;
// let shaders_on; 
let touch_timer;

// unsure if hd_scale is necessary or if my math is just off
// TBD: probably would be better to render as full-def and then scale to viewport
let QR_map = {
  0: { name: 'Milkweed', scale: 0.4, hd_scale: 0.7 },
  1: { name: 'Nymphaea', scale: 0.04, hd_scale: 0.07 },
  99: { name: 'Piranha', scale: 0.4 },
}
let plant_images = {};

// temp variables
let debug = false;
let wind_on = true;

let font;
let ctx;

// load in background and flowers at full resolution
function preload() {
  // bg = loadImage("assets/img/gvsu-bg.jpg");
  // bg = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.png");;
  bg = loadImage("assets/img/gvsu-hd.jpeg");
  mask = loadImage("assets/img/gvsu-hd-mask.jpg");

  // mask = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.mask.png");
  overlay = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.overlay.png");

  // temp_milkweed = loadImage("assets/img/milkweed/Milkweed_0000_5_sm.cropped.png");

  plant_images[QR_map[0].name] = [];
  plant_images[QR_map[1].name] = [];
  plant_images[QR_map[99].name] = [];

  for (let i = 1; i <= 5; i++) {
    plant_images[QR_map[0].name].push(loadImage("assets/img/milkweed/Milkweed_5_outerglow.png"));
    plant_images[QR_map[1].name].push(loadImage(`assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${i}.png`));
  }

  font = loadFont("assets/fonts/Quicksand-Medium.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  noSmooth();

  textFont(font);
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

  wind_material = baseMaterialShader().modify({
    uniforms: {
      'float time': null,
      'float offset': null,
    },
    'Inputs getPixelInputs': `(Inputs inputs) {
      vec2 coord = inputs.texCoord;
      vec2 Size = vec2(201,463);
      vec2 Wave = vec2(48, 10);
      coord = coord + vec2(cos(offset + (coord.y / Wave.x + time) * 6.2831) * Wave.y, 0) / Size * (1.0 - coord.y);
      inputs.color = texture(uSampler, coord);
      return inputs;
    }`
  });

  dither_fs = createFilterShader(dither_src);
  tv_fs = createFilterShader(tv_noise_src);
  rgb_fs = createFilterShader(rgb_src);

  frameRate(24);
}

function draw() {
  if (redraw) drawEverything();

  if (frameCount % 20 == 0 && flowers.length < 10000 && window.adding_flowers) {
    flowers = addIndividualPlant(bg.width, bg.height, mask, flowers);
    redraw = true;
  }

  if (window.animate_scene) redraw = true;

  if (window.shaders_on) {
    rgb_fs.setUniform("_noise", 0.1);
    filter(rgb_fs);
    tv_fs.setUniform("_noise", 0.5 * cos(millis() * 0.001));
    filter(tv_fs);
    dither_fs.setUniform("which", 2);
    filter(dither_fs);
  }

  if (touches.length > 2) {
    if (touch_timer == 0)
      window.shaders_on = !window.shaders_on;
    touch_timer = 10;
  }
  if (touch_timer > 0) touch_timer--; // avoid multi toggling
}

function doubleClicked() {
  window.shaders_on = !window.shaders_on;
}

// draw everything with respect to the canvas size
function drawEverything(saving = false) {
  if (!saving) {
    translate(-width / 2, -height / 2);
    background(0);

    // force landscape mode
    if (width < height) {
      push();
      fill(255);
      textSize(width * 0.05);
      textAlign(CENTER, CENTER);
      text("Please rotate your device", width / 2, height / 2);
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

      let i = 0;
      let now = new Date();
      for (let f of flowers) {
        // Skip invalid flowers
        if (!f.QR_id || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
          console.warn("Skipping invalid flower:", f);
          continue;
        }

        let h_aspect = bg.height / h;
        let x = (f.location.x / w_aspect);
        let y = (f.location.y / h_aspect);

        // perspective for 'farther away'
        let sc = map(y, height, height * 0.2, 1.0, 0.001);
        let _w, _h, _img;

        // currently a day will change the plant
        let date_diff = Math.floor(dateDifference(now, f.timestamp));
        let idx = 0;
        if ((date_diff / 5) > 4) idx = 4;
        else idx = Math.floor(date_diff / 5);

        _img = plant_images[QR_map[f.QR_id].name][idx];
        _w = (_img.width * QR_map[f.QR_id].scale) * sc;
        _h = (_img.height * QR_map[f.QR_id].scale) * sc;

        // magic numbers help with offset within image
        push();

        if (window.animate_scene) {
          shader(wind_material);
          wind_material.setUniform("offset", i);
          wind_material.setUniform('time', millis() / 2400);
          i++;
        }

        image(_img, x - _w * .5, y - _h * .5, _w, _h, 0, 0, _img.width, _img.height);
        pop();
      }
    }
  } else { // generate HQ image for saving
    let to_save = createGraphics(bg.width, bg.height);
    to_save.background(0);
    to_save.image(bg, 0, 0);

    let i = 0;
    let now = new Date();
    for (let f of flowers) {
      // Skip invalid flowers
      if (!f.QR_id || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
        console.warn("Skipping invalid flower:", f);
        continue;
      }

      let x = f.location.x;
      let y = f.location.y;

      // perspective for 'farther away'
      let sc = map(y, bg.height, bg.height * 0.2, 1.0, 0.001);
      let _w, _h, _img;

      // currently a day will change the plant
      let date_diff = Math.floor(dateDifference(now, f.timestamp));
      let idx = 0;
      if ((date_diff / 5) > 4) idx = 4;
      else idx = Math.floor(date_diff / 5);

      _img = plant_images[QR_map[f.QR_id].name][idx];
      _w = (_img.width * QR_map[f.QR_id].hd_scale) * sc;
      _h = (_img.height * QR_map[f.QR_id].hd_scale) * sc;

      to_save.image(_img, x - _w * .5, y - _h * .5, _w, _h, 0, 0, _img.width, _img.height);
    }
    return to_save;
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
      color: color(f.color || "white"),
      id: f.id,
      QR_id: f.QR_id || 0  // Default to Milkweed (QR_id: 0) if not specified
    }));
    console.log("Loaded flowers:", flowers);
    redraw = true;
  } catch (err) {
    console.error("Error loading flowers from Firestore:", err);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawEverything();
}

// insert flower by keypress function 
//press 1-9 to place a flower

function mousePressed() {
  if (mouseButton === RIGHT) {
    // Handle right-click for flower removal
    const w_aspect = bg.width / width;
    const h_aspect = bg.height / (bg.height / w_aspect);
    
    // Convert mouse coordinates to image coordinates
    const imageX = mouseX * w_aspect;
    const imageY = mouseY * h_aspect;
    
    // Check if click is within image bounds
    if (imageX >= 0 && imageX <= bg.width && imageY >= 0 && imageY <= bg.height) {
      // Find the closest flower within a certain radius
      const clickRadius = 20 / w_aspect; // Same as flower size
      let closestFlower = null;
      let minDistance = Infinity;
      
      for (let i = 0; i < flowers.length; i++) {
        const flower = flowers[i];
        const dx = flower.location.x / w_aspect - mouseX;
        const dy = flower.location.y / h_aspect - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < clickRadius && distance < minDistance) {
          minDistance = distance;
          closestFlower = { index: i, flower: flower };
        }
      }
      
      if (closestFlower && closestFlower.flower.id) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
        
        // Show confirmation popup
        const popup = document.createElement('div');
        popup.className = 'confirmation-popup';
        
        // Add confirmation message
        const message = document.createElement('p');
        message.textContent = 'Remove this flower?';
        popup.appendChild(message);
        
        // Add button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'cancel-btn';
        cancelBtn.onclick = () => {
          document.body.removeChild(overlay);
          document.body.removeChild(popup);
        };
        
        // Add confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Remove';
        confirmBtn.className = 'confirm-btn';
        confirmBtn.onclick = async () => {
          const success = await window.deleteFlower(closestFlower.flower.id);
          if (success) {
            flowers.splice(closestFlower.index, 1);
            redraw = true;
            
            // Show success message
            const successPopup = document.createElement('div');
            successPopup.className = 'confirmation-popup';
            
            const successMessage = document.createElement('p');
            successMessage.textContent = 'Flower removed successfully!';
            successPopup.appendChild(successMessage);
            
            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.className = 'success-btn';
            okBtn.onclick = () => {
              document.body.removeChild(successPopup);
            };
            successPopup.appendChild(okBtn);
            
            document.body.appendChild(successPopup);
          }
          document.body.removeChild(overlay);
          document.body.removeChild(popup);
        };
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);
        popup.appendChild(buttonContainer);
        
        document.body.appendChild(popup);
      }
    }
    return false; // Prevent default context menu
  } else if (isPlacingFlower && pendingFlowerColor) {
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
          color: pendingFlowerColor,
          timestamp: new Date().toISOString()
        };
        
        // First add to local array to maintain current functionality
        flowers.push({
          location: newFlower.location,
          color: color(pendingFlowerColor)
        });
        redraw = true;

        // Then try to save to Firebase
        window.addFlower(newFlower).then(flowerId => {
          if (flowerId) {
            // Create and show confirmation popup
            const popup = document.createElement('div');
            popup.className = 'confirmation-popup';
            
            // Add success message
            const message = document.createElement('p');
            message.textContent = 'Flower successfully added!';
            popup.appendChild(message);
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'OK';
            closeBtn.className = 'success-btn';
            closeBtn.onclick = () => {
              document.body.removeChild(popup);
            };
            popup.appendChild(closeBtn);
            
            document.body.appendChild(popup);
          }
        });
      }
      
      // Reset placement state regardless of whether flower was placed
      isPlacingFlower = false;
      pendingFlowerColor = null;
    }
  }
}

function keyPressed() {
  if (key === " ") {
    debug = !debug;
    redraw = true;
  } else if (key >= "1" && key <= "9") {
    // Show popup for flower placement
    isPlacingFlower = true;
    pendingFlowerColor = null;
    document.getElementById('flowerPopup').classList.add('active');
  }
}

// get pixel ID for pixels array
function getPixelID(x, y, g = null) {
  let idx;
  if (g == null) {
    const d = pixelDensity();
    idx = 4 * d * (int(y) * d * width + int(x));

  } else {
    const d = g.pixelDensity();
    idx = 4 * d * (int(y) * d * g.width + int(x));
  }
  return idx;
}

// return difference in days
function dateDifference(start, end) {
  return (start - end) / (1000 * 3600 * 24);
}

// save triggered by menu
// need to tweak this to save the full res...
function saveImage() {
  let ret = drawEverything(saving=true);
  ret.save("floara.png");
}
