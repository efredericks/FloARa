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

// Add to global variables at the top
let hoveredFlower = null;
let activePlantPopup = null;

// Add to global variables at top
let plantInfo = {
  'Milkweed': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass']
  },
  'Nymphaea': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.05,
    propagationRadius: 50,
    suitableAreas: ['water']
  },
  'Piranha': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.15,
    propagationRadius: 150,
    suitableAreas: ['grass', 'water']
  }
};

// Add to global variables at the top
let propagationTimer = 0;
const PROPAGATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Add to global variables at the top
let plantFilter = 'all';

// load in background and flowers at full resolution
function preload() {
  // bg = loadImage("assets/img/gvsu-bg.jpg");
  // bg = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.png");;
  bg = loadImage("assets/img/gvsu-hd.jpeg");
  mask = loadImage("assets/img/gvsu-hd-mask.jpg");

  // mask = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.mask.png");
  overlay = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.overlay.png");

  // Initialize plant image arrays
  plant_images = {
    'Milkweed': [],
    'Nymphaea': [],
    'Piranha': []
  };

  // Load Milkweed images - using same image for all stages for now
  const milkweedImg = loadImage("assets/img/milkweed/Milkweed_5_outerglow.png");
  for (let i = 0; i < 5; i++) {
    plant_images['Milkweed'].push(milkweedImg);
  }

  // Load Nymphaea images
  for (let i = 1; i <= 5; i++) {
    const nymphaeaImg = loadImage(`assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${i}.png`);
    plant_images['Nymphaea'].push(nymphaeaImg);
  }

  // Load Piranha images - using Milkweed image as placeholder
  for (let i = 0; i < 5; i++) {
    plant_images['Piranha'].push(milkweedImg);
  }

  font = loadFont("assets/fonts/Quicksand-Medium.ttf");
  
  console.log("Preload complete. Plant images:", plant_images);
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
  // Update hovered flower
  updateHoveredFlower();
  
  if (redraw) drawEverything();

  // Check for propagation every 24 hours
  const now = Date.now();
  if (now - propagationTimer >= PROPAGATION_INTERVAL) {
    propagatePlants();
    propagationTimer = now;
  }

  if (frameCount % 20 == 0 && flowers.length < 10000 && window.adding_flowers) {
    flowers = addIndividualPlant(bg.width, bg.height, mask, flowers);
    redraw = true;
  }

  if (window.animate_scene) {
    redraw = true;
  }

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
  console.log("Drawing everything, saving:", saving);
  
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
      console.log("Available plant images:", plant_images);
      console.log("QR_map:", QR_map);
      
      for (let f of flowers) {
        // Skip if plant doesn't match current filter
        if (plantFilter !== 'all' && f.propagationType !== plantFilter) {
          continue;
        }
        
        console.log("Processing flower:", f);
        
        // Skip invalid flowers - allow QR_id: 0 (Milkweed)
        if (f.QR_id === undefined || f.QR_id === null || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
          console.warn("Skipping invalid flower - QR_id:", f.QR_id, "QR_map entry:", QR_map[f.QR_id]);
          continue;
        }

        let plantName = QR_map[f.QR_id].name;
        console.log("Plant name:", plantName);
        console.log("Plant images for this type:", plant_images[plantName]);

        let h_aspect = bg.height / h;
        let x = (f.location.x / w_aspect);
        let y = (f.location.y / h_aspect);

        // perspective for 'farther away'
        let sc = map(y, height, height * 0.2, 1.0, 0.001);
        let _w, _h, _img;

        // currently a day will change the plant
        let date_diff = Math.floor(dateDifference(now, new Date(f.timestamp)));
        let idx = 0;
        if ((date_diff / 5) > 4) idx = 4;
        else idx = Math.floor(date_diff / 5);

        console.log("Stage index:", idx);

        // Check if plant images are loaded
        if (!plant_images[plantName] || !plant_images[plantName][idx]) {
          console.warn("Plant image not loaded for flower:", {
            plantName,
            stage: idx,
            availableImages: plant_images[plantName]
          });
          continue;
        }

        _img = plant_images[plantName][idx];
        _w = (_img.width * QR_map[f.QR_id].scale) * sc;
        _h = (_img.height * QR_map[f.QR_id].scale) * sc;

        // magic numbers help with offset within image
        push();

        // Apply wind animation only to plants
        if (window.animate_scene) {
          shader(wind_material);
          wind_material.setUniform("offset", i);
          wind_material.setUniform('time', millis() / 2400);
          i++;
        }

        // Apply color tinting if the flower has a color
        if (f.color) {
          tint(f.color);
        }

        // Add visual indicator for propagated plants
        if (f.propagationType === 'propagated') {
          push();
          noFill();
          stroke(100, 255, 100, 100); // Subtle green glow
          strokeWeight(2);
          ellipse(x, y, _w * 1.2, _h * 1.2);
          pop();
        }

        // Add highlight glow effect if this is the hovered flower
        if (hoveredFlower === f) {
          // Draw glow effect
          push();
          noStroke();
          drawingContext.shadowBlur = 20;
          drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';
          // Increase scale slightly for glow effect
          let glowScale = 1.1;
          image(_img, x - (_w * glowScale) * .5, y - (_h * glowScale) * .5, 
                _w * glowScale, _h * glowScale, 0, 0, _img.width, _img.height);
          pop();
        }

        image(_img, x - _w * .5, y - _h * .5, _w, _h, 0, 0, _img.width, _img.height);
        pop();
      }
    }
  } else { // generate HQ image for saving
    console.log("Creating save graphics...");
    let to_save = createGraphics(bg.width, bg.height);
    to_save.background(0);
    to_save.image(bg, 0, 0);

    let now = new Date();
    console.log("Number of flowers to save:", flowers.length);
    
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
      let date_diff = Math.floor(dateDifference(now, new Date(f.timestamp)));
      let idx = 0;
      if ((date_diff / 5) > 4) idx = 4;
      else idx = Math.floor(date_diff / 5);

      let plantName = QR_map[f.QR_id].name;
      console.log("Processing plant for save:", plantName, "at stage", idx);

      // Check if plant images are loaded
      if (!plant_images[plantName] || !plant_images[plantName][idx]) {
        console.warn("Plant image not loaded for flower:", {
          plantName,
          stage: idx,
          availableImages: plant_images[plantName]
        });
        continue;
      }

      _img = plant_images[plantName][idx];
      _w = (_img.width * QR_map[f.QR_id].hd_scale) * sc;
      _h = (_img.height * QR_map[f.QR_id].hd_scale) * sc;

      console.log("Drawing plant at:", x, y, "with size:", _w, _h);
      to_save.image(_img, x - _w * .5, y - _h * .5, _w, _h, 0, 0, _img.width, _img.height);
    }
    
    console.log("Save graphics created successfully");
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
    console.log("Raw flower data from Firebase:", rawData);
    
    flowers = rawData.map(f => {
      // Try to find QR_id in different possible field names
      let qrId;
      if (f.QR_id !== undefined && f.QR_id !== null) {
        qrId = parseInt(f.QR_id);
      } else if (f.qr_id !== undefined && f.qr_id !== null) {
        qrId = parseInt(f.qr_id);
      } else if (f.type !== undefined && f.type !== null) {
        // Map type names to QR_ids
        switch(f.type.toLowerCase()) {
          case 'milkweed':
            qrId = 0;
            break;
          case 'nymphaea':
            qrId = 1;
            break;
          case 'piranha':
            qrId = 99;
            break;
          default:
            qrId = 0;
        }
      } else if (f.flowerType !== undefined && f.flowerType !== null) {
        // Map flowerType names to QR_ids
        switch(f.flowerType.toLowerCase()) {
          case 'milkweed':
            qrId = 0;
            break;
          case 'nymphaea':
            qrId = 1;
            break;
          case 'piranha':
            qrId = 99;
            break;
          default:
            qrId = 0;
        }
      } else {
        console.log("No valid QR_id found, defaulting to Milkweed (0):", f);
        qrId = 0;
      }

      // Validate the QR_id
      if (isNaN(qrId) || !QR_map[qrId]) {
        console.log("Invalid QR_id found, defaulting to Milkweed (0):", f);
        qrId = 0;
      }
      
      return {
        location: f.location,
        color: color(f.color || "white"),
        id: f.id,
        QR_id: qrId,
        timestamp: f.timestamp || new Date().toISOString(),
        propagationType: f.propagationType || 'manual' // Set default propagationType for existing plants
      };
    });
    
    console.log("Processed flowers:", flowers);
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
  const w_aspect = bg.width / width;
  const h_aspect = bg.height / (bg.height / w_aspect);
  
  // Convert mouse coordinates to image coordinates
  const imageX = mouseX * w_aspect;
  const imageY = mouseY * h_aspect;
  
  if (mouseButton === RIGHT) {
    // Handle right-click for flower removal
    if (imageX >= 0 && imageX <= bg.width && imageY >= 0 && imageY <= bg.height) {
      let closestFlower = null;
      let minDistance = Infinity;
      
      for (let i = 0; i < flowers.length; i++) {
        const flower = flowers[i];
        const dx = flower.location.x / w_aspect - mouseX;
        const dy = flower.location.y / h_aspect - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use larger radius for Milkweed (QR_id: 0)
        const clickRadius = flower.QR_id === 0 ? 80 / w_aspect : 40 / w_aspect;
        
        if (distance < clickRadius && distance < minDistance) {
          minDistance = distance;
          closestFlower = { index: i, flower: flower };
        }
      }
      
      // If hovering over a flower, prioritize that one for deletion
      if (hoveredFlower && !closestFlower) {
        const index = flowers.findIndex(f => f === hoveredFlower);
        if (index !== -1) {
          closestFlower = { index, flower: hoveredFlower };
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
        
        // Add confirmation message with flower type
        const message = document.createElement('p');
        const flowerType = QR_map[closestFlower.flower.QR_id].name;
        message.textContent = `Remove this ${flowerType}?`;
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
  } else if (mouseButton === LEFT && !isPlacingFlower) {
    // Handle left-click for plant information
    if (imageX >= 0 && imageX <= bg.width && imageY >= 0 && imageY <= bg.height) {
      let selectedFlower = null;
      let minDistance = Infinity;
      
      // First check if we're hovering over a flower
      if (hoveredFlower) {
        selectedFlower = hoveredFlower;
      } else {
        // Otherwise check for flowers within click radius
        for (let i = 0; i < flowers.length; i++) {
          const flower = flowers[i];
          const dx = flower.location.x / w_aspect - mouseX;
          const dy = flower.location.y / h_aspect - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Use larger radius for Milkweed (QR_id: 0)
          const clickRadius = flower.QR_id === 0 ? 80 / w_aspect : 40 / w_aspect;
          
          if (distance < clickRadius && distance < minDistance) {
            minDistance = distance;
            selectedFlower = flower;
          }
        }
      }
      
      if (selectedFlower) {
        showPlantInfo(selectedFlower);
      }
    }
  } else if (isPlacingFlower && pendingFlowerColor) {
    // Check if the clicked position is valid (on grass)
    const maskX = Math.floor(imageX);
    const maskY = Math.floor(imageY);
    const maskPixel = mask.get(maskX, maskY);
    
    // Get the selected plant type from the dropdown
    const plantTypeSelect = document.getElementById('plantType');
    const plantType = plantTypeSelect ? parseInt(plantTypeSelect.value) : 0;
    
    // If the mask pixel is black (0,0,0), it's a valid position (grass)
    if (maskPixel[0] === 0 && maskPixel[1] === 0 && maskPixel[2] === 0) {
      const plantName = QR_map[plantType].name;
      const suitableAreas = plantInfo[plantName].suitableAreas;
      
      if (isValidPlantLocation(imageX, imageY, suitableAreas)) {
        const newFlower = {
          location: {
            x: imageX,
            y: imageY
          },
          color: pendingFlowerColor,
          QR_id: plantType,
          timestamp: new Date().toISOString(),
          propagationType: 'manual'
        };
        
        // First add to local array to maintain current functionality
        flowers.push({
          location: newFlower.location,
          color: color(pendingFlowerColor),
          QR_id: plantType,
          timestamp: newFlower.timestamp,
          propagationType: 'manual'
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
    }
    
    // Reset placement state regardless of whether flower was placed
    isPlacingFlower = false;
    pendingFlowerColor = null;
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
  console.log("Starting save process...");
  console.log("Number of flowers:", flowers.length);
  
  // Create a new graphics buffer
  let saveBuffer = createGraphics(bg.width, bg.height);
  
  // Draw background
  saveBuffer.background(0);
  saveBuffer.image(bg, 0, 0);
  
  // Draw all flowers
  let now = new Date();
  for (let f of flowers) {
    if (!f.QR_id || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
      console.warn("Skipping invalid flower:", f);
      continue;
    }
    
    let plantName = QR_map[f.QR_id].name;
    console.log("Processing plant for save:", plantName);
    
    let x = f.location.x;
    let y = f.location.y;
    
    // Calculate perspective
    let sc = map(y, bg.height, bg.height * 0.2, 1.0, 0.001);
    
    // Calculate growth stage
    let date_diff = Math.floor(dateDifference(now, new Date(f.timestamp)));
    let idx = Math.min(4, Math.floor(date_diff / 5));
    console.log("Plant stage:", idx);
    
    // Get plant image
    if (!plant_images[plantName] || !plant_images[plantName][idx]) {
      console.warn("Plant image not loaded:", {
        plantName,
        stage: idx,
        availableImages: plant_images[plantName]
      });
      continue;
    }
    
    let _img = plant_images[plantName][idx];
    console.log("Plant image loaded:", _img.width, "x", _img.height);
    
    // Calculate dimensions
    let _w = (_img.width * QR_map[f.QR_id].hd_scale) * sc;
    let _h = (_img.height * QR_map[f.QR_id].hd_scale) * sc;
    console.log("Drawing plant at:", x, y, "with size:", _w, _h);
    
    // Draw plant
    saveBuffer.image(_img, x - _w * .5, y - _h * .5, _w, _h, 0, 0, _img.width, _img.height);
  }
  
  console.log("Saving image...");
  saveBuffer.save('floara.png');
  console.log("Save complete");
}

// Add new function to update hoveredFlower
function updateHoveredFlower() {
  if (width < height) return; // Skip in portrait mode
  
  const w_aspect = bg.width / width;
  const h_aspect = bg.height / (bg.height / w_aspect);
  
  // Convert mouse coordinates to image coordinates
  const mouseImageX = mouseX * w_aspect;
  const mouseImageY = mouseY * h_aspect;
  
  // Find the closest flower within hover radius
  let closestFlower = null;
  let minDistance = Infinity;
  
  for (let i = 0; i < flowers.length; i++) {
    const flower = flowers[i];
    const dx = flower.location.x / w_aspect - mouseX;
    const dy = flower.location.y / h_aspect - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Use larger radius for Milkweed (QR_id: 0)
    const hoverRadius = flower.QR_id === 0 ? 80 / w_aspect : 40 / w_aspect;
    
    if (distance < hoverRadius && distance < minDistance) {
      minDistance = distance;
      closestFlower = flower;
    }
  }
  
  hoveredFlower = closestFlower;
  if (hoveredFlower) redraw = true;
}

// Add new function to show plant information
function showPlantInfo(flower) {
  // If there's already an active popup, don't create a new one
  if (activePlantPopup) {
    return;
  }

  const plantName = QR_map[flower.QR_id].name;
  const placementDate = new Date(flower.timestamp);
  const ageDays = Math.floor((new Date() - placementDate) / (1000 * 60 * 60 * 24));
  const growthStageIndex = Math.min(4, Math.floor(ageDays / 5));
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  document.body.appendChild(overlay);
  
  // Create info popup
  const popup = document.createElement('div');
  popup.className = 'plant-info-popup';
  activePlantPopup = popup; // Store reference to active popup
  
  // Add content
  const content = document.createElement('div');
  content.className = 'plant-info-content';
  content.innerHTML = `
    <h2>${plantName}</h2>
    <div class="info-section">
      <h4>Plant Details</h4>
      <p>Age: ${ageDays} days</p>
      <p>Growth Stage: ${growthStageIndex + 1} of 5</p>
      <p>Planted: ${placementDate.toLocaleDateString()} at ${placementDate.toLocaleTimeString()}</p>
      <p>Type: ${flower.propagationType === 'manual' ? 'Manually Planted' : 'Naturally Propagated'}</p>
      ${flower.propagationType === 'propagated' ? `<p>Parent Plant ID: ${flower.parentId}</p>` : ''}
    </div>
  `;
  popup.appendChild(content);
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'plant-info-close';
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(popup);
    activePlantPopup = null; // Clear the active popup reference
  };
  popup.appendChild(closeBtn);
  
  document.body.appendChild(popup);
}

// Add new function for plant propagation
function propagatePlants() {
  console.log("Starting plant propagation...");
  
  for (const flower of flowers) {
    const plantName = QR_map[flower.QR_id].name;
    const plant = plantInfo[plantName];
    
    console.log(`Checking propagation for ${plantName}...`);
    
    // Only propagate if random chance succeeds
    if (Math.random() < plant.propagationRate) {
      console.log(`Propagation chance succeeded for ${plantName}`);
      
      // Try to find a suitable location within propagation radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * plant.propagationRadius;
      const newX = flower.location.x + Math.cos(angle) * distance;
      const newY = flower.location.y + Math.sin(angle) * distance;
      
      console.log(`Attempting propagation at location: (${newX}, ${newY})`);
      
      // Check if the new location is valid
      if (isValidPlantLocation(newX, newY, plant.suitableAreas)) {
        console.log("Location is valid for propagation");
        
        // Create the new flower data
        const newFlower = {
          location: { x: newX, y: newY },
          color: flower.color.toString(), // Convert p5 color to string
          QR_id: flower.QR_id,
          timestamp: new Date().toISOString(),
          propagationType: 'propagated',
          parentId: flower.id,
          type: plantName // Add plant type for easier querying
        };
        
        console.log("Attempting to save to Firestore:", newFlower);
        
        // Add to Firestore first
        if (window.addFlower) {
          window.addFlower(newFlower)
            .then(flowerId => {
              if (flowerId) {
                console.log(`Successfully saved to Firestore with ID: ${flowerId}`);
                // Only add to local array after successful database save
                newFlower.id = flowerId;
                flowers.push({
                  ...newFlower,
                  color: color(newFlower.color) // Convert string color back to p5 color
                });
                redraw = true;
              } else {
                console.error("Firestore returned null ID for propagated plant");
              }
            })
            .catch(error => {
              console.error("Error saving propagated plant to Firestore:", error);
            });
        } else {
          console.error("window.addFlower is not defined - Firestore integration may be missing");
        }
      } else {
        console.log("Location is not valid for propagation");
      }
    } else {
      console.log(`Propagation chance failed for ${plantName}`);
    }
  }
}

// Add function to check if location is valid for plant type
function isValidPlantLocation(x, y, suitableAreas) {
  // Get the pixel color at the location
  const maskX = Math.floor(x);
  const maskY = Math.floor(y);
  const maskPixel = mask.get(maskX, maskY);
  
  // Check if the location is within bounds
  if (maskX < 0 || maskX >= mask.width || maskY < 0 || maskY >= mask.height) {
    return false;
  }
  
  // Determine the area type based on mask color
  let areaType;
  if (maskPixel[0] === 0 && maskPixel[1] === 0 && maskPixel[2] === 0) {
    areaType = 'grass';
  } else if (maskPixel[0] === 255 && maskPixel[1] === 255 && maskPixel[2] === 255) {
    areaType = 'water';
  } else {
    return false;
  }
  
  // Check if the area type is suitable for the plant
  return suitableAreas.includes(areaType);
}

// Add new function for filtering plants
function filterPlants(filter) {
  plantFilter = filter;
  redraw = true;
}
