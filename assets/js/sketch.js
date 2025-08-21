// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// global vars
let hi_res_bg, hi_res_mask;
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

let modalActive = false;

// play from start variables
let animating_flowers = []; // backup list of flowers from firebase
let animating_index = 0; // current index to draw
let is_animating = false; // flag
let animate_interval = 20; // mod for frameCount when re-adding flowers to scene

// temp variables
let debug = false;
let wind_on = true;

let font;
let ctx;

// Add to global variables at the top
let hoveredFlower = null;
let activePlantPopup = null;

// Add to global variables at the top
let propagationTimer = 0;
const PROPAGATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Add to global variables at the top
let plantFilter = 'all';
let saveScale;

// Add this near the top of the file, after global vars
const plantDetails = {
  0: {
    commonName: "Milkweed",
    scientificName: "Asclepias syriaca",
    family: "Apocynaceae (Milkweed family)",
    height: "2-6' (0.6-1.8 m)",
    age: "Perennial",
    habitat: "Meadows, fields, roadsides, sunny areas",
    bark: "Green, smooth stem with milky sap",
    leaf: "Opposite, oblong to elliptic, 4-8\" long, upper surface smooth, lower surface hairy",
    flowers: "Pink to purplish, fragrant, in large rounded clusters (umbels)",
    fruit: "Spindle-shaped pod (3-4\"), covered with soft hairs, splits to release silky seeds",
    description: "Milkweed is a native perennial herb vital for monarch butterflies. It produces fragrant pink flowers and milky sap. The plant is toxic to most animals but essential for many insects.",
    artist: "Megan Daniels, colored by Argo Mendoza-Jones",
    image: null
  },
  1: {
    commonName: "Nymphaea",
    scientificName: "Nymphaea odorata",
    family: "Nymphaeaceae (Water Lily family)",
    height: "Floating leaves up to 10\" across",
    age: "Perennial",
    habitat: "Ponds, lakes, slow streams, shallow water",
    bark: "N/A (aquatic herb)",
    leaf: "Round, floating, green above, purplish below, up to 10\" wide",
    flowers: "Large, white, fragrant, 20-30 petals, yellow center, floats on water",
    fruit: "Round, spongy berry, seeds dispersed in water",
    description: "Nymphaea, or American white water lily, is an aquatic plant with large floating leaves and showy white flowers. It provides habitat for aquatic wildlife.",
    artist: "Ella Kane",
    image: null
  },
  2: {
    commonName: "Arrow Arum",
    scientificName: "Peltandra virginica",
    family: "Araceae (Arum family)",
    height: "2-3' (0.6-0.9 m)",
    age: "Perennial",
    habitat: "Wetlands, marshes, shallow water",
    bark: "N/A (herbaceous)",
    leaf: "Arrow-shaped, glossy green, 8-12\" long",
    flowers: "Greenish-white spadix, partially enclosed by a hood-like spathe",
    fruit: "Cluster of green berries turning black",
    description: "Arrow Arum is a wetland plant with striking arrow-shaped leaves. It thrives in shallow water and is important for wetland wildlife.",
    artist: "Aimi Hettinger",
    image: null
  },
  3: {
    commonName: "Paper Birch",
    scientificName: "Betula papyrifera",
    family: "Betulaceae (Birch family)",
    height: "50-70' (15-21 m)",
    age: "Up to 100 years",
    habitat: "Moist woods, riverbanks, cool climates",
    bark: "White, peeling in papery strips, with dark horizontal lines",
    leaf: "Oval, pointed, double-toothed edges, 2-4\" long",
    flowers: "Catkins (male and female), wind-pollinated",
    fruit: "Small winged nutlets in drooping clusters",
    description: "Paper birch is a medium-sized tree known for its distinctive white, peeling bark. It is important for wildlife and was used by Indigenous peoples for canoes and containers.",
    artist: "Aimi Hettinger",
    image: null
  },
  4: {
    commonName: "PawPaw",
    scientificName: "Asimina triloba",
    family: "Annonaceae (Custard Apple family)",
    height: "15-30' (4.5-9 m)",
    age: "Up to 100 years",
    habitat: "Rich, moist woods, riverbanks, understory",
    bark: "Smooth, gray-brown, becoming rough with age",
    leaf: "Large, simple, alternate, 6-12\" long, oblong to obovate, smooth margins",
    flowers: "Maroon to purple, 1-1.5\" across, 3 sepals, 6 petals, unpleasant odor",
    fruit: "Large, oblong, green to yellow, 3-6\" long, tropical flavor, largest native fruit in US",
    description: "Pawpaw is a small deciduous tree native to eastern North America. It produces the largest edible fruit native to the United States, with a tropical flavor reminiscent of banana and mango. The tree thrives in rich, moist soils and is an important understory species.",
    artist: "Argo Mendoza-Jones",
    image: null
  },
  5: {
    commonName: "Eastern Cottonwood",
    scientificName: "Populus deltoides",
    family: "Salicaceae (Willow family)",
    height: "80-100' (24-30 m)",
    age: "Up to 100 years",
    habitat: "Riverbanks, floodplains, moist areas",
    bark: "Gray, deeply furrowed, becoming rough with age",
    leaf: "Triangular to deltoid, 3-6\" long, coarsely toothed margins, petiole flattened",
    flowers: "Catkins (male and female on separate trees), wind-pollinated",
    fruit: "Small capsules with cottony seeds, dispersed by wind",
    description: "Eastern cottonwood is a large, fast-growing deciduous tree native to North America. It's known for its triangular leaves and cotton-like seeds that disperse in the wind. An important riparian species that stabilizes riverbanks and provides habitat for wildlife.",
    artist: "Ella Kane",
    image: null
  },
  6: {
    commonName: "Wild Rice",
    scientificName: "Zizania aquatica",
    family: "Poaceae (Grass family)",
    height: "3-10' (0.9-3 m)",
    age: "Annual",
    habitat: "Shallow water, marshes, slow streams",
    bark: "N/A (grass)",
    leaf: "Long, narrow, grass-like, 1-2\" wide, up to 3' long",
    flowers: "Small, wind-pollinated, in panicles at stem tips",
    fruit: "Edible grains, 0.5-1\" long, dark brown to black",
    description: "Wild rice is an annual aquatic grass native to North America. It grows in shallow water and produces edible grains that have been harvested by indigenous peoples for centuries. Important food source for waterfowl and other wildlife.",
    artist: "Argo Mendoza-Jones",
    image: null
  },
  99: {
    commonName: "Piranha Plant",
    scientificName: "Piranha fictus",
    family: "Fictionaceae",
    height: "Varies (often depicted 2-4')",
    age: "Eternal (video game logic)",
    habitat: "Pipes, fantasy worlds, Mario games",
    bark: "Green stem, red head with white spots",
    leaf: "Large, cartoonish, green",
    flowers: "Toothy mouth, sometimes spits fire",
    fruit: "None (dangerous to approach)",
    description: "The Piranha Plant is a fictional, carnivorous plant from the Mario universe. It lurks in pipes and snaps at passersby. Not recommended for gardens!",
    artist: "https://www.spriters-resource.com/snes/smarioworld/sheet/143244/",
    image: null
  }
};

let plant_images_orig;

// load in background and flowers at full resolution
function preload() {
  // keeping a hires version, but scaling to 50% immediately as mobile chrome can't handle it
  hi_res_bg = loadImage("assets/img/bg-final/finalBG.jpg");
  // hi_res_bg = loadImage("assets/img/BG-Retouch.jpg");

  // bg = loadImage("assets/img/BG-Retouch-Half.jpg");
  // bg = loadImage("assets/img/BG-Retouch.jpg");
  // hi_res_mask = loadImage("assets/img/bg-final/finalBG-mask.png");
  // mask = loadImage("assets/img/BG-Retouch-mask-half.png");
  // mask = loadImage("assets/img/BG-Retouch-mask.png");

  bg = loadImage("assets/img/bg-final/finalBG-half.png");
  mask = loadImage("assets/img/bg-final/finalBG-half-mask.png");

  // overlay = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.overlay.png");

  // Initialize plant image arrays
  plant_images = {
    'Milkweed': [],
    'Nymphaea': [],
    'Piranha': [],
    'Arrow-Arum-Peltandra-Virginica': [],
    'Paper-Birch': [],
    'Populus-Deltoides': [],
    'Zizania-Aquatica': [],
    'PawPaw': [],
  };
  plant_images_orig = {
    'Milkweed': [],
    'Nymphaea': [],
    'Piranha': [],
    'Arrow-Arum-Peltandra-Virginica': [],
    'Paper-Birch': [],
    'Populus-Deltoides': [],
    'Zizania-Aquatica': [],
    'PawPaw': [],
  };

  // Load Milkweed images - using same image for all stages for now
  // const milkweedImg = loadImage("assets/img/milkweed/Milkweed_5_outerglow.png");
  // for (let i = 0; i < 5; i++) {
  //   plant_images_orig['Milkweed'].push(milkweedImg);
  // }
  for (let i = 1; i <= 5; i++) {
    // const milkweedImg = loadImage(`assets/img/milkweed/milkweed_0${i}-color.png`);
    // const milkweedImg = loadImage(`assets/img/milkweed/milkweed_0${i}-color.png`);
    const milkweedImg = loadImage(`assets/img/plants-live/AsclepiasSyriaca_Milkweed_MeganDaniels/Milkweed_0${i}_LG.png`);
    plant_images['Milkweed'].push(milkweedImg);
    plant_images_orig['Milkweed'].push(loadImage(`assets/img/milkweed/milkweed_0${i}-color.png`));
  }

  // Load Nymphaea images
  for (let i = 1; i <= 5; i++) {
    // const nymphaeaImg = loadImage(`assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${i}.png`);
    const nymphaeaImg = loadImage(`assets/img/plants-live/NymphaeaOdorata_Lily_Ella Kane/nymphaea_odorata_stage${i}_LG.png`);
    plant_images['Nymphaea'].push(nymphaeaImg);
    plant_images_orig['Nymphaea'].push(loadImage(`assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${i}.png`));
  }

  // Load Peltandra-Virginica images
  for (let i = 1; i <= 5; i++) {
    // const peltandraImg = loadImage(`assets/img/Arrow-Arum-Peltandra-Virginica/Colored/Arrow_Arum_Stage_${i}.png`);
    const peltandraImg = loadImage(`assets/img/plants-live/PeltandraVirginica_Arrow_Aimi/ArrowArumStage${i}_LG.png`);
    plant_images['Arrow-Arum-Peltandra-Virginica'].push(peltandraImg);
    plant_images_orig['Arrow-Arum-Peltandra-Virginica'].push(loadImage(`assets/img/Arrow-Arum-Peltandra-Virginica/Colored/Arrow_Arum_Stage_${i}.png`));
  }

  // Load Paper Birch images
  for (let i = 1; i <= 5; i++) {
    // const birchImg = loadImage(`assets/img/Paper-Birch/Colored/Paper_Birch_Stage_${i}.png`);
    const birchImg = loadImage(`assets/img/plants-live/BetulaPapyrifera_PaperBirchTree_Aimi/PaperBirch_LG${i}.png`);
    plant_images['Paper-Birch'].push(birchImg);
    plant_images_orig['Paper-Birch'].push(loadImage(`assets/img/Paper-Birch/Colored/Paper_Birch_Stage_${i}.png`));
  }

  // Load PawPaw images
  for (let i = 1; i <= 4; i++) {
    // const pawpawImg = loadImage(`assets/img/PawPaw/pawpaw${i}.png`);
    const pawpawImg = loadImage(`assets/img/plants-live/AsiminaTriloba_PawPaw-Argo/pawpaw${i}-LG.png`);
    plant_images['PawPaw'].push(pawpawImg);
    plant_images_orig['PawPaw'].push(loadImage(`assets/img/PawPaw/pawpaw${i}.png`));
  }
  // double for the fifth for temporary fix
  plant_images['PawPaw'].push(loadImage(`assets/img/plants-live/AsiminaTriloba_PawPaw-Argo/pawpaw4-LG.png`));
  plant_images_orig['PawPaw'].push(loadImage(`assets/img/PawPaw/pawpaw4.png`));

  // Load Populus images
  for (let i = 1; i <= 5; i++) {
    // const populusImg = loadImage(`assets/img/Populus-Deltoides/populus_deltoides_stage${i}.png`);
    const populusImg = loadImage(`assets/img/plants-live/PopulusDeltoides_Cotonwood_EllaKane/populus_deltoides_stage${i}_LG.png`);
    plant_images['Populus-Deltoides'].push(populusImg);
    plant_images_orig['Populus-Deltoides'].push(loadImage(`assets/img/Populus-Deltoides/populus_deltoides_stage${i}.png`));
  }

  // Load Zizania images
  for (let i = 1; i <= 5; i++) {
    // const zizaniaImg = loadImage(`assets/img/Zizania-Aquatica/Zizania-Aquatica-${i}.png`);
    const zizaniaImg = loadImage(`assets/img/plants-live/ZizaniaAquatica_mnomen_argo/Manoomin${i}_LG.PNG`);
    plant_images['Zizania-Aquatica'].push(zizaniaImg);
    plant_images_orig['Zizania-Aquatica'].push(loadImage(`assets/img/Zizania-Aquatica/Zizania-Aquatica-${i}.png`));
  }

  // Load Piranha images - using Milkweed image as placeholder
  // for (let i = 0; i < 5; i++) {
  plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-base-1.png"));
  plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-vine-1.png"));
  plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-vine-1.png"));
  plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-head-1.png"));
  plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-head-2.png"));

  plant_images_orig['Piranha'].push(loadImage("assets/img/Piranha/piranha-base-1.png"));
  plant_images_orig['Piranha'].push(loadImage("assets/img/Piranha/piranha-vine-1.png"));
  plant_images_orig['Piranha'].push(loadImage("assets/img/Piranha/piranha-vine-1.png"));
  plant_images_orig['Piranha'].push(loadImage("assets/img/Piranha/piranha-head-1.png"));
  plant_images_orig['Piranha'].push(loadImage("assets/img/Piranha/piranha-head-2.png"));
  // }

  // font = loadFont("assets/fonts/Quicksand-Medium.ttf");
  font = loadFont("assets/fonts/BenchNine-Regular.ttf");

  console.log("Preload complete. Plant images:", plant_images);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  // pixelDensity(1);
  noSmooth();

  // bg.resize(bg.width * 0.5, 0);
  // mask.resize(mask.width * 0.5, 0);

  textFont(font);
  textAlign(CENTER);

  saveScale = hi_res_bg.width / bg.width;

  // resize flowers to avoid crunchy rescaling later
  // let w_aspect = bg.width / width;
  // let h = bg.height / w_aspect;
  // let h_aspect = bg.height / h;
  // for (const [QR_id, value] of Object.entries(QR_map)) {
  //   for (let img of plant_images_orig[value.name]) {
  //     let _w = (img.width * QR_map[QR_id].scale);
  //     let _h = (img.height * QR_map[QR_id].scale);

  //     let s_img = createImage(img.width, img.height);
  //     s_img.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
  //     s_img.resize(_w, _h);
  //     plant_images[value.name].push(s_img);
  //   }
  // }


  // Use real-time Firestore listener if available
  if (window.subscribeToFlowers) {
    window.subscribeToFlowers(function (rawData) {
      // Process data as in loadData()
      flowers = rawData.map(f => {
        // Try to find QR_id in different possible field names
        let qrId;
        if (f.QR_id !== undefined && f.QR_id !== null) {
          qrId = parseInt(f.QR_id);
        } else if (f.qr_id !== undefined && f.qr_id !== null) {
          qrId = parseInt(f.qr_id);
        } else if (f.type !== undefined && f.type !== null) {
          // Map type names to QR_ids
          switch (f.type.toLowerCase()) {
            case 'milkweed':
              qrId = 0;
              break;
            case 'nymphaea':
              qrId = 1;
              break;
            case 'arrow-arum-peltandra-virginica':
              qrId = 2;
              break;
            case 'paper-birch':
              qrId = 3;
              break;
            case 'piranha':
              qrId = 99;
              break;
            default:
              qrId = 0;
          }
        } else if (f.flowerType !== undefined && f.flowerType !== null) {
          // Map flowerType names to QR_ids
          switch (f.flowerType.toLowerCase()) {
            case 'milkweed':
              qrId = 0;
              break;
            case 'nymphaea':
              qrId = 1;
              break;
            case 'arrow-arum-peltandra-virginica':
              qrId = 2;
              break;
            case 'paper-birch':
              qrId = 3;
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

        // have a random update frame - mainly for piranha but may want to animate others?
        const update_frame = int(random(20, 50));

        return {
          location: f.location,
          color: color(f.color || "white"),
          id: f.id,
          QR_id: qrId,
          timestamp: f.timestamp || new Date().toISOString(),
          current_frame: -1,
          update_frame: update_frame,
          propagationType: f.propagationType || 'manual' // Set default propagationType for existing plants
        };
      }).filter(f => f !== null);
      redraw = true;
    });
  } else {
    // Fallback: one-time load
    loadData(); // Load flower data from Firestore
  }
  redraw = false;

  // Setup popup event listeners
  const popup = document.getElementById('flowerPopup');
  const cancelBtn = document.getElementById('cancelPlacement');
  const placeBtn = document.getElementById('placeFlower');
  // const colorInput = document.getElementById('flowerColor');
  // const colorPreview = document.querySelector('.color-preview');

  cancelBtn.addEventListener('click', () => {
    isPlacingFlower = false;
    pendingFlowerColor = null;
    popup.classList.remove('active');
    // Note: hoveredFlower will be restored by updateHoveredFlower() in the next draw cycle
  });

  placeBtn.addEventListener('click', () => {
    if (isPlacingFlower) {
      pendingFlowerColor = "#ff00ff";//colorInput.value;
      popup.classList.remove('active');
    }
    // Note: hoveredFlower will be restored by updateHoveredFlower() in the next draw cycle
  });

  // colorInput.addEventListener('input', (e) => {
  //   colorPreview.style.backgroundColor = e.target.value;
  // });

  // Initialize color preview
  // colorPreview.style.backgroundColor = colorInput.value;

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

  if (!is_animating) {
    // // Update hovered flower
    // updateHoveredFlower();

    if (redraw) drawEverything();
    // Update hovered flower
    updateHoveredFlower();

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


    if (touches.length > 2) {
      if (touch_timer == 0)
        window.shaders_on = !window.shaders_on;
      touch_timer = 10;
    }
    if (touch_timer > 0) touch_timer--; // avoid multi toggling
  } else {
    // animate from beginning until all flowers placed
    drawEverything();

    // transition timing
    if (animating_index < 0) animating_index++;
    else {
      window.shaders_on = false;

      if ((flowers.length < animating_flowers.length) && (frameCount % animate_interval == 0)) {
        flowers.push(animating_flowers[animating_index]);

        // sort flowers array on y location so things in front don't get overdrawn
        flowers = flowers.sort((x, y) => {
          return x.location.y > y.location.y;
        });

        // increment index and check if done
        animating_index++;
        if (animating_index > animating_flowers.length - 1) { // done
          is_animating = false;
          animating_index = animating_flowers.length - 1;
        }
      }
    }
  }

  // things that happen at the end regardless of state
  if (window.shaders_on) {
    rgb_fs.setUniform("_noise", 0.3);
    filter(rgb_fs);
    tv_fs.setUniform("_noise", 0.5 * cos(millis() * 0.01));
    filter(tv_fs);
    dither_fs.setUniform("which", 2);
    filter(dither_fs);
  }
}

function doubleClicked() {
  // window.shaders_on = !window.shaders_on;
  if (!modalActive)
    animateStart();
}

// return scaled flower image information
function calculateImageInfo(flower, bg, saving = false) {
  if (!flower || !flower.location || typeof flower.location.x !== 'number' || typeof flower.location.y !== 'number') {
    return null;
  }
  let now = new Date();
  let plantName = QR_map[flower.QR_id].name;

  let idx = 0;
  let date_diff = Math.floor(dateDifference(now, new Date(flower.timestamp)));

  // console.log(flower.QR_id,date_diff)

  // handle piranha specially as final two images are its animated head
  if (flower.QR_id == 99) {
    // Calculate base growth stage based on age
    // if ((date_diff % 5) > 4) idx = 4;
    // else idx = Math.floor(date_diff % 5);
    idx = date_diff;
    if (date_diff > 4) idx = 4;

    // For stages 3 and 4 (head stages), animate between them
    if (idx >= 3) {
      // Use a consistent animation cycle - every 30 frames (about 0.5 seconds at 60fps)
      let animationFrame = Math.floor(frameCount / 30) % 2;
      idx = 3 + animationFrame; // This will be 3 or 4 for the animated head
    }
  } else {
    idx = date_diff;
    if (date_diff > 4) idx = 4;
    // Calculate growth stage based on plant age
    // if ((date_diff % 5) > 4) idx = 4;
    // else idx = Math.floor(date_diff % 5);
    // Remove the GLOB_IDX override to let plants progress naturally
    // idx = GLOB_IDX;
  }

  // debugging - uncomment to force all plants to same stage
  idx = GLOB_IDX;
  // console.log(idx, date_diff)

  let w_aspect = bg.width / width;
  if (saving) w_aspect = 1.0;
  let h = bg.height / w_aspect;
  let h_aspect = bg.height / h;
  if (saving) h_aspect = 1.0;
  let x = (flower.location.x / w_aspect);
  let y = (flower.location.y / h_aspect);

  // Check if plant images are loaded
  if (!plant_images[plantName] || !plant_images[plantName][idx] || !plant_images_orig[plantName] || !plant_images_orig[plantName][idx]) {
    return null;
  }


  let _img;
  if (saving)
    _img = plant_images_orig[plantName][idx];
  else
    _img = plant_images[plantName][idx];

  // Calculate base scaling based on plant type
  let scale = QR_map[flower.QR_id].scale || 0.4;
  if (saving)
    scale = QR_map[flower.QR_id].hd_scale;




  // Calculate zoom factor based on background image scaling
  let bgScale = width / bg.width;
  if (saving) bgScale = 1.0;
  let zoomFactor = map(bgScale, 0.5, 2.0, 1.0, 0.5); // Adjust plant size based on zoom

  // Use a more conservative perspective scaling to prevent oversized plants
  let perspectiveScale = map(y, height, height * 0.2, 0.8, 0.4);

  let band_scale = 1.0;
  if (flower.location.y < bg.height * 0.3)
    band_scale = scale_bands[0];
  else if (flower.location.y < bg.height * 0.5)
    band_scale = scale_bands[1];
  else if (flower.location.y < bg.height * 0.7)
    band_scale = scale_bands[2];
  else
    band_scale = scale_bands[3];


  // Calculate final dimensions with zoom-aware scaling
  // let _w = _img.width * scale * perspectiveScale * zoomFactor * band_scale;
  // let _h = _img.height * scale * perspectiveScale * zoomFactor * band_scale;
  bgScale = constrain(bgScale, 0.0001, 1.0);

  let _w = _img.width * scale * band_scale * bgScale;
  let _h = _img.height * scale * band_scale * bgScale;

  // if (saving && flower.QR_id == 99) console.log(x, y, _w, _h);


  /*

  // Limit maximum size to prevent oversized plants
  let maxSize = 120; // Reduced for better proportions
  if (_w > maxSize || _h > maxSize) {
    let aspectRatio = _w / _h;
    if (_w > _h) {
      _w = maxSize;
      _h = maxSize / aspectRatio;
    } else {
      _h = maxSize;
      _w = maxSize * aspectRatio;
    }
  }

  // Ensure minimum size for visibility
  let minSize = 20;
  if (_w < minSize || _h < minSize) {
    let aspectRatio = _w / _h;
    if (_w < _h) {
      _w = minSize;
      _h = minSize / aspectRatio;
    } else {
      _h = minSize;
      _w = minSize * aspectRatio;
    }
  }
    */

  return { x: x, y: y, w: _w, h: _h, idx: idx, plantName: plantName };
}

function drawFlower(f, _bg, surf = null) {
  // Skip if plant doesn't match current filter
  if (plantFilter !== 'all' && f.propagationType !== plantFilter) {
    return;
  }
  // Skip invalid flowers - allow QR_id: 0 (Milkweed)
  if (f.QR_id === undefined || f.QR_id === null || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
    return;
  }
  // Defensive: skip if location is invalid
  if (!f.location || typeof f.location.x !== 'number' || typeof f.location.y !== 'number') {
    return;
  }
  let saving = false;
  if (surf !== null) saving = true;
  let image_info = calculateImageInfo(f, _bg, saving);
  if (!image_info) return;

  let plantName = image_info.plantName;
  let idx = image_info.idx;

  let x = image_info.x;
  let y = image_info.y;

  let _w, _h, _img;

  // Check if plant images are loaded
  if (!plant_images[plantName] || !plant_images[plantName][idx] || !plant_images_orig[plantName] || !plant_images_orig[plantName][idx]) {
    return;
  }

  if (saving)
    _img = plant_images_orig[plantName][idx];
  else
    _img = plant_images[plantName][idx];

  _w = image_info.w;
  _h = image_info.h;

  // to canvas
  if (surf === null) {
    // magic numbers help with offset within image
    push();

    // Apply wind animation only to plants
    if (window.animate_scene) {
      shader(wind_material);
      wind_material.setUniform("offset", random(-0.05, 0.05));//i);
      wind_material.setUniform('time', millis() / plantInfo[plantName].windDivider);
    }

    // piranha
    if (f.QR_id == 99) {
      let glowScale = 1.0;
      if (hoveredFlower === f) {
        glowScale = 1.1;
      }
      // incorporate hover scaling
      let _w2 = image_info.w;
      let _h2 = image_info.h;
      let _x = x - (_w2 * glowScale) * .5;
      let _y = y - (_h2 * glowScale);

      let max_idx = constrain(idx, 0, 2);
      for (let i = 0; i <= max_idx; i++) {
        let _img2 = plant_images[plantName][i];
        if (saving) _img2 = plant_images_orig[plantName][i];
        image(_img2, _x, _y, _w2 * glowScale, _h2 * glowScale, 0, 0, _img2.width, _img2.height);
        _y -= _h2;
      }
      if (idx >= 3) {
        // Use the same animation logic as in calculateImageInfo
        let animationFrame = Math.floor(frameCount / 30) % 2;
        let anim_idx = 3 + animationFrame;
        let _img2 = plant_images[plantName][anim_idx];
        if (saving) _img2 = plant_images_orig[plantName][anim_idx];
        image(_img2, _x, _y, _w2 * glowScale, _h2 * glowScale, 0, 0, _img2.width, _img2.height);
      }

      pop();
    } else {
      if (debug) {
        let _x = x - (_img.width) * .5;
        let _y = y - (_img.height);
        push();
        if (hoveredFlower == f) stroke(color(255, 255, 0))
        else
          stroke(0);
        noFill();
        rect(_x, _y, _img.width, _img.height);
        fill(color(255, 0, 255))
        stroke(0);
        text(`${Math.floor(x - _w * .5)}:${Math.floor(y - _h * .5 - _h * .5)}`, x - _w * .5, y - _h * .5 - _h * 0.5);
        pop();
      }

      // Add highlight glow effect if this is the hovered flower
      let glowScale = 1.0;
      if (hoveredFlower === f) {
        glowScale = 1.1;
      }

      // incorporate hover scaling
      let _w2 = image_info.w;
      let _h2 = image_info.h;
      let _x = x - (_w2 * glowScale) * .5;
      let _y = y - (_h2 * glowScale);
      image(_img, _x, _y, _w2 * glowScale, _h2 * glowScale, 0, 0, _img.width, _img.height);

      pop();
    }
  } else {
    // to saved image surface

    surf.push();
    // piranha
    if (f.QR_id == 99) {
      let glowScale = 1.0;
      // incorporate hover scaling
      let xOff = hi_res_bg.width / bg.width;
      let yOff = hi_res_bg.height / bg.height;

      let _w2 = image_info.w;
      let _h2 = image_info.h;
      let _x = (x * xOff) - (_w2 * glowScale) * .5 + _w2 * .5;
      let _y = (y * yOff) - (_h2 * glowScale) + _h2 * .5;

      // let _w2 = image_info.w;
      // let _h2 = image_info.h;
      // let _x = x - (_w2 * glowScale) * .5;
      // let _y = y - (_h2 * glowScale);

      let max_idx = constrain(idx, 0, 2);
      for (let i = 0; i <= max_idx; i++) {
        let _img2 = plant_images[plantName][i];
        if (saving)
          _img2 = plant_images_orig[plantName][i];
        surf.image(_img2, _x, _y, _w2 * glowScale, _h2 * glowScale, 0, 0, _img2.width, _img2.height);
        _y -= _h2;
      }
      if (idx >= 3) {
        // Use the same animation logic as in calculateImageInfo
        let animationFrame = Math.floor(frameCount / 30) % 2;
        let anim_idx = 3 + animationFrame;
        let _img2 = plant_images[plantName][anim_idx];
        if (saving)
          _img2 = plant_images_orig[plantName][anim_idx];
        surf.image(_img2, _x, _y, _w2 * glowScale, _h2 * glowScale, 0, 0, _img2.width, _img2.height);
      }
    } else {
      // Add highlight glow effect if this is the hovered flower
      let glowScale = 1.0;

      // incorporate hover scaling
      let xOff = hi_res_bg.width / bg.width;
      let yOff = hi_res_bg.height / bg.height;

      let _w2 = image_info.w;
      let _h2 = image_info.h;
      let _x = (x * xOff) - (_w2 * glowScale) * .5 + _w2 * .5;
      let _y = (y * yOff) - (_h2 * glowScale) + _h2 * .5;


      // _x *= xOff;
      // _y *= yOff;




      surf.image(_img, _x, _y, _w2 * glowScale, _h2 * glowScale, 0, 0, _img.width, _img.height);
    }
  }
}

// draw everything with respect to the canvas size
function drawEverything(saving = false) {
  // console.log("Drawing everything, saving:", saving);

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

      // EMPTY STATE HANDLING
      // Only count flowers that match the current filter
      let visibleFlowers = flowers.filter(f => plantFilter === 'all' || f.propagationType === plantFilter);
      if (visibleFlowers.length === 0 && frameCount > 20) { // allow to settle first
        // push();
        // fill(255, 200, 200);
        // textSize(width * 0.04);
        // textAlign(CENTER, CENTER);
        // text("No flowers yet!", width / 2, height / 2);
        // pop();
        return;
      }

      // Sort flowers by Y position for proper z-ordering (farther flowers drawn first)
      let sortedFlowers = [...flowers].sort((a, b) => {
        if (!a.location || !b.location) return 0;
        return a.location.y - b.location.y;
      });

      let i = 0;
      for (let f of sortedFlowers) {
        drawFlower(f, bg);
      }
    }
  } else { // generate HQ image for saving
    alert("This is defunct.")
    /*
    // console.log("Creating save graphics...");
    let to_save = createGraphics(bg.width, bg.height);
    to_save.background(0);
    to_save.image(bg, 0, 0);

    let now = new Date();
    // console.log("Number of flowers to save:", flowers.length);

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
      let idx = Math.min(4, Math.floor(date_diff / 5));
      console.log("Plant stage:", idx);

      let plantName = QR_map[f.QR_id].name;
      // console.log("Processing plant for save:", plantName);

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

      // console.log("Drawing plant at:", x, y, "with size:", _w, _h);
      to_save.image(_img, x - _w * .5, y - _h * .5, _w, _h, 0, 0, _img.width, _img.height);
    }

    // console.log("Save graphics created successfully");
    return to_save;
    */
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
    console.log("Raw flora data from Firebase:", rawData);

    flowers = rawData.map(f => {
      // Try to find QR_id in different possible field names
      let qrId;
      if (f.QR_id !== undefined && f.QR_id !== null) {
        qrId = parseInt(f.QR_id);
      } else if (f.qr_id !== undefined && f.qr_id !== null) {
        qrId = parseInt(f.qr_id);
      } else if (f.type !== undefined && f.type !== null) {
        // Map type names to QR_ids
        switch (f.type.toLowerCase()) {
          case 'milkweed':
            qrId = 0;
            break;
          case 'nymphaea':
            qrId = 1;
            break;
          case 'arrow-arum-peltandra-virginica':
            qrId = 2;
            break;
          case 'paper-birch':
            qrId = 3;
            break;
          case 'piranha':
            qrId = 99;
            break;
          default:
            qrId = 0;
        }
      } else if (f.flowerType !== undefined && f.flowerType !== null) {
        // Map flowerType names to QR_ids
        switch (f.flowerType.toLowerCase()) {
          case 'milkweed':
            qrId = 0;
            break;
          case 'nymphaea':
            qrId = 1;
            break;
          case 'arrow-arum-peltandra-virginica':
            qrId = 2;
            break;
          case 'paper-birch':
            qrId = 3;
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

      // have a random update frame - mainly for piranha but may want to animate others?
      const update_frame = int(random(20, 50));

      if (!f.location || typeof f.location.x !== 'number' || typeof f.location.y !== 'number') {
        console.warn("Skipping flora with invalid location:", f);
        return null;
      }

      return {
        location: f.location,
        color: color(f.color || "white"),
        id: f.id,
        QR_id: qrId,
        timestamp: f.timestamp || new Date().toISOString(),
        current_frame: -1,
        update_frame: update_frame,
        propagationType: f.propagationType || 'manual' // Set default propagationType for existing plants
      };
    }).filter(f => f !== null);

    console.log("Processed flora:", flowers);
    redraw = true;
  } catch (err) {
    console.error("Error loading flora from Firestore:", err);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawEverything();
}


let globPlantTypeSelect = 0;

// handle mouse or touch
function handlePress() {
  // disable all interactivity if a modal window is open, if flower placement popup is active, or if hamburger menu is open
  const hamburgerMenuOpen = document.querySelector('.menu') && document.querySelector('.menu').classList.contains('showMenu');
  // if (!modalActive && !isPlacingFlower && !hamburgerMenuOpen) {
  if (!modalActive && !hamburgerMenuOpen) {
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
          if (!flower || !flower.location) continue;
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
          modalActive = true;
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
            modalActive = false;
          };

          // Add confirm button
          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = 'Remove';
          confirmBtn.className = 'confirm-btn';
          confirmBtn.onclick = async () => {
            modalActive = false;
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
              modalActive = true;

              const okBtn = document.createElement('button');
              okBtn.textContent = 'OK';
              okBtn.className = 'success-btn';
              okBtn.onclick = () => {
                document.body.removeChild(successPopup);
                modalActive = false;
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
            if (!flower || !flower.location) continue;
            const dx = flower.location.x / w_aspect - mouseX;
            const dy = flower.location.y / h_aspect - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Use larger radius for Milkweed (QR_id: 0)
            const clickRadius = flower.QR_id === 0 ? 80 / w_aspect : 80 / w_aspect;

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
      // const maskPixel = mask.get(maskX, maskY);

      // Get the selected plant type from the dropdown
      const plantTypeSelect = 0;//document.getElementById('plantType');
      const plantType = globPlantTypeSelect;//plantTypeSelect ? parseInt(plantTypeSelect.value) : 0;

      // If the mask pixel is black (0,0,0), it's a valid position (grass)
      // if (maskPixel[0] === 0 && maskPixel[1] === 0 && maskPixel[2] === 0) {
      // emf - removed as isValidPlantLocation handles this
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
            modalActive = true;

            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'OK';
            closeBtn.className = 'success-btn';
            closeBtn.onclick = () => {
              document.body.removeChild(popup);
              modalActive = false;
            };
            popup.appendChild(closeBtn);

            document.body.appendChild(popup);
          }
        });
      }
      // }

      // Reset placement state regardless of whether flower was placed
      isPlacingFlower = false;
      pendingFlowerColor = null;
    }
  } else { // modal is active - let's close it

  }

  // cancel animation
  if (is_animating) cancelAnimation();
}

// https://github.com/processing/p5.js/issues/7195 - handle touch and mousepressed
// insert flower by keypress function 
//press 1-9 to place a flower
function mousePressed() {
  handlePress();
}

// handle ios
function touchStarted() {
  handlePress();
}

let GLOB_IDX = 0;
function keyPressed() {
  // if (key === " ") {
  // debug = !debug;
  //   redraw = true;
  // } else 
  if (key >= "1" && key <= "7") {//"8") {
    // Show popup for flower placement
    isPlacingFlower = true;
    pendingFlowerColor = null;
    hoveredFlower = null; // Clear hover state when flower popup becomes active

    let popupName = "";
    if (key == "1") {
      popupName = "Milkweed";
      globPlantTypeSelect = 0;
      // pendingFlowerColor = "#000000";
    } else if (key == "2") {
      popupName = "Nymphaea";
      globPlantTypeSelect = 1;
      // pendingFlowerColor = "#000000";
    } else if (key == "3") {
      popupName = "Arrow Arum Peltandra Virginica";
      globPlantTypeSelect = 2;
      // pendingFlowerColor = "#000000";
    } else if (key == "4") {
      popupName = "Paper Birch";
      globPlantTypeSelect = 3;
      // pendingFlowerColor = "#000000";
    } else if (key == "5") {
      popupName = "PawPaw";
      globPlantTypeSelect = 4;
      // pendingFlowerColor = "#000000";
    } else if (key == "6") {
      globPlantTypeSelect = 5;
      popupName = "Populus Deltoides";
      // pendingFlowerColor = "#000000";
    } else if (key == "7") {
      globPlantTypeSelect = 6;
      popupName = "Zizania Aquatica";
      // pendingFlowerColor = "#000000";
    // } else if (key == "8") {
    //   globPlantTypeSelect = 99;
    //   popupName = "Piranha";
    //   // pendingFlowerColor = "#000000";
    }

    let fh3 = document.getElementById("flowerPopupTitle");
    let fp = document.getElementById("flowerPopupText");
    fh3.innerText = `Placing ${popupName}`;
    fp.innerText = `Click anywhere to place your ${popupName}`;
    document.getElementById('flowerPopup').classList.add('active');
  } else if (key == "A") {
    animateStart();
  } else if (key == "f") {
    GLOB_IDX++;
    if (GLOB_IDX > 4) GLOB_IDX = 0;
  } else if (key == "S") saveImage();
}

// save triggered by menu
// need to tweak this to save the full res...
function saveImage() {
  console.log("Starting save process...");
  console.log("Number of flora:", flowers.length);

  // Create a new graphics buffer
  // let saveBuffer = createGraphics(bg.width, bg.height);
  let saveBuffer = createGraphics(hi_res_bg.width, hi_res_bg.height);
  // saveBuffer.pixelDensity(1);

  // Draw background
  saveBuffer.background(0);
  saveBuffer.image(hi_res_bg, 0, 0);
  saveBuffer.imageMode(CENTER);

  // Sort flowers by Y position for proper z-ordering (farther flowers drawn first)
  let sortedFlowers = [...flowers].sort((a, b) => {
    if (!a.location || !b.location) return 0;
    return a.location.y - b.location.y;
  });

  // for (let f of sortedFlowers) {
  //   drawFlower(f);
  // }
  for (let f of sortedFlowers) {//flowers) {
    // if (!f.QR_id || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
    //   console.warn("Skipping invalid flower:", f);
    //   continue;
    // }

    drawFlower(f, hi_res_bg, saveBuffer);

    /*
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
    */
  }

  console.log("Saving image...");
  saveBuffer.save('floara.png');
  console.log("Save complete");
}

// Add new function to update hoveredFlower
function updateHoveredFlower() {
  if (width < height) return; // Skip in portrait mode
  const hamburgerMenuOpen = document.querySelector('.menu') && document.querySelector('.menu').classList.contains('showMenu');
  if (modalActive || isPlacingFlower || hamburgerMenuOpen) return; // Skip if modal is active, flower placement popup is active, or hamburger menu is open

  if (debug) {
    push()
    fill(color(0))
    text(`${mouseX}:${mouseY}`, mouseX, mouseY)
    pop()
  }

  // point/rect collision and sorting based on y-depth
  let hovered_flowers = [];
  let closestFlower = null;

  for (let f of flowers) {
    if (!f || !f.location || typeof f.location.x !== 'number' || typeof f.location.y !== 'number') continue;
    let image_info = calculateImageInfo(f, bg);//, saving = true);
    if (!image_info) continue;
    // offset by half width and full height - anchor is bottom middle
    let start_x = image_info.x - image_info.w / 2;
    let start_y = image_info.y - image_info.h;

    if (mouseX >= start_x && mouseX <= start_x + image_info.w &&
      mouseY >= start_y && mouseY <= start_y + image_info.h)
      hovered_flowers.push(f);
  }

  // dont sort if only 1
  if (hovered_flowers.length == 1) closestFlower = hovered_flowers[0];
  else if (hovered_flowers.length > 1) {
    // otherwise sort by Y position (closer flowers first for hover detection)
    hovered_flowers = hovered_flowers.sort((x, y) => {
      return x.location.y - y.location.y; // Lower Y values (closer) first
    });
    closestFlower = hovered_flowers[0];
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
  let ageDays = Math.floor(dateDifference(new Date(), placementDate));
  //Math.floor((new Date() - placementDate) / (1000 * 60 * 60 * 24));
  const growthStageIndex = Math.min(4, ageDays);//Math.min(4, Math.floor(ageDays / 5));

  // Get static info for this plant type
  const staticInfo = plantDetails[flower.QR_id];

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

  // Get plant image path based on plant type and growth stage
  let plantImagePath = '';
  let piranhaIdx = 1;
  const stageNumber = growthStageIndex + 1;

  switch (flower.QR_id) {
    case 0: // Milkweed
      plantImagePath = `./assets/img/milkweed/milkweed_0${stageNumber}-color.png`;
      break;
    case 1: // Nymphaea
      plantImagePath = `./assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${stageNumber}.png`;
      break;
    case 2: // Arrow Arum
      plantImagePath = `./assets/img/Arrow-Arum-Peltandra-Virginica/Colored/Arrow_Arum_Stage_${stageNumber}.png`;
      break;
    case 3: // Paper Birch
      plantImagePath = `./assets/img/Paper-Birch/Colored/Paper_Birch_Stage_${stageNumber}.png`;
      break;
    case 4: // PawPaw
      const pawpawStage = ((stageNumber - 1) % 4) + 1;
      plantImagePath = `./assets/img/PawPaw/pawpaw${pawpawStage}.png`;
      break;
    case 5: // Populus Deltoides
      plantImagePath = `./assets/img/Populus-Deltoides/populus_deltoides_stage${stageNumber}.png`;
      break;
    case 6: // Zizania Aquatica
      plantImagePath = `./assets/img/Zizania-Aquatica/Zizania-Aquatica-${stageNumber}.png`;
      break;
    case 99: // Piranha
      // Piranha doesn't have stage-based images, so we'll skip the image
      plantImagePath = './assets/img/Piranha/piranha-head-1.png';
      break;
    default:
      plantImagePath = '';
  }

  // Static info HTML with plant image
  let staticHtml = '';
  if (staticInfo) {
    staticHtml = `
      <div class="plant-info-header">
        <div class="plant-image-container">
          ${plantImagePath ? `<img src="${plantImagePath}" alt="${staticInfo.commonName}" class="plant-image" data-plant-type="${flower.QR_id}" data-current-stage="${stageNumber}" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="plant-title">
          <h2>${staticInfo.commonName} <span style="font-size:0.8em;font-weight:normal;">(${staticInfo.scientificName})</span></h2>
        </div>
      </div>
      <div class="info-section">
        <p><strong>Family:</strong> ${staticInfo.family}</p>
        <p><strong>Height:</strong> ${staticInfo.height}</p>
        <p><strong>Habitat:</strong> ${staticInfo.habitat}</p>
        <p><strong>Bark:</strong> ${staticInfo.bark}</p>
        <p><strong>Leaf:</strong> ${staticInfo.leaf}</p>
        <p><strong>Flowers:</strong> ${staticInfo.flowers}</p>
        <p><strong>Fruit:</strong> ${staticInfo.fruit}</p>
        <p>${staticInfo.description}</p>
        <p><strong>Artist:</strong> ${staticInfo.artist}</p>
      </div>
      <hr>
    `;
  } else {
    staticHtml = `
      <div class="plant-info-header">
        <div class="plant-image-container">
          ${plantImagePath ? `<img src="${plantImagePath}" alt="${plantName}" class="plant-image" data-plant-type="${flower.QR_id}" data-current-stage="${stageNumber}" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="plant-title">
          <h2>${plantName}</h2>
        </div>
      </div>
    `;
  }

  // Dynamic info HTML
  let dynamicHtml = `
    <div class="info-section">
      <h4>Plant Details</h4>
      <p><strong>Age:</strong> ${ageDays + 1} days</p>
      <p><strong>Growth Stage:</strong> ${growthStageIndex + 1} of 5</p>
      <p><strong>Planted:</strong> ${placementDate.toLocaleDateString()} at ${placementDate.toLocaleTimeString()}</p>
      <p><strong>Type:</strong> ${flower.propagationType === 'manual' ? 'Manually Planted' : 'Naturally Propagated'}</p>
      ${flower.propagationType === 'propagated' ? `<p><strong>Parent Plant ID:</strong> ${flower.parentId}</p>` : ''}
    </div>
  `;

  content.innerHTML = staticHtml + dynamicHtml;
  popup.appendChild(content);

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'plant-info-close';
  modalActive = true;

  // Function to close the modal
  const closeModal = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(popup);
    activePlantPopup = null; // Clear the active popup reference
    modalActive = false;
  };

  closeBtn.onclick = closeModal;
  popup.appendChild(closeBtn);

  // Add click outside to close functionality
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Add escape key to close functionality
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  document.body.appendChild(popup);

  // Add hover animation functionality
  const plantImage = popup.querySelector('.plant-image');
  if (plantImage) {
    let animationInterval;
    let currentStage = parseInt(plantImage.dataset.currentStage);
    const plantType = parseInt(plantImage.dataset.plantType);
    let isHovering = false;

    // Function to get image path for a specific stage
    function getImagePathForStage(stage) {
      switch (plantType) {
        case 0: // Milkweed
          return `./assets/img/milkweed/milkweed_0${stage}-color.png`;
        case 1: // Nymphaea
          return `./assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${stage}.png`;
        case 2: // Arrow Arum
          return `./assets/img/Arrow-Arum-Peltandra-Virginica/Colored/Arrow_Arum_Stage_${stage}.png`;
        case 3: // Paper Birch
          return `./assets/img/Paper-Birch/Colored/Paper_Birch_Stage_${stage}.png`;
        case 4: // PawPaw - only has 4 images, so cycle 1-4
          const pawpawStage = ((stage - 1) % 4) + 1;
          return `./assets/img/PawPaw/pawpaw${pawpawStage}.png`;
        case 5: // Populus Deltoides
          return `./assets/img/Populus-Deltoides/populus_deltoides_stage${stage}.png`;
        case 6: // Zizania Aquatica
          return `./assets/img/Zizania-Aquatica/Zizania-Aquatica-${stage}.png`;
        case 99: // Piranha
          // return '';
          if ((stage % 2) == 0) stage = 1;
          else stage = 2;
          return `./assets/img/Piranha/piranha-head-${stage}.png`;
        default:
          return '';
      }
    }

    // Function to cycle through stages
    function cycleStages() {
      if (!isHovering) return;

      currentStage++;
      if (currentStage > 5) {
        currentStage = 1; // Reset to first stage
      }

      const newImagePath = getImagePathForStage(currentStage);
      if (newImagePath) {
        // Add transition class for smooth fade
        plantImage.classList.add('stage-transition');

        // Change image after a brief fade
        setTimeout(() => {
          plantImage.src = newImagePath;
          plantImage.dataset.currentStage = currentStage;

          // Remove transition class after image loads
          setTimeout(() => {
            plantImage.classList.remove('stage-transition');
          }, 100);
        }, 150);
      }
    }

    // Mouse enter event
    plantImage.addEventListener('mouseenter', () => {
      isHovering = true;
      // Start cycling through stages every 800ms
      animationInterval = setInterval(cycleStages, 800);
    });

    // Mouse leave event
    plantImage.addEventListener('mouseleave', () => {
      isHovering = false;
      clearInterval(animationInterval);

      // Reset to original stage
      const originalStage = parseInt(plantImage.dataset.currentStage);
      const originalImagePath = getImagePathForStage(originalStage);
      if (originalImagePath) {
        plantImage.src = originalImagePath;
      }
    });
  }
}

// Add new function for plant propagation
function propagatePlants() {
  console.log("Starting plant propagation...");

  const MIN_PROPAGATION_DISTANCE = 50; // Minimum distance in px from any other plant

  for (const flower of flowers) {
    if (flower.QR_id != 99) {
      const plantName = QR_map[flower.QR_id].name;
      const plant = plantInfo[plantName];

      console.log(`Checking propagation for ${plantName}...`);

      // Only propagate if random chance succeeds
      if (Math.random() < plant.propagationRate) {
        console.log(`Propagation chance succeeded for ${plantName}`);

        let foundValid = false;
        let newX, newY;
        for (let attempt = 0; attempt < 10; attempt++) {
          // Try to find a suitable location within propagation radius
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * plant.propagationRadius;
          newX = flower.location.x + Math.cos(angle) * distance;
          newY = flower.location.y + Math.sin(angle) * distance;

          // Check if the new location is valid and not too close to any other plant
          if (
            isValidPlantLocation(newX, newY, plant.suitableAreas) &&
            !flowers.some(f => {
              if (!f.location) return false;
              const dx = f.location.x - newX;
              const dy = f.location.y - newY;
              return Math.sqrt(dx * dx + dy * dy) < MIN_PROPAGATION_DISTANCE;
            })
          ) {
            foundValid = true;
            break;
          }
        }
        if (!foundValid) {
          console.log("Could not find a non-clustered propagation spot after 10 tries.");
          continue;
        }

        console.log(`Attempting propagation at location: (${newX}, ${newY})`);

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
                newFlower.current_frame = -1;
                newFlower.update_frame = int(random(20, 50));
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
        console.log(`Propagation chance failed for ${plantName}`);
      }
    }
  }
}


// Add new function for filtering plants
function filterPlants(filter) {
  plantFilter = filter;
  redraw = true;
}

// create a backup flowers array from the database
// sort them by date, then add them back to the main flowers list based on frameCount
function animateStart() {
  is_animating = true;
  animating_index = -10;

  window.shaders_on = true;

  // first time
  if (animating_flowers.length === 0) {
    animating_flowers = flowers.sort((x, y) => {
      return new Date(x.timestamp) - new Date(y.timestamp);
    });
    flowers = [];
  } else { // going again
    flowers = [];
  }
}

function cancelAnimation() {
  is_animating = false;
  flowers = animating_flowers;
}