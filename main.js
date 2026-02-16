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

// ---------- Black panel ----------
const PANEL_SIZE = 260; // slightly bigger
const BUTTON_SIZE = 40;
const SPACING = 15;

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

// ---------- Camera list ----------
const cams = [
  "cam1","cam2","cam3","cam4","cam5",
  "cam6","cam7","cam8","cam9","cam10"
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createCamButtons() {
  camPanel.innerHTML = "";

  // Create safe placement grid
  const positions = [];
  const step = BUTTON_SIZE + SPACING;

  for (let y = SPACING; y < PANEL_SIZE - BUTTON_SIZE; y += step) {
    for (let x = SPACING; x < PANEL_SIZE - BUTTON_SIZE; x += step) {
      positions.push({ x, y });
    }
  }

  shuffle(positions);

  cams.forEach((cam, index) => {
    const btn = document.createElement("div");
    btn.innerText = cam.toUpperCase();

    btn.style.position = "absolute";
    btn.style.width = BUTTON_SIZE + "px";
    btn.style.height = BUTTON_SIZE + "px";
    btn.style.left = positions[index].x + "px";
    btn.style.top = positions[index].y + "px";

    btn.style.backgroundColor = "black";
    btn.style.border = "1px solid gray";
    btn.style.color = "gray";
    btn.style.display = "flex";
    btn.style.justifyContent = "center";
    btn.style.alignItems = "center";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "9px";
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
      chrome.storage.local.get(cam, ({ [cam]: url }) => {
        if (!url) return alert(`Set URL for ${cam}`);
        chrome.runtime.sendMessage({ action: "switchTab", url });
      });
    });

    // Right click
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for ${cam.toUpperCase()}`);
      if (newUrl) {
        chrome.storage.local.set({ [cam]: newUrl }, () =>
          alert(`${cam.toUpperCase()} URL updated!`)
        );
      }
    });

    camPanel.appendChild(btn);
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

// ---------- Optional default URLs ----------
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
