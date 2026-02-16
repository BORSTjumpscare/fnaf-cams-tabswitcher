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

// Cameras
const cams = ["cam1","cam2","cam3","cam4","cam5","cam6","cam7","cam8","cam9","cam10"];

function createCamButtons() {
  camPanel.innerHTML = "";
  camPanel.appendChild(svg);
  svg.innerHTML = "";

  const nodes = [];

  // ---------- Create main hallway ----------
  const mainY = PANEL_SIZE / 2 - BUTTON_SIZE / 2;
  let x = 20;
  cams.slice(0, 5).forEach(cam => {
    nodes.push({ cam, x, y: mainY, connections: [] });
    x += BUTTON_SIZE + 40;
  });

  // ---------- Add vertical side rooms ----------
  cams.slice(5).forEach(cam => {
    const parent = nodes[Math.floor(Math.random() * 5)]; // connect to main hallway
    const direction = Math.random() < 0.5 ? -1 : 1; // above or below
    const offsetY = direction * (BUTTON_SIZE + 30);
    const offsetX = (Math.random() - 0.5) * 20; // slight x variation
    const x = parent.x + offsetX;
    const y = parent.y + offsetY;
    nodes.push({ cam, x, y, connections: [parent] });
    parent.connections.push({ cam, x, y }); // back connection
  });

  // ---------- Draw buttons ----------
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

  // ---------- Draw L-shaped lines ----------
  nodes.forEach(node => {
    node.connections.forEach(target => {
      drawLLine(node, target);
    });
  });
}

// ---------- Draw L-shaped lines ----------
function drawLLine(a, b) {
  const x1 = a.x + BUTTON_SIZE / 2;
  const y1 = a.y + BUTTON_SIZE / 2;
  const x2 = b.x + BUTTON_SIZE / 2;
  const y2 = b.y + BUTTON_SIZE / 2;

  // Horizontal then vertical
  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", x1);
  line1.setAttribute("y1", y1);
  line1.setAttribute("x2", x2);
  line1.setAttribute("y2", y1);
  line1.setAttribute("stroke", "gray");
  line1.setAttribute("stroke-width", "1");

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", x2);
  line2.setAttribute("y1", y1);
  line2.setAttribute("x2", x2);
  line2.setAttribute("y2", y2);
  line2.setAttribute("stroke", "gray");
  line2.setAttribute("stroke-width", "1");

  svg.appendChild(line1);
  svg.appendChild(line2);
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
