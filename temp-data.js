// temporary data to hold flower locations while database is setup
// schema:
// id:          autoid
// timestamp:   time of addition
// location:    x,y position from "normal" image size (1920x913)
// QR id:       id of the QR code used

function setupRandomData(w, h, mask, num=5000) {
    let flower_data = [];

    mask.loadPixels();
    for (let i = 0; i < num; i++) {
        // map color to age for visual distinction
        let new_d = new Date();
        let old_d = new Date(2025, 0, 1);
        let d = randomDate(old_d, new_d);

        let doff = new_d - old_d;
        let col = map(new_d - d, 0, doff, 0, 255);

        let timeout = 5000;
        let x = int(random(w - 1));
        let y = int(random(h - 1));
        while (timeout > 0) {
            const idx = getPixelID(x, y, mask);
            // only place in black pixels
            if (
                mask.pixels[idx] < 10 &&
                mask.pixels[idx + 1] < 10 &&
                mask.pixels[idx + 2] < 10
            ) {
                done = true;
                break;
            } else {
                x = int(random(w - 1));
                y = int(random(h - 1));
            }

            timeout--;
        }

        // y -= temp_milkweed.height;

        let p = { id: i, timestamp: d, location: { x: x, y: y }, QR_id: int(random(0, 2)), color: col };

        flower_data.push(p);
    }
    return flower_data;
}

function addIndividualPlant(w, h, mask, flower_data) {
    mask.loadPixels();
    // for (let i = 0; i < 15000; i++) {
        // map color to age for visual distinction
        let new_d = new Date();
        let old_d = new Date(2025, 0, 1);
        let d = randomDate(old_d, new_d);

        let doff = new_d - old_d;
        let col = map(new_d - d, 0, doff, 0, 255);

        let timeout = 5000;
        let x = int(random(w - 1));
        let y = int(random(h - 1));

        let idx = 0;
        if (flowers.length > 0) idx = flowers[flowers.length-1].id+1;

        while (timeout > 0) {
            const idx = getPixelID(x, y, mask);
            // only place in black pixels
            if (
                mask.pixels[idx] < 10 &&
                mask.pixels[idx + 1] < 10 &&
                mask.pixels[idx + 2] < 10
            ) {
                done = true;
                break;
            } else {
                x = int(random(w - 1));
                y = int(random(h - 1));
            }

            timeout--;
        }

        // y -= temp_milkweed.height;

        let p = { id: idx, timestamp: d, location: { x: x, y: y }, QR_id: int(random(0, 2)), color: col };

        flower_data.push(p);
    // }
    return flower_data;

}

// manually run to generate data
// c/o https://stackoverflow.com/questions/9035627/elegant-method-to-generate-array-of-random-dates-within-two-dates
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}