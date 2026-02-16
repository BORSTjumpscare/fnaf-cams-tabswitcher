// ---------- Toggle button ----------
const toggleBtn = document.createElement("img");
toggleBtn.src = chrome.runtime.getURL("cam-button.png");
toggleBtn.style.position = "fixed";
toggleBtn.style.bottom = "10px";
toggleBtn.style.right = "10px";
toggleBtn.style.width = "50px";
toggleBtn.style.height = "50px";
toggleBtn.style.cursor = "pointer";
toggleBtn.style.zIndex = "99999";
document.body.appendChild(toggleBtn);

// ---------- Panel ----------
const PANEL_SIZE = 320;
const BUTTON_SIZE = 40;

const camPanel = document.createElement("div");
camPanel.style.position = "fixed";
camPanel.style.bottom = "70px";
camPanel.style.right = "10px";
camPanel.style.width = PANEL_SIZE + "px";
camPanel.style.height = PANEL_SIZE + "px";
camPanel.style.backgroundColor = "black";
camPanel.style.border = "1px solid lime";
camPanel.style.display = "none";
camPanel.style.zIndex = "99998";
camPanel.style.overflow = "hidden";
document.body.appendChild(camPanel);

// SVG for lines
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", PANEL_SIZE);
svg.setAttribute("height", PANEL_SIZE);
svg.style.position = "absolute";
svg.style.top = "0";
svg.style.left = "0";
svg.style.zIndex = "0";
camPanel.appendChild(svg);

// ---------- Cameras ----------
const cams = [
  "cam1","cam2","cam3","cam4","cam5",
  "cam6","cam7","cam8","cam9","cam10"
];

function isOverlapping(x, y, nodes) {
  return nodes.some(n => Math.hypot(n.x - x, n.y - y) < BUTTON_SIZE + 10);
}

// ---------- Generate random cams ----------
function generatePositions() {
  const nodes = [];
  cams.forEach(cam => {
    let x, y, tries = 0;
    do {
      x = Math.random() * (PANEL_SIZE - BUTTON_SIZE);
      y = Math.random() * (PANEL_SIZE - BUTTON_SIZE);
      tries++;
    } while (isOverlapping(x, y, nodes) && tries < 300);
    nodes.push({ cam, x, y, connections: [] });
  });
  return nodes;
}

// ---------- Connect nodes fully ----------
function connectNodes(nodes) {
  const drawn = new Set();

  // Step 1: Ring
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const b = nodes[(i + 1) % nodes.length];
    a.connections.push(b);
    b.connections.push(a);
    drawn.add([a.cam, b.cam].sort().join("-"));
  }

  // Step 2: Add extra connections to ensure min 2 per cam
  nodes.forEach(node => {
    while (node.connections.length < 2) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      const key = [node.cam, target.cam].sort().join("-");
      if (target !== node && !node.connections.includes(target) && !drawn.has(key)) {
        node.connections.push(target);
        target.connections.push(node);
        drawn.add(key);
      }
    }
  });

  return drawn;
}

// ---------- Draw Manhattan lines without crossing ----------
function drawPathNoCross(a, b, usedSegments) {
  const x1 = a.x + BUTTON_SIZE / 2;
  const y1 = a.y + BUTTON_SIZE / 2;
  const x2 = b.x + BUTTON_SIZE / 2;
  const y2 = b.y + BUTTON_SIZE / 2;

  // Randomly decide number of segments (1-3)
  const segments = Math.floor(Math.random() * 3) + 1;
  let points = [{ x: x1, y: y1 }];

  if (segments === 1) {
    points.push({ x: x2, y: y1 });
    points.push({ x: x2, y: y2 });
  } else if (segments === 2) {
    const midX = x1 + (x2 - x1) * Math.random();
    points.push({ x: midX, y: y1 });
    points.push({ x: midX, y: y2 });
    points.push({ x: x2, y: y2 });
  } else {
    const midX1 = x1 + (x2 - x1) * 0.3;
    const midY1 = y1 + (y2 - y1) * 0.3;
    const midX2 = x1 + (x2 - x1) * 0.7;
    const midY2 = y1 + (y2 - y1) * 0.7;
    points.push({ x: midX1, y: y1 });
    points.push({ x: midX1, y: midY1 });
    points.push({ x: midX2, y: midY1 });
    points.push({ x: midX2, y: midY2 });
    points.push({ x: x2, y: y2 });
  }

  // Draw segments while nudging if occupied
  for (let i = 0; i < points.length - 1; i++) {
    let xStart = points[i].x;
    let yStart = points[i].y;
    let xEnd = points[i + 1].x;
    let yEnd = points[i + 1].y;

    // Check horizontal
    if (yStart === yEnd) {
      const key = `H:${Math.min(xStart,xEnd)}-${yStart}-${Math.max(xStart,xEnd)}`;
      if (usedSegments.has(key)) yStart += 3; yEnd += 3;
      usedSegments.add(key);
    }
    // Check vertical
    if (xStart === xEnd) {
      const key = `V:${xStart}-${Math.min(yStart,yEnd)}-${Math.max(yStart,yEnd)}`;
      if (usedSegments.has(key)) xStart += 3; xEnd += 3;
      usedSegments.add(key);
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", xStart);
    line.setAttribute("y1", yStart);
    line.setAttribute("x2", xEnd);
    line.setAttribute("y2", yEnd);
    line.setAttribute("stroke", "gray");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
  }
}

// ---------- Create cam buttons and network ----------
function createCamButtons() {
  camPanel.innerHTML = "";
  camPanel.appendChild(svg);
  svg.innerHTML = "";

  const nodes = generatePositions();
  const drawn = connectNodes(nodes);
  const usedSegments = new Set();

  nodes.forEach(node => {
    node.connections.forEach(target => {
      const key = [node.cam, target.cam].sort().join("-");
      if (!drawn.has(key)) return;
      drawPathNoCross(node, target, usedSegments);
      drawn.delete(key);
    });
  });

  // Create buttons
  nodes.forEach(node => {
    const btn = document.createElement("div");
    btn.innerText = node.cam.toUpperCase();
    btn.style.position = "absolute";
    btn.style.left = node.x + "px";
    btn.style.top = node.y + "px";
    btn.style.width = BUTTON_SIZE + "px";
    btn.style.height = BUTTON_SIZE + "px";
    btn.style.backgroundColor = "black";
    btn.style.border = "1px solid gray";
    btn.style.color = "gray";
    btn.style.display = "flex";
    btn.style.justifyContent = "center";
    btn.style.alignItems = "center";
    btn.style.fontSize = "9px";
    btn.style.cursor = "pointer";
    btn.style.zIndex = "2";

    btn.addEventListener("mouseenter", () => {
      btn.style.border = "1px solid lime";
      btn.style.color = "lime";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.border = "1px solid gray";
      btn.style.color = "gray";
    });

    btn.addEventListener("click", () => {
      chrome.storage.local.get(node.cam, ({ [node.cam]: url }) => {
        if (!url) return alert(`Set URL for ${node.cam}`);
        chrome.runtime.sendMessage({ action: "switchTab", url });
      });
    });

    btn.addEventListener("contextmenu", e => {
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for ${node.cam.toUpperCase()}`);
      if (newUrl) chrome.storage.local.set({ [node.cam]: newUrl }, () =>
        alert(`${node.cam.toUpperCase()} URL updated!`)
      );
    });

    camPanel.appendChild(btn);
    node.element = btn;
  });
}

// ---------- Toggle panel ----------
let panelVisible = false;
toggleBtn.addEventListener("click", () => {
  if (!panelVisible) {
    createCamButtons();
    camPanel.style.display = "block";
  } else {
    camPanel.style.display = "none";
  }
  panelVisible = !panelVisible;
});

// ---------- Default URLs ----------
chrome.storage.local.set({
  cam1: "https://www.google.com",
  cam2: "https://www.youtube.com",
  cam3: "https://chat.openai.com/",
  cam4: "https://news.google.com/",
  cam5: "https://twitter.com/",
  cam6: "https://reddit.com/",
  cam7: "https://github.com/",
  cam8: "https://stackoverflow.com/",
  cam9: "https://youtube.com/",
  cam10: "https://discord.com/"
});
