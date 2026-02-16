let locked = false;
let mapGenerated = false;

const CAM_COUNT = 10;
const MAX_LINES = 2;

const FIELD_SIZE = 420;
const BUTTON_SIZE = 40;
const MIN_DISTANCE = 90;

let cams = [];
let connections = [];
let usedSegments = [];

const sides = ["top", "right", "bottom", "left"];

function createUI() {
    const container = document.createElement("div");
    container.id = "cam-ui";
    container.style.position = "fixed";
    container.style.bottom = "10px";
    container.style.right = "10px";
    container.style.width = FIELD_SIZE + "px";
    container.style.height = FIELD_SIZE + "px";
    container.style.background = "black";
    container.style.zIndex = "999999";
    container.style.border = "2px solid white";
    container.style.display = "none";
    container.style.overflow = "hidden";
    document.body.appendChild(container);

    const toggle = document.createElement("img");
    toggle.src = chrome.runtime.getURL("cam-button.png");
    toggle.style.position = "fixed";
    toggle.style.bottom = "10px";
    toggle.style.right = "10px";
    toggle.style.width = "50px";
    toggle.style.cursor = "pointer";
    toggle.style.zIndex = "1000000";
    document.body.appendChild(toggle);

    toggle.onclick = () => {
        container.style.display =
            container.style.display === "none" ? "block" : "none";

        if (!locked && !mapGenerated) {
            generateMap(container);
            mapGenerated = true;
        }
    };

    const lockBtn = document.createElement("button");
    lockBtn.innerText = "LOCK";
    lockBtn.style.position = "absolute";
    lockBtn.style.top = "5px";
    lockBtn.style.left = "5px";
    lockBtn.style.zIndex = "1000001";
    lockBtn.onclick = () => {
        locked = !locked;
        lockBtn.innerText = locked ? "LOCKED" : "LOCK";
    };
    container.appendChild(lockBtn);
}

function generateMap(container) {
    container.querySelectorAll(".cam").forEach(e => e.remove());
    container.querySelectorAll(".line").forEach(e => e.remove());

    cams = [];
    connections = [];
    usedSegments = [];

    generatePositions();
    createCamButtons(container);
    connectCams(container);
}

function generatePositions() {
    cams = [];

    // Cam1 forced upper-left
    cams.push({
        id: 1,
        x: 40,
        y: 40,
        connections: 0,
        usedSides: []
    });

    while (cams.length < CAM_COUNT) {
        let valid = false;

        while (!valid) {
            const x = Math.floor(Math.random() * (FIELD_SIZE - 80)) + 40;
            const y = Math.floor(Math.random() * (FIELD_SIZE - 80)) + 40;

            valid = cams.every(c =>
                Math.hypot(c.x - x, c.y - y) >= MIN_DISTANCE
            );

            if (valid) {
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
}

function createCamButtons(container) {
    cams.forEach(cam => {
        const btn = document.createElement("div");
        btn.className = "cam";
        btn.innerText = "cam" + cam.id;
        btn.style.position = "absolute";
        btn.style.width = BUTTON_SIZE + "px";
        btn.style.height = BUTTON_SIZE + "px";
        btn.style.left = cam.x + "px";
        btn.style.top = cam.y + "px";
        btn.style.border = "2px solid white";
        btn.style.color = "white";
        btn.style.fontSize = "10px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.style.userSelect = "none";

        btn.onmouseenter = () => btn.style.borderColor = "lime";
        btn.onmouseleave = () => btn.style.borderColor = "white";

        container.appendChild(btn);
    });
}

function connectCams(container) {
    let attempts = 0;

    while (!allConnected() && attempts < 500) {
        attempts++;

        for (let cam of cams) {
            if (cam.connections >= MAX_LINES) continue;

            const nearest = findNearestAvailable(cam);

            if (nearest) {
                tryConnect(cam, nearest, container);
            }
        }
    }
}

function findNearestAvailable(cam) {
    const sorted = cams
        .filter(c => c.id !== cam.id && c.connections < MAX_LINES)
        .sort((a, b) =>
            Math.hypot(cam.x - a.x, cam.y - a.y) -
            Math.hypot(cam.x - b.x, cam.y - b.y)
        );

    return sorted[0] || null;
}

function tryConnect(a, b, container) {
    if (a.connections >= MAX_LINES || b.connections >= MAX_LINES) return;

    const sideA = getFreeSide(a);
    const sideB = getFreeSide(b);

    if (!sideA || !sideB) return;

    const path = generateOrthogonalPath(a, b, sideA, sideB);

    if (!path) return;

    if (pathIntersects(path)) return;

    drawPath(path, container);

    a.connections++;
    b.connections++;

    a.usedSides.push(sideA);
    b.usedSides.push(sideB);

    usedSegments.push(...path);
}

function generateOrthogonalPath(a, b, sideA, sideB) {
    const start = getSidePoint(a, sideA);
    const end = getSidePoint(b, sideB);

    const mid = { x: end.x, y: start.y };

    return [
        { x1: start.x, y1: start.y, x2: mid.x, y2: mid.y },
        { x1: mid.x, y1: mid.y, x2: end.x, y2: end.y }
    ];
}

function getSidePoint(cam, side) {
    const centerX = cam.x + BUTTON_SIZE / 2;
    const centerY = cam.y + BUTTON_SIZE / 2;

    if (side === "top") return { x: centerX, y: cam.y };
    if (side === "bottom") return { x: centerX, y: cam.y + BUTTON_SIZE };
    if (side === "left") return { x: cam.x, y: centerY };
    if (side === "right") return { x: cam.x + BUTTON_SIZE, y: centerY };
}

function getFreeSide(cam) {
    return sides.find(s => !cam.usedSides.includes(s));
}

function pathIntersects(path) {
    for (let seg of path) {
        for (let used of usedSegments) {
            if (segmentsIntersect(seg, used)) return true;
        }
    }
    return false;
}

function segmentsIntersect(a, b) {
    if (a.x1 === a.x2 && b.x1 === b.x2) {
        if (a.x1 !== b.x1) return false;
        return overlap(a.y1, a.y2, b.y1, b.y2);
    }
    if (a.y1 === a.y2 && b.y1 === b.y2) {
        if (a.y1 !== b.y1) return false;
        return overlap(a.x1, a.x2, b.x1, b.x2);
    }
    return false;
}

function overlap(a1, a2, b1, b2) {
    const minA = Math.min(a1, a2);
    const maxA = Math.max(a1, a2);
    const minB = Math.min(b1, b2);
    const maxB = Math.max(b1, b2);
    return maxA >= minB && maxB >= minA;
}

function drawPath(path, container) {
    path.forEach(seg => {
        const line = document.createElement("div");
        line.className = "line";
        line.style.position = "absolute";
        line.style.background = "gray";

        if (seg.x1 === seg.x2) {
            line.style.left = seg.x1 + "px";
            line.style.top = Math.min(seg.y1, seg.y2) + "px";
            line.style.width = "3px";
            line.style.height = Math.abs(seg.y2 - seg.y1) + "px";
        } else {
            line.style.left = Math.min(seg.x1, seg.x2) + "px";
            line.style.top = seg.y1 + "px";
            line.style.width = Math.abs(seg.x2 - seg.x1) + "px";
            line.style.height = "3px";
        }

        container.appendChild(line);
    });
}

function allConnected() {
    return cams.every(c => c.connections <= MAX_LINES);
}

createUI();
