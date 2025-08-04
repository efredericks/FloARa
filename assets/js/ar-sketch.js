// thoughts:
//  - recommend turning off auto-rotate
//  - left in a bunch of commented ios permissions code since it "seems" to work on the ipad but haven't checked on iphones 
// 

let bg, mask;

let windowX, windowY;
let scrollSpeed = 5;
let phoneSpeed = 2;
let font;

let currPlantID;

// browser detection things
let accessAllowed = true;
let pressTimer = 0; // cooldown for permission button
let browserDetails;
let isIOS = false;

// Interactive flower variables
let flowers = []; // Add flowers array to store placed flowers
let hoveredFlower = null;
let selectedFlower = null;
let contextMenu = null;
let isInteractingWithFlower = false; // Flag to prevent placement when interacting

function preload() {
    bg = loadImage("assets/img/BG-Retouch-Half.jpg");
    mask = loadImage("assets/img/BG-Retouch-mask-half.png");
    // bg = loadImage("assets/img/BG-Retouch.jpg");
    // mask = loadImage("assets/img/BG-Retouch-mask.png");
    font = loadFont("assets/fonts/BenchNine-Regular.ttf");

    // Initialize plant image arrays
    plant_images = {
        'Milkweed': [],
        'Nymphaea': [],
        'Piranha': [],
        'Arrow-Arum-Peltandra-Virginica': [],
        'Paper-Birch': [],
        'PawPaw': [],
        'Populus-Deltoides': [],
        'Zizania-Aquatica': [],
    };

    // Load Milkweed images
    for (let i = 1; i <= 5; i++) {
        const milkweedImg = loadImage(`assets/img/milkweed/milkweed_0${i}-color.png`);
        plant_images['Milkweed'].push(milkweedImg);
    }

    // Load Nymphaea images
    for (let i = 1; i <= 5; i++) {
        const nymphaeaImg = loadImage(`assets/img/Nymphaea-Odorata-Ella-Kane/nymphaea_odorata_stage${i}.png`);
        plant_images['Nymphaea'].push(nymphaeaImg);
    }

    // Load Peltandra-Virginica images
    for (let i = 1; i <= 5; i++) {
        const peltandraImg = loadImage(`assets/img/Arrow-Arum-Peltandra-Virginica/Colored/Arrow_Arum_Stage_${i}.png`);
        plant_images['Arrow-Arum-Peltandra-Virginica'].push(peltandraImg);
    }

    // Load Paper Birch images
    for (let i = 1; i <= 5; i++) {
        const birchImg = loadImage(`assets/img/Paper-Birch/Colored/Paper_Birch_Stage_${i}.png`);
        plant_images['Paper-Birch'].push(birchImg);
    }

    // Load PawPaw images
    for (let i = 1; i <= 4; i++) {
        const pawpawImg = loadImage(`assets/img/PawPaw/pawpaw${i}.png`);
        plant_images['PawPaw'].push(pawpawImg);
    }
    // Add the last stage again to make it 5 stages
    const pawpawLastImg = loadImage("assets/img/PawPaw/pawpaw4.png");
    plant_images['PawPaw'].push(pawpawLastImg);

    // Load Populus-Deltoides images
    for (let i = 1; i <= 5; i++) {
        const populusImg = loadImage(`assets/img/Populus-Deltoides/populus_deltoides_stage${i}.png`);
        plant_images['Populus-Deltoides'].push(populusImg);
    }

    // Load Zizania-Aquatica images
    for (let i = 1; i <= 5; i++) {
        const zizaniaImg = loadImage(`assets/img/Zizania-Aquatica/Zizania-Aquatica-${i}.png`);
        plant_images['Zizania-Aquatica'].push(zizaniaImg);
    }

    // Load Piranha images
    plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-base-1.png"));
    plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-vine-1.png"));
    plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-vine-1.png"));
    plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-head-1.png"));
    plant_images['Piranha'].push(loadImage("assets/img/Piranha/piranha-head-2.png"));
}

let overlay_gfx;
let static_bg;
function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    noSmooth();

    // bg.resize(bg.width * 0.5, 0);
    // mask.resize(mask.width * 0.5, 0);

    windowX = 0;// bg.width / 2 - width / 2;
    windowY = 0;//bg.height / 2 - height / 2;

    textFont(font);
    textSize(24);

    //https://editor.p5js.org/ronikaufman/sketches/yaVtDVBK5
    //https://gist.github.com/carloscabo/0ec69aaa42216c7f12efd861e110cb8b
    browserDetails = navigator.userAgent;
    is_ios = /iP(ad|od|hone)/i.test(window.navigator.userAgent),
        is_safari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
    if (is_ios || is_safari) isIOS = true;

    // accelerometer Data
    window.addEventListener("devicemotion", function (e) {
        // get accelerometer values
        x = parseInt(e.accelerationIncludingGravity.x);
        y = parseInt(e.accelerationIncludingGravity.y);
        // z = parseInt(e.accelerationIncludingGravity.z);

        if (isIOS) {
            x *= -1.0;
            y *= -1.0;
        }
        if (!isNaN(x) && !isNaN(y)) updatePos(-x * phoneSpeed, y * phoneSpeed);
        // if (!isNaN(x) && !isNaN(y)) updatePos(-x * phoneSpeed, y * phoneSpeed);
    });

    currPlantID = 0;
    let params = getURLParams();
    if (params !== null && params.QR_id !== null) {
        if (QR_map[params.QR_id] !== undefined) {
            currPlantID = params.QR_id;
        }
    }

    // Ensure currPlantID is valid
    if (!QR_map[currPlantID]) {
        console.warn("Invalid plant ID, defaulting to Milkweed (ID: 0)");
        currPlantID = 0; // Default to Milkweed
    }

    console.log("Current plant ID:", currPlantID, "Plant name:", QR_map[currPlantID] ? QR_map[currPlantID].name : "INVALID");
    console.log("Available QR_map keys:", Object.keys(QR_map));

    // give a helper visual for placement
    // overlay_gfx = createGraphics(bg.width, bg.height);
    // mask.loadPixels();
    // overlay_gfx.noStroke();
    // overlay_gfx.fill(color(255, 0, 255, 25));
    // let tgt_cols = [];
    // let currPlantName = QR_map[currPlantID].name;
    // for (let area of plantInfo[currPlantName].suitableAreas) {
    //     if (area == "grass") tgt_cols.push(color(0, 0, 0));
    //     else if (area == "water") tgt_cols.push(color(255, 0, 0));
    // }

    // // draw a shaded circle for every valid placement position
    // for (let y = 0; y < mask.height; y++) {
    //     for (let x = 0; x < mask.width; x++) {
    //         const idx = getPixelID(x, y, mask);
    //         for (let col of tgt_cols) {
    //             if (mask.pixels[idx] == red(col) && mask.pixels[idx + 1] == green(col) && mask.pixels[idx + 2] == blue(col)) {
    //                 overlay_gfx.circle(x, y, 2);
    //             }
    //         }
    //     }
    // }

    // Load existing flowers from Firebase
    if (window.getFlowerData) {
        window.getFlowerData().then(data => {
            flowers = data;
            console.log("Loaded flowers:", flowers.length);
        });
    }

    // Subscribe to real-time flower updates
    if (window.subscribeToFlowers) {
        window.subscribeToFlowers(function (data) {
            flowers = data;
            console.log("Updated flowers:", flowers.length);
        });
    }

    startDeviceRotationDetect();

    static_bg = createGraphics(bg.width, bg.height);
    static_bg.copy(bg, 0, 0, bg.width, bg.height, 0, 0, static_bg.width, static_bg.height);
}

function draw() {
    translate(-width / 2, -height / 2);
    background(0);
    // image(bg, 0, 0, width, height, windowX, windowY, width, height);
    image(static_bg, 0, 0, width, height, windowX, windowY, width, height);
    // image(overlay_gfx, 0, 0, width, height, windowX, windowY, width, height);

    // Render placed flowers
    if (!rendered)
        renderFlowers();

    // Render context menu if active
    if (contextMenu && contextMenu.flower) {
        renderContextMenu();
    }

    fill(color(0, 0, 0, 20));
    noStroke();
    rect(0, 0, width, 30);
    fill(color(20));
    textAlign(LEFT);
    text(`Tap to place ${QR_map[currPlantID].name}`, 10, 22);
    let t = "WADS / Accelerometer to move";
    textAlign(RIGHT);
    text(t, width - 10, 22);

    // allow scrolling, not pushing
    if (keyIsPressed) {
        if (keyIsDown(87)) updatePos(0, -scrollSpeed); // w
        if (keyIsDown(83)) updatePos(0, scrollSpeed); // s
        if (keyIsDown(65)) updatePos(-scrollSpeed, 0); // a
        if (keyIsDown(68)) updatePos(scrollSpeed, 0); // d
        // if (key == "w") updatePos(0, -scrollSpeed);
        // if (key == "s") updatePos(0, scrollSpeed);
        // if (key == "a") updatePos(-scrollSpeed, 0);
        // if (key == "d") updatePos(scrollSpeed, 0);
    }

    // permission cooldown
    if (pressTimer > 0) {
        pressTimer--;
    }
}

// Add flower rendering function
let rendered = false;
function renderFlowers() {
    if (!flowers || flowers.length === 0) return;

    if (!rendered) rendered = true;

    for (let f of flowers) {
        // Skip invalid flowers
        if (f.QR_id === undefined || f.QR_id === null || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
            continue;
        }

        // Skip if location is invalid
        if (!f.location || typeof f.location.x !== 'number' || typeof f.location.y !== 'number') {
            continue;
        }

        // Calculate position relative to current view
        let x = f.location.x;// - windowX;
        let y = f.location.y;//- windowY;

        // Only render if flower is visible in current view
        // if (x < -100 || x > width + 100 || y < -100 || y > height + 100) {
        //     continue;
        // }

        let plantName = QR_map[f.QR_id].name;

        // Get the appropriate image for this plant
        let imageIndex = 0; // Default to first stage

        // Calculate growth stage based on plant age
        let now = new Date();
        let date_diff = Math.floor(dateDifference(now, new Date(f.timestamp)));
        if ((date_diff / 5) > 4) imageIndex = 4;
        else imageIndex = Math.floor(date_diff / 5);

        // Handle Piranha plant specially for animation
        if (f.QR_id == 99) {
            // For stages 3 and 4 (head stages), animate between them
            if (imageIndex >= 3) {
                // Simple animation - alternate between stages 3 and 4
                imageIndex = 3 + (frameCount % 60 < 30 ? 0 : 1);
            }
        }

        if (plant_images[plantName] && plant_images[plantName][imageIndex]) {
            let img = plant_images[plantName][imageIndex];

            // Calculate base scaling based on plant type
            let scale = QR_map[f.QR_id].scale || 0.4;

            // Calculate zoom factor based on background image scaling
            let bgScale = 1;//width / bg.width;
            let zoomFactor = map(bgScale, 0.5, 2.0, 1.0, 0.5); // Adjust plant size based on zoom

            // Use a more conservative perspective scaling to prevent oversized plants
            let perspectiveScale = map(y, height, height * 0.2, 0.8, 0.4);

            // Calculate final dimensions with zoom-aware scaling
            let w = img.width * scale * perspectiveScale * zoomFactor;
            let h = img.height * scale * perspectiveScale * zoomFactor;

            // Limit maximum size to prevent oversized plants
            let maxSize = 120; // Reduced from 150 for better proportions
            if (w > maxSize || h > maxSize) {
                let aspectRatio = w / h;
                if (w > h) {
                    w = maxSize;
                    h = maxSize / aspectRatio;
                } else {
                    h = maxSize;
                    w = maxSize * aspectRatio;
                }
            }

            // Ensure minimum size for visibility
            let minSize = 20;
            if (w < minSize || h < minSize) {
                let aspectRatio = w / h;
                if (w < h) {
                    w = minSize;
                    h = minSize / aspectRatio;
                } else {
                    h = minSize;
                    w = minSize * aspectRatio;
                }
            }

            static_bg.push();
            static_bg.noStroke();

            // Check if this flower is being hovered
            let isHovered = (hoveredFlower === f);
            let isSelected = (selectedFlower === f);

            // Add hover effect
            // if (isHovered || isSelected) {
            //     stroke(255, 255, 0);
            //     strokeWeight(3);
            // }

            // Apply color tinting if the flower has a color
            // if (f.color && f.color !== "#000000") {
            //     static_bg.tint(f.color);
            // }

            // Tinting seems to get into an error loop on ios
            // static_bg.tint(255, 127);

            // // Draw the plant image
            static_bg.image(img, x - w / 2, y - h / 2, w, h);

            // // Reset tint
            // static_bg.noTint();

            // Add plant name label (optional - can be removed for cleaner look)
            // fill(0);
            // textSize(10);
            // textAlign(CENTER);
            // text(plantName, x, y + h / 2 + 15);

            static_bg.pop();
        } else {
            // Fallback to circle if image not loaded
            static_bg.push();
            static_bg.noStroke();

            // Check if this flower is being hovered
            let isHovered = (hoveredFlower === f);
            let isSelected = (selectedFlower === f);

            // Add hover effect
            // if (isHovered || isSelected) {
            //     stroke(255, 255, 0);
            //     strokeWeight(3);
            // }

            // Color based on plant type
            if (plantName === 'Milkweed') {
                static_bg.fill(255, 192, 203); // Pink
            } else if (plantName === 'Nymphaea') {
                static_bg.fill(255, 255, 255); // White
            } else if (plantName === 'Paper-Birch') {
                static_bg.fill(245, 245, 245); // Light gray
            } else if (plantName === 'Arrow-Arum-Peltandra-Virginica') {
                static_bg.fill(34, 139, 34); // Forest green
            } else if (plantName === 'PawPaw') {
                static_bg.fill(255, 165, 0); // Orange
            } else if (plantName === 'Populus-Deltoides') {
                static_bg.fill(139, 69, 19); // Brown
            } else if (plantName === 'Zizania-Aquatica') {
                static_bg.fill(0, 128, 0); // Green
            } else if (plantName === 'Piranha') {
                static_bg.fill(255, 0, 0); // Red
            } else {
                static_bg.fill(0, 255, 0); // Default green
            }

            // Draw fallback circle
            static_bg.ellipse(x, y, 30, 30);

            // Add plant name label
            // fill(0);
            // textSize(12);
            // textAlign(CENTER);
            // text(plantName, x, y + 25);

            static_bg.pop();
        }
    }
}

// Function to check if a point is within a flower
function getFlowerAtPosition(x, y) {
    for (let f of flowers) {
        if (f.QR_id === undefined || f.QR_id === null || !QR_map[f.QR_id] || !QR_map[f.QR_id].name) {
            continue;
        }

        if (!f.location || typeof f.location.x !== 'number' || typeof f.location.y !== 'number') {
            continue;
        }

        let flowerX = f.location.x - windowX;
        let flowerY = f.location.y - windowY;

        // Check if click is within flower bounds
        let distance = dist(x, y, flowerX, flowerY);
        if (distance <= 15) { // 15 pixel radius
            return f;
        }
    }
    return null;
}

// Function to show flower details
function showFlowerDetails(flower) {
    let plantName = QR_map[flower.QR_id].name;
    let plantData = plantInfo[plantName];

    let details = `Plant: ${plantName}\n`;
    details += `Placed: ${new Date(flower.timestamp).toLocaleString()}\n`;
    details += `Type: ${flower.propagationType || 'manual'}\n`;
    if (plantData) {
        details += `Scientific Name: ${plantData.scientificName}\n`;
        details += `Description: ${plantData.description}\n`;
        details += `Native Region: ${plantData.nativeRegion}\n`;
        details += `Ecology: ${plantData.ecology}`;
    }

    alert(details);
}

// Function to delete flower
function deleteFlower(flower) {
    if (confirm(`Are you sure you want to delete this ${QR_map[flower.QR_id].name}?`)) {
        if (window.deleteFlower) {
            window.deleteFlower(flower.id).then(success => {
                if (success) {
                    // Remove from local array
                    let index = flowers.findIndex(f => f.id === flower.id);
                    if (index !== -1) {
                        flowers.splice(index, 1);
                    }
                    alert('Flower deleted successfully');
                } else {
                    alert('Failed to delete flower');
                }
            });
        } else {
            // Fallback: remove from local array only
            let index = flowers.findIndex(f => f.id === flower.id);
            if (index !== -1) {
                flowers.splice(index, 1);
            }
            alert('Flower removed locally');
        }
    }
}

// Function to create context menu
function createContextMenu(x, y, flower) {
    // Ensure menu stays within canvas bounds
    let menuWidth = 150;
    let menuHeight = 80;

    // Adjust position if menu would go off screen
    if (x + menuWidth > width) {
        x = width - menuWidth - 10;
    }
    if (y + menuHeight > height) {
        y = height - menuHeight - 10;
    }

    contextMenu = {
        x: x,
        y: y,
        flower: flower,
        width: menuWidth,
        height: menuHeight,
        buttons: [
            { text: "View Details", action: "details", y: y + 20 },
            { text: "Delete", action: "delete", y: y + 50 }
        ]
    };
}

// Function to render context menu using p5.js
function renderContextMenu() {
    if (!contextMenu) return;

    // Draw background
    push();
    fill(255);
    stroke(200);
    strokeWeight(1);
    rect(contextMenu.x, contextMenu.y, contextMenu.width, contextMenu.height, 5);

    // Draw buttons
    for (let button of contextMenu.buttons) {
        let buttonY = button.y;
        let buttonHeight = 25;

        // Check if mouse is over this button
        let isHovered = mouseX >= contextMenu.x && mouseX <= contextMenu.x + contextMenu.width &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight;

        // Button background
        if (button.action === "delete") {
            fill(isHovered ? color(255, 100, 100) : color(255, 150, 150));
        } else {
            fill(isHovered ? color(200, 200, 255) : color(240, 240, 255));
        }

        noStroke();
        rect(contextMenu.x + 5, buttonY, contextMenu.width - 10, buttonHeight, 3);

        // Button text
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(button.text, contextMenu.x + contextMenu.width / 2, buttonY + buttonHeight / 2);
    }
    pop();
}

// Function to check if context menu is clicked
function checkContextMenuClick() {
    if (!contextMenu) return false;

    for (let button of contextMenu.buttons) {
        let buttonY = button.y;
        let buttonHeight = 25;

        if (mouseX >= contextMenu.x && mouseX <= contextMenu.x + contextMenu.width &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {

            if (button.action === "details") {
                showFlowerDetails(contextMenu.flower);
            } else if (button.action === "delete") {
                deleteFlower(contextMenu.flower);
            }

            contextMenu = null;
            return true;
        }
    }

    // Clicked outside menu, close it
    if (mouseX < contextMenu.x || mouseX > contextMenu.x + contextMenu.width ||
        mouseY < contextMenu.y || mouseY > contextMenu.y + contextMenu.height) {
        contextMenu = null;
        return true;
    }

    return false;
}

// Handle mouse movement for hover effects
function mouseMoved() {
    hoveredFlower = getFlowerAtPosition(mouseX, mouseY);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function insertFlower(x, y) {
    if (pressTimer == 0) {
        // Check if currPlantID is valid
        if (!QR_map[currPlantID]) {
            console.error("Invalid plant ID:", currPlantID);
            alert("Invalid plant type selected");
            return;
        }

        const newFlower = {
            location: {
                x: x,
                y: y,
            },
            color: "#000000",
            QR_id: currPlantID,
            timestamp: new Date().toISOString(),
            propagationType: 'manual'
        };

        // tbd - highlight suitable areas for planting?
        const plantName = QR_map[currPlantID].name;
        const suitableAreas = plantInfo[plantName].suitableAreas;
        if (isValidPlantLocation(x, y, suitableAreas)) {
            window.addFlower(newFlower).then(flowerId => {
                if (flowerId) {
                    // Add the flower to local array immediately for instant visual feedback
                    newFlower.id = flowerId;
                    flowers.push(newFlower);
                    alert(`${plantName} successfully added`);
                }
            });
        } else {
            alert(`Invalid location for ${plantName}`);
        }
    } else {
        if (!permissionButton)
            alert("Wait a few before planting another");
    }
}

function touchStarted() {
    if (accessAllowed) {

        // First check if clicking on context menu
        if (checkContextMenuClick()) {
            return false;
        }

        // Check if clicking on a flower
        let clickedFlower = getFlowerAtPosition(mouseX, mouseY);

        if (clickedFlower) {
            createContextMenu(mouseX, mouseY, clickedFlower);
            isInteractingWithFlower = true;
            return false;
        }

        // Reset interaction flag
        isInteractingWithFlower = false;

        // If not clicking on a flower or UI, place a new one
        let x = mouseX + windowX;
        let y = mouseY + windowY;
        insertFlower(x, y);
        pressTimer = 50;
    }
    return false;
}

function mousePressed() {
    if (accessAllowed) {
        // First check if clicking on context menu
        if (checkContextMenuClick()) {
            return;
        }

        // Check if clicking on a flower
        let clickedFlower = getFlowerAtPosition(mouseX, mouseY);

        if (clickedFlower) {
            createContextMenu(mouseX, mouseY, clickedFlower);
            isInteractingWithFlower = true;
            return;
        }

        // Reset interaction flag
        isInteractingWithFlower = false;

        // If not clicking on a flower or UI, place a new one
        let x = mouseX + windowX;
        let y = mouseY + windowY;
        insertFlower(x, y);
        pressTimer = 50;
    }
}

function updatePos(x, y) {
    let nextX = windowX + x;
    let nextY = windowY + y;

    // console.lo  g(x, y, windowX, windowY);
    windowX = constrain(nextX, 0, bg.width - width);
    windowY = constrain(nextY, 0, bg.height - height);
}

// permission for accelerometer
// function startDeviceRotationDetect() {
//     // iOS 13 added a new security wall that prevents
//     // access to sensors without requesting access through the OS
//     // Access must be requested inside of a mousePressed event on
//     // a HTML button
//     //So first we check to see if this iOS by seeing if the
//     // DeviceMotionEvent.requestPermission exists as a function
//     // Otherwise it is not iOS 13+ so we can skip this step
//     if (typeof (DeviceMotionEvent) !== "undefined" &&
//         typeof (DeviceMotionEvent.requestPermission) === "function") {
//         // If it does we make a button
//         let button = createButton('click to allow access to sensors');
//         // Then we set it's text big so it is easy to see
//         button.style('font-size', '28px');
//         // Then we make its 'mousePressed' functionality into another function
//         // we write below
//         button.mousePressed(DeviceMotionEvent.requestPermission);
//     }
// }
// permission for accelerometer
function startDeviceRotationDetect() {
    // iOS 13 added a new security wall that prevents
    // access to sensors without requesting access through the OS
    // Access must be requested inside of a mousePressed event on
    // a HTML button
    //So first we check to see if this iOS by seeing if the
    // DeviceMotionEvent.requestPermission exists as a function
    // Otherwise it is not iOS 13+ so we can skip this step
    if (typeof (DeviceMotionEvent) !== "undefined" &&
        typeof (DeviceMotionEvent.requestPermission) === "function") {
        accessAllowed = false;

        // If it does we make a button
        permissionButton = createButton('click to allow access to sensors');
        // Then we set it's text big so it is easy to see
        permissionButton.style('font-size', '28px');
        permissionButton.style('position', 'absolute');
        permissionButton.style('top', '40px');
        permissionButton.style('left', '20px');
        permissionButton.id("permBtn");

        // Then we make its 'mousePressed' functionality into another function
        // we write below
        permissionButton.mousePressed(handlePermissions);//DeviceMotionEvent.requestPermission);

        // handle ios' lack of mouse pressing ability ._.
        let b = document.getElementById("permBtn");
        b.addEventListener("touchstart", handlePermissions);
    } else {
        accessAllowed = true;
        pressTimer = 20;
        permissionButton.remove();
    }
}

let permissionButton;
function handlePermissions() {
    DeviceMotionEvent.requestPermission();
    accessAllowed = true;
    pressTimer = 20;
    permissionButton.remove();
}