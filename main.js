let locked = false;
let generated = false;

const CAM_COUNT = 10;
const FIELD_SIZE = 420;
const BUTTON_SIZE = 36;
const MIN_DISTANCE = 110;
const MAX_LINES = 2;

let cams = [];
let lines = [];
const sides = ["top", "right", "bottom", "left"];

// --------------------
// UI Setup
// --------------------
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
        field.style.display = field.style.display === "none" ? "block" : "none";

        if (!locked) {
            generateMap(field);
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

// --------------------
// Map Generation
// --------------------
function generateMap(field) {
    field.querySelectorAll(".cam").forEach(e => e.remove());
    field.querySelectorAll(".line").forEach(e => e.remove());

    cams = [];
    lines = [];

    generateCams();
    createClosedLoop(field);
    drawLines(field);  // first draw lines
    drawCams(field);   // then draw cams on top
}

// --------------------
// Generate random cams
// --------------------
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

// --------------------
// Draw cam buttons
// --------------------
function drawCams(field) {
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
        btn.style.zIndex = "10"; // ON TOP OF LINES

        btn.onmouseenter = () => btn.style.borderColor = "lime";
        btn.onmouseleave = () => btn.style.borderColor = "white";

        field.appendChild(btn);
    });
}

// --------------------
// Closed Loop Creation
// --------------------
function createClosedLoop(field) {
    let shuffled = [...cams].sort(() => Math.random() - 0.5);

    // Step 1: Create initial loop (wrap around)
    for (let i = 0; i < CAM_COUNT; i++) {
        let a = shuffled[i];
        let b = shuffled[(i + 1) % CAM_COUNT];
        connectTwo(a, b);
    }

    // Step 2: Fill remaining connections to reach exactly 2 per cam
    let attempts = 0;
    while (cams.some(c => c.connections < MAX_LINES) && attempts < 1000) {
        attempts++;
        for (let a of cams) {
            if (a.connections >= MAX_LINES) continue;
            let b = findNearestAvailable(a);
            if (b) connectTwo(a, b);
        }
    }
}

// --------------------
// Connect two cams with L-shaped line
// --------------------
function connectTwo(a, b) {
    if (a.connections >= MAX_LINES || b.connections >= MAX_LINES) return;

    let sideA = getFreeSide(a);
    let sideB = getFreeSide(b);
    if (!sideA || !sideB) return;

    let start = getSidePoint(a, sideA);
    let end = getSidePoint(b, sideB);

    // Create true L-shaped corner: randomize bend direction
    let corner = Math.random() > 0.5
        ? { x: start.x, y: end.y }
        : { x: end.x, y: start.y };

    let segs = [
        { x1: start.x, y1: start.y, x2: corner.x, y2: corner.y },
        { x1: corner.x, y1: corner.y, x2: end.x, y2: end.y }
    ];

    if (intersects(segs)) return;

    lines.push(...segs);

    a.connections++;
    b.connections++;
    a.usedSides.push(sideA);
    b.usedSides.push(sideB);
}

// --------------------
// Helper Functions
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

function findNearestAvailable(cam) {
    return cams
        .filter(c => c.id !== cam.id && c.connections < MAX_LINES)
        .sort((a, b) => Math.hypot(cam.x - a.x, cam.y - a.y) - Math.hypot(cam.x - b.x, cam.y - b.y))[0];
}

function intersects(segs) {
    for (let s of segs) {
        for (let l of lines) {
            if (segmentOverlap(s, l)) return true;
        }
    }
    return false;
}

function segmentOverlap(a, b) {
    if (a.x1 === a.x2 && b.x1 === b.x2 && a.x1 === b.x1)
        return rangesOverlap(a.y1, a.y2, b.y1, b.y2);
    if (a.y1 === a.y2 && b.y1 === b.y2 && a.y1 === b.y1)
        return rangesOverlap(a.x1, a.x2, b.x1, b.x2);
    return false;
}

function rangesOverlap(a1, a2, b1, b2) {
    let minA = Math.min(a1, a2), maxA = Math.max(a1, a2);
    let minB = Math.min(b1, b2), maxB = Math.max(b1, b2);
    return maxA >= minB && maxB >= minA;
}

// --------------------
// Draw lines first
// --------------------
function drawLines(field) {
    lines.forEach(s => {
        const line = document.createElement("div");
        line.className = "line";
        line.style.position = "absolute";
        line.style.background = "gray";
        line.style.zIndex = "1";

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
