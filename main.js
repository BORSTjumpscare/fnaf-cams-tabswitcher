let locked = false;
const CAM_COUNT = 10;
const FIELD_SIZE = 420;
const BUTTON_SIZE = 36;
const MIN_DISTANCE = 110;
const MAX_LINES = 2;

let cams = [];
let lines = [];

const sides = ["top", "right", "bottom", "left"];

// URLs for each cam
let camURLs = [
    "https://www.google.com",
    "https://www.youtube.com",
    "https://www.reddit.com",
    "https://news.ycombinator.com",
    "https://chat.openai.com",
    "https://github.com",
    "https://stackoverflow.com",
    "https://twitter.com",
    "https://wikipedia.org",
    "https://bing.com"
];

// --------------------
// UI
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
        if (!locked) generateMap(field);
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
// Generate map
// --------------------
function generateMap(field) {
    field.querySelectorAll(".cam").forEach(e => e.remove());
    field.querySelectorAll(".line").forEach(e => e.remove());

    cams = [];
    lines = [];

    generateCams();
    createClosedLoop();
    drawLines(field);
    drawCams(field); // cams on top
}

// --------------------
// Generate cams randomly with spacing
// --------------------
function generateCams() {
    while (cams.length < CAM_COUNT) {
        let x = Math.random() * (FIELD_SIZE - 60) + 20;
        let y = Math.random() * (FIELD_SIZE - 60) + 20;

        if (cams.every(c => Math.hypot(c.x - x, c.y - y) > MIN_DISTANCE)) {
            cams.push({
                id: cams.length,
                x,
                y,
                connections: 0,
                usedSides: []
            });
        }
    }
}

// --------------------
// Draw cams
// --------------------
function drawCams(field) {
    cams.forEach(cam => {
        const btn = document.createElement("div");
        btn.className = "cam";
        btn.innerText = "cam" + (cam.id + 1);
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
        btn.style.zIndex = "10";

        btn.onmouseenter = () => btn.style.borderColor = "lime";
        btn.onmouseleave = () => btn.style.borderColor = "white";

        btn.onclick = () => {
            chrome.runtime.sendMessage({
                action: "switchTab",
                url: camURLs[cam.id]
            });
        };

        field.appendChild(btn);
    });
}

// --------------------
// Closed loop generation with nearest neighbor
// --------------------
function createClosedLoop() {
    let camsCopy = [...cams].sort(() => Math.random() - 0.5);

    // Step 1: connect nearest neighbors first
    for (let cam of camsCopy) {
        while (cam.connections < MAX_LINES) {
            let target = findNearestAvailable(cam);
            if (!target) break;
            connectTwo(cam, target);
        }
    }

    // Step 2: ensure a closed loop (wrap-around)
    cams.forEach((cam, i) => {
        let next = cams[(i + 1) % CAM_COUNT];
        if (cam.connections < MAX_LINES && next.connections < MAX_LINES) {
            connectTwo(cam, next);
        }
    });
}

// --------------------
// Connect two cams with proper corners
// --------------------
function connectTwo(a, b) {
    if (a.connections >= MAX_LINES || b.connections >= MAX_LINES) return;

    let sideA = getFreeSide(a);
    let sideB = getFreeSide(b);
    if (!sideA || !sideB) return;

    let start = getSidePoint(a, sideA);
    let end = getSidePoint(b, sideB);

    // L-shaped corner (random orientation)
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
// Helpers
// --------------------
function getFreeSide(cam) { return sides.find(s => !cam.usedSides.includes(s)); }
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
    for (let s of segs) for (let l of lines) if (segmentOverlap(s, l)) return true;
    return false;
}
function segmentOverlap(a, b) {
    if (a.x1 === a.x2 && b.x1 === b.x2 && a.x1 === b.x1) return rangesOverlap(a.y1, a.y2, b.y1, b.y2);
    if (a.y1 === a.y2 && b.y1 === b.y2 && a.y1 === b.y1) return rangesOverlap(a.x1, a.x2, b.x1, b.x2);
    return false;
}
function rangesOverlap(a1, a2, b1, b2) {
    let minA = Math.min(a1, a2), maxA = Math.max(a1, a2);
    let minB = Math.min(b1, b2), maxB = Math.max(b1, b2);
    return maxA >= minB && maxB >= minA;
}

// --------------------
// Draw lines under cams
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
