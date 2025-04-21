// temporary data to hold flower locations while database is setup
// schema:
// id:          autoid
// timestamp:   time of addition
// location:    x,y position from "normal" image size (1920x913)
// QR id:       id of the QR code used

function setupRandomData(w, h) {
    let flower_data = [];

    for (let i = 0; i < 200; i++) {
        // map color to age for visual distinction
        let new_d = new Date();
        let old_d = new Date(2025, 0, 1);
        let d = randomDate(old_d, new_d);

        let doff = new_d - old_d;
        let col = map(new_d - d, 0, doff, 0, 255);

        let p = { id: i, timestamp: d, location: { x: int(random(w)), y: int(random(h)) }, QR_id: int(random(0, 50)), color: col };

        flower_data.push(p);
    }
    return flower_data;
}

// manually run to generate data
// c/o https://stackoverflow.com/questions/9035627/elegant-method-to-generate-array-of-random-dates-within-two-dates
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}