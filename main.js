let locked = false;
const CAM_COUNT = 10;
const FIELD_SIZE = 420;
const BUTTON_SIZE = 36;
const MIN_DISTANCE = 110;
const MAX_LINES = 2;

let cams = [];
let lines = [];
const sides = ["top", "right", "bottom", "left"];

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

let field, lockBtn, toggleBtn;

// --------------------
// Create UI
// --------------------
function createUI() {
    // Only create field once
    field = document.createElement("div");
    field.id = "cam-field";
    field.style.position = "fixed";
    field.style.bottom = "15px";
    field.style.right = "75px";
    field.style.width = FIELD_SIZE + "px";
    field.style.height = FIELD_SIZE + "px";
    field.style.background = "rgba(0,0,0,0.6)";
    field.style.border = "2px solid white";
    field.style.display = "none";
    field.style.zIndex = "999999";
    field.style.pointerEvents = "none"; // allow clicks through field
    field.style.overflow = "visible";
    document.body.appendChild(field);

    // Toggle button
    toggleBtn = document.createElement("img");
    toggleBtn.src = chrome.runtime.getURL("cam-button.png");
    toggleBtn.style.position = "fixed";
    toggleBtn.style.bottom = "15px";
    toggleBtn.style.right = "15px";
    toggleBtn.style.width = "50px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.zIndex = "1000000";
    document.body.appendChild(toggleBtn);

    toggleBtn.onclick = () => {
        if (field.style.display === "none") {
            field.style.display = "block";
            if (!locked) generateMap();
        } else {
            field.style.display = "none";
        }
    };

    // Lock button inside field
    lockBtn = document.createElement("button");
    lockBtn.innerText = "LOCK";
    lockBtn.style.position = "absolute";
    lockBtn.style.top = "5px";
    lockBtn.style.left = "5px";
    lockBtn.style.pointerEvents = "auto"; // clickable
    lockBtn.onclick = () => {
        locked = !locked;
        lockBtn.innerText = locked ? "LOCKED" : "LOCK";
    };
    field.appendChild(lockBtn);
}

// --------------------
// Generate map
// --------------------
function generateMap() {
    // Remove previous cams and lines
    field.querySelectorAll(".cam").forEach(e => e.remove());
    field.querySelectorAll(".line").forEach(e => e.remove());
    cams = [];
    lines = [];

    generateCams();
    createFullClosedLoop();
    drawLines();
    drawCams();
}

// --------------------
// Generate cams randomly
// --------------------
function generateCams() {
    while (cams.length < CAM_COUNT) {
        let x = Math.random() * (FIELD_SIZE - BUTTON_SIZE * 2) + BUTTON_SIZE;
        let y = Math.random() * (FIELD_SIZE - BUTTON_SIZE * 2) + BUTTON_SIZE;

        if (cams.every(c => Math.hypot(c.x - x, c.y - y) > MIN_DISTANCE)) {
            cams.push({ id: cams.length, x, y, connections: 0, usedSides: [] });
        }
    }
}

// --------------------
// Draw cams
// --------------------
function drawCams() {
    cams.forEach(cam => {
        const btn = document.createElement("div");
        btn.className = "cam";
        btn.innerText = "cam" + (cam.id + 1);
        btn.style.position = "absolute";
        btn.style.left = cam.x + "px";
        btn.style.top = cam.y + "px";
        btn.style.width = BUTTON_SIZE + "px";
        btn.style.height = BUTTON_SIZE + "px";
        btn.style.background = "black";
        btn.style.border = "2px solid white";
        btn.style.color = "white";
        btn.style.fontSize = "10px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.userSelect = "none";
        btn.style.cursor = "pointer";
        btn.style.zIndex = "10";
        btn.style.pointerEvents = "auto"; // only buttons clickable

        btn.onmouseenter = () => btn.style.borderColor = "lime";
        btn.onmouseleave = () => btn.style.borderColor = "white";

        btn.onclick = () => chrome.runtime.sendMessage({ action: "switchTabToUrl", url: camURLs[cam.id] });

        btn.oncontextmenu = (e) => {
            e.preventDefault();
            const newURL = prompt(`Enter new URL for cam${cam.id + 1}:`, camURLs[cam.id]);
            if (newURL && newURL.trim() !== "") camURLs[cam.id] = newURL.trim();
        };

        field.appendChild(btn);
    });
}

// --------------------
// Closed loop
// --------------------
function createFullClosedLoop() {
    for (let i = 0; i < CAM_COUNT; i++) {
        connectTwo(cams[i], cams[(i + 1) % CAM_COUNT]);
    }

    let done = false;
    while (!done) {
        done = true;
        for (let cam of cams) {
            if (cam.connections < MAX_LINES) {
                let target = findNearestAvailable(cam);
                if (target) {
                    connectTwo(cam, target);
                    done = false;
                }
            }
        }
    }
}

// --------------------
// Connect cams
// --------------------
function connectTwo(a, b) {
    if (a.connections >= MAX_LINES || b.connections >= MAX_LINES) return;

    let sideA = getFreeSide(a);
    let sideB = getFreeSide(b);
    if (!sideA || !sideB) return;

    let start = getSidePointEdge(a, sideA);
    let end = getSidePointEdge(b, sideB);

    // L-corner: horizontal then vertical
    let corner = { x: start.x, y: end.y };

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
function getSidePointEdge(cam, side) {
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
function drawLines() {
    lines.forEach(s => {
        const line = document.createElement("div");
        line.className = "line";
        line.style.position = "absolute";
        line.style.background = "gray";
        line.style.zIndex = "1";
        line.style.pointerEvents = "none"; // lines not clickable

        if (s.x1 === s.x2) {
            line.style.left = s.x1 + "px";
            line.style.top = Math.min(s.y1, s.y2) + "px";
            line.style.width = "2px";
            line.style.height = Math.abs(s.y2 - s.y1) + "px";
        } else {
            line.style.left = Math.min(s.x1, s.x2) + "px";
            line.style.top = Math.min(s.y1, s.y2) + "px";
            line.style.width = Math.abs(s.x2 - s.x1) + "px";
            line.style.height = "2px";
        }

        field.appendChild(line);
    });
}

createUI();
