// thoughts:
//  - recommend turning off auto-rotate
// 
// 
let bg, mask;

let windowX, windowY;
let scrollSpeed = 5;
let phoneSpeed = 2;
let font;

let currPlantID;

function preload() {
    bg = loadImage("assets/img/BG-Retouch.jpg");
    mask = loadImage("assets/img/BG-Retouch-mask.png");
    font = loadFont("assets/fonts/BenchNine-Regular.ttf");
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    noSmooth();

    bg.resize(bg.width * 0.5, 0);
    mask.resize(mask.width * 0.5, 0);

    windowX = 0;// bg.width / 2 - width / 2;
    windowY = 0;//bg.height / 2 - height / 2;

    textFont(font);
    textSize(24);

    // accelerometer Data
    window.addEventListener("devicemotion", function (e) {
        // get accelerometer values
        x = parseInt(e.accelerationIncludingGravity.x);
        y = parseInt(e.accelerationIncludingGravity.y);
        // z = parseInt(e.accelerationIncludingGravity.z);

        if (!isNaN(x) && !isNaN(y)) updatePos(-x * phoneSpeed, y * phoneSpeed);
    });

    currPlantID = 0;
    let params = getURLParams();
    if (params !== null && params.QR_id !== null) {
        if (QR_map[params.QR_id] !== undefined) {
            currPlantID = params.QR_id;
        }
    }

    startDeviceRotationDetect();
}

function draw() {
    translate(-width / 2, -height / 2);
    background(0);
    image(bg, 0, 0, width, height, windowX, windowY, width, height);

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
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
    // get world coords
    let x = mouseX + windowX;
    let y = mouseY + windowY;

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
                alert(`${plantName} successfully added`);
                // // Create and show confirmation popup
                // const popup = document.createElement('div');
                // popup.className = 'confirmation-popup';

                // // Add success message
                // const message = document.createElement('p');
                // message.textContent = 'Flower successfully added!';
                // popup.appendChild(message);
                // modalActive = true;

                // // Add close button
                // const closeBtn = document.createElement('button');
                // closeBtn.textContent = 'OK';
                // closeBtn.className = 'success-btn';
                // closeBtn.onclick = () => {
                //     document.body.removeChild(popup);
                //     modalActive = false;
                // };
                // popup.appendChild(closeBtn);

                // document.body.appendChild(popup);
            }
        });
    } else {
        alert(`Invalid location for ${plantName}`);
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
        // If it does we make a button
        let button = createButton('click to allow access to sensors');
        // Then we set it's text big so it is easy to see
        button.style('font-size', '28px');
        // Then we make its 'mousePressed' functionality into another function
        // we write below
        button.mousePressed(DeviceMotionEvent.requestPermission);
    }
}