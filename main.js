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
const PANEL_SIZE = 280;
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
camPanel.style.position = "fixed";
document.body.appendChild(camPanel);

// SVG layer for connection lines
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

function isOverlapping(x, y, positions) {
  return positions.some(pos => {
    return !(
      x + BUTTON_SIZE + 10 < pos.x ||
      x > pos.x + BUTTON_SIZE + 10 ||
      y + BUTTON_SIZE + 10 < pos.y ||
      y > pos.y + BUTTON_SIZE + 10
    );
  });
}

function createCamButtons() {
  camPanel.innerHTML = "";
  camPanel.appendChild(svg);
  svg.innerHTML = "";

  const positions = [];
  const buttons = [];

  // Generate random non-overlapping positions
  cams.forEach(cam => {
    let x, y, attempts = 0;

    do {
      x = Math.floor(Math.random() * (PANEL_SIZE - BUTTON_SIZE));
      y = Math.floor(Math.random() * (PANEL_SIZE - BUTTON_SIZE));
      attempts++;
    } while (isOverlapping(x, y, positions) && attempts < 200);

    positions.push({ x, y, cam });
  });

  // Create buttons
  positions.forEach(pos => {
    const btn = document.createElement("div");
    btn.innerText = pos.cam.toUpperCase();

    btn.style.position = "absolute";
    btn.style.left = pos.x + "px";
    btn.style.top = pos.y + "px";
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
    btn.style.userSelect = "none";

    // Hover
    btn.addEventListener("mouseenter", () => {
      btn.style.border = "1px solid lime";
      btn.style.color = "lime";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.border = "1px solid gray";
      btn.style.color = "gray";
    });

    // Left click
    btn.addEventListener("click", () => {
      chrome.storage.local.get(pos.cam, ({ [pos.cam]: url }) => {
        if (!url) return alert(`Set URL for ${pos.cam}`);
        chrome.runtime.sendMessage({ action: "switchTab", url });
      });
    });

    // Right click
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for ${pos.cam.toUpperCase()}`);
      if (newUrl) {
        chrome.storage.local.set({ [pos.cam]: newUrl }, () =>
          alert(`${pos.cam.toUpperCase()} URL updated!`)
        );
      }
    });

    camPanel.appendChild(btn);
    buttons.push({ element: btn, ...pos });
  });

  // Randomly connect some cameras with grey lines
  buttons.forEach(btn => {
    if (Math.random() < 0.4) { // 40% chance to create a connection
      const target = buttons[Math.floor(Math.random() * buttons.length)];
      if (target !== btn) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", btn.x + BUTTON_SIZE / 2);
        line.setAttribute("y1", btn.y + BUTTON_SIZE / 2);
        line.setAttribute("x2", target.x + BUTTON_SIZE / 2);
        line.setAttribute("y2", target.y + BUTTON_SIZE / 2);
        line.setAttribute("stroke", "gray");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);
      }
    }
  });
}

// ---------- Toggle ----------
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
