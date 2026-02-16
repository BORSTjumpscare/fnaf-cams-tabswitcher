let locked = false;
let generated = false;

const CAM_COUNT = 10;
const FIELD_SIZE = 420;
const BUTTON_SIZE = 36;
const MIN_DISTANCE = 110;

let cams = [];
let lines = [];
const sides = ["top", "right", "bottom", "left"];

function createUI() {
    const field = document.createElement("div");
    field.id = "cam-field";
    field.style.position = "fixed";
    field.style.bottom = "15px";
    field.style.right = "15px";
    field.style.width = FIELD_SIZE + "px";
    field.style.height = FIELD_SIZE + "px";
    field.style.background = "black";
    field.style.border = "2px solid white";
    field.style.display = "none";
    field.style.zIndex = "999999";
    field.style.overflow = "hidden";
    document.body.appendChild(field);

    const toggle = document.createElement("img");
    toggle.src = chrome.runtime.getURL("cam-button.png");
    toggle.style.position = "fixed";
    toggle.style.bottom = "15px";
    toggle.style.right = "15px";
    toggle.style.width = "50px";
    toggle.style.cursor = "pointer";
    toggle.style.zIndex = "1000000";
    document.body.appendChild(toggle);

    toggle.onclick = () => {
        field.style.display =
            field.style.display === "none" ? "block" : "none";

        if (!locked && !generated) {
            generateMap(field);
            generated = true;
        }
    };

    const lockBtn = document.createElement("button");
    lockBtn.innerText = "LOCK";
    lockBtn.style.position = "absolute";
    lockBtn.style.top = "5px";
    lockBtn.style.left = "5px";
    lockBtn.onclick = () => {
        locked = !locked;
        lockBtn.innerText = locked ? "LOCKED" : "LOCK";
    };
    field.appendChild(lockBtn);
}

function generateMap(field) {
    field.querySelectorAll(".cam").forEach(e => e.remove());
    field.querySelectorAll(".line").forEach(e => e.remove());

    cams = [];
    lines = [];

    generateCams();
    createCamButtons(field);
    createClosedLoop(field);
}

function generateCams() {
    while (cams.length < CAM_COUNT) {
        let x = Math.random() * (FIELD_SIZE - 60) + 20;
        let y = Math.random() * (FIELD_SIZE - 60) + 20;

        if (cams.every(c => Math.hypot(c.x - x, c.y - y) > MIN_DISTANCE)) {
            cams.push({
                id: cams.length + 1,
                x,
                y,
                connections: 0,
                usedSides: []
            });
        }
    }
}

function createCamButtons(field) {
    cams.forEach(cam => {
        const btn = document.createElement("div");
        btn.className = "cam";
        btn.innerText = "cam" + cam.id;
        btn.style.position = "absolute";
        btn.style.left = cam.x + "px";
        btn.style.top = cam.y + "px";
        btn.style.width = BUTTON_SIZE + "px";
        btn.style.height = BUTTON_SIZE + "px";
        btn.style.border = "2px solid white";
        btn.style.color = "white";
        btn.style.fontSize = "10px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.userSelect = "none";
        btn.style.cursor = "pointer";

        btn.onmouseenter = () => btn.style.borderColor = "lime";
        btn.onmouseleave = () => btn.style.borderColor = "white";

        field.appendChild(btn);
    });
}

// --------------------
// Closed Loop Algorithm
// --------------------
function createClosedLoop(field) {
    let attempts = 0;
    let success = false;

    while (!success && attempts < 2000) {
        attempts++;

        // Reset
        cams.forEach(c => {
            c.connections = 0;
            c.usedSides = [];
        });
        lines = [];

        // Shuffle for randomness
        let shuffled = [...cams].sort(() => Math.random() - 0.5);

        // Step 1: Create initial spanning loop
        for (let i = 0; i < CAM_COUNT; i++) {
            let a = shuffled[i];
            let b = shuffled[(i + 1) % CAM_COUNT]; // wrap around
            if (!connectTwo(a, b, field)) break;
        }

        // Step 2: Add extra connections to reach exactly 2 per cam
        let finished = cams.every(c => c.connections === 2);
        if (finished) success = true;
    }

    if (!success) console.warn("Failed to generate stable loop");
}

function connectTwo(a, b, field) {
    if (a.connections >= 2 || b.connections >= 2) return false;

    let sideA = getFreeSide(a);
    let sideB = getFreeSide(b);
    if (!sideA || !sideB) return false;

    let start = getSidePoint(a, sideA);
    let end = getSidePoint(b, sideB);

    // L-shaped path
    let mid = { x: start.x, y: end.y };

    let segments = [
        { x1: start.x, y1: start.y, x2: mid.x, y2: mid.y },
        { x1: mid.x, y1: mid.y, x2: end.x, y2: end.y }
    ];

    if (intersects(segments)) return false;

    drawSegments(segments, field);
    lines.push(...segments);

    a.connections++;
    b.connections++;
    a.usedSides.push(sideA);
    b.usedSides.push(sideB);

    return true;
}

// --------------------
// Utility Functions
// --------------------
function getFreeSide(cam) {
    return sides.find(s => !cam.usedSides.includes(s));
}

function getSidePoint(cam, side) {
    let cx = cam.x + BUTTON_SIZE / 2;
    let cy = cam.y + BUTTON_SIZE / 2;
    if (side === "top") return { x: cx, y: cam.y };
    if (side === "bottom") return { x: cx, y: cam.y + BUTTON_SIZE };
    if (side === "left") return { x: cam.x, y: cy };
    if (side === "right") return { x: cam.x + BUTTON_SIZE, y: cy };
}

function intersects(newSegs) {
    for (let seg of newSegs) {
        for (let line of lines) {
            if (segmentOverlap(seg, line)) return true;
        }
    }
    return false;
}

function segmentOverlap(a, b) {
    if (a.x1 === a.x2 && b.x1 === b.x2 && a.x1 === b.x1) {
        return rangesOverlap(a.y1, a.y2, b.y1, b.y2);
    }
    if (a.y1 === a.y2 && b.y1 === b.y2 && a.y1 === b.y1) {
        return rangesOverlap(a.x1, a.x2, b.x1, b.x2);
    }
    return false;
}

function rangesOverlap(a1, a2, b1, b2) {
    let minA = Math.min(a1, a2);
    let maxA = Math.max(a1, a2);
    let minB = Math.min(b1, b2);
    let maxB = Math.max(b1, b2);
    return maxA >= minB && maxB >= minA;
}

function drawSegments(segs, field) {
    segs.forEach(s => {
        const line = document.createElement("div");
        line.className = "line";
        line.style.position = "absolute";
        line.style.background = "gray";

        if (s.x1 === s.x2) {
            line.style.left = s.x1 + "px";
            line.style.top = Math.min(s.y1, s.y2) + "px";
            line.style.width = "3px";
            line.style.height = Math.abs(s.y2 - s.y1) + "px";
        } else {
            line.style.left = Math.min(s.x1, s.x2) + "px";
            line.style.top = s.y1 + "px";
            line.style.width = Math.abs(s.x2 - s.x1) + "px";
            line.style.height = "3px";
        }

        field.appendChild(line);
    });
}

createUI();
