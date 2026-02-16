// ---------- 1️⃣ Toggle button ----------
const toggleBtn = document.createElement("img");
toggleBtn.src = chrome.runtime.getURL("cam-button.png");
toggleBtn.style.position = "fixed";
toggleBtn.style.bottom = "20px";
toggleBtn.style.right = "20px";
toggleBtn.style.width = "60px";
toggleBtn.style.height = "60px";
toggleBtn.style.cursor = "pointer";
toggleBtn.style.zIndex = "99999";
document.body.appendChild(toggleBtn);

// ---------- 2️⃣ Sidebar ----------
const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.bottom = "90px";
overlay.style.right = "20px";
overlay.style.width = "180px";
overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
overlay.style.border = "2px solid lime";
overlay.style.zIndex = "99998";
overlay.style.padding = "5px";
overlay.style.display = "none";
overlay.style.flexDirection = "column";
overlay.style.gap = "5px";
overlay.style.fontFamily = "monospace";
overlay.style.color = "lime";
overlay.style.fontSize = "12px";
document.body.appendChild(overlay);

// ---------- 3️⃣ Camera buttons ----------
const cams = [
  "cam1","cam2","cam3","cam4","cam5",
  "cam6","cam7","cam8","cam9","cam10"
];

const camLabels = [
  "Hallway","Dining","Kitchen","Stage","Parts",
  "Restroom","Office L","Office R","Backyard","Prize"
];

let camButtons = {};

function createCamButtons() {
  overlay.innerHTML = "";

  cams.forEach((cam, i) => {
    // Outer div for camera button
    const camDiv = document.createElement("div");
    camDiv.style.width = "160px";
    camDiv.style.height = "90px";
    camDiv.style.backgroundColor = "black";
    camDiv.style.border = "2px solid gray";
    camDiv.style.display = "flex";
    camDiv.style.flexDirection = "column";
    camDiv.style.justifyContent = "space-between";
    camDiv.style.alignItems = "center";
    camDiv.style.cursor = "pointer";
    camDiv.style.padding = "2px";
    camDiv.style.color = "gray";
    camDiv.style.fontSize = "10px";

    // Label on top
    const label = document.createElement("div");
    label.innerText = `CAM${i+1} - ${camLabels[i]}`;
    label.style.fontWeight = "bold";
    camDiv.appendChild(label);

    // ---------- Minimap recreated with divs ----------
    const map = document.createElement("div");
    map.style.width = "140px";
    map.style.height = "50px";
    map.style.backgroundColor = "#111"; // map background
    map.style.position = "relative";
    map.style.border = "1px solid gray";

    // Example rooms as squares
    const rooms = [
      { left: 5, top: 5 }, { left: 50, top: 5 }, { left: 95, top: 5 },
      { left: 5, top: 25 }, { left: 50, top: 25 }, { left: 95, top: 25 }
    ];

    rooms.forEach((pos, idx) => {
      const r = document.createElement("div");
      r.style.position = "absolute";
      r.style.width = "35px";
      r.style.height = "20px";
      r.style.left = pos.left + "px";
      r.style.top = pos.top + "px";
      r.style.backgroundColor = idx === i % rooms.length ? "lime" : "#333"; // highlight camera location
      map.appendChild(r);
    });

    camDiv.appendChild(map);

    // Hover effect
    camDiv.addEventListener("mouseenter", () => {
      camDiv.style.border = "2px solid lime";
      camDiv.style.color = "lime";
    });
    camDiv.addEventListener("mouseleave", () => {
      camDiv.style.border = "2px solid gray";
      camDiv.style.color = "gray";
    });

    // Left-click → switch tab
    camDiv.addEventListener("click", () => {
      chrome.storage.local.get(cam, ({ [cam]: url }) => {
        if (!url) return alert(`Set a URL first for ${cam}`);
        chrome.runtime.sendMessage({ action: "switchTab", url });
      });
    });

    // Right-click → set/change URL dynamically
    camDiv.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for CAM${i+1}:`);
      if (newUrl) chrome.storage.local.set({ [cam]: newUrl }, () => alert(`CAM${i+1} URL updated!`));
    });

    overlay.appendChild(camDiv);
    camButtons[cam] = camDiv;
  });
}

// ---------- 4️⃣ Toggle overlay ----------
let overlayVisible = false;
toggleBtn.addEventListener("click", () => {
  if (!overlayVisible) {
    createCamButtons();
    overlay.style.display = "flex";
  } else {
    overlay.style.display = "none";
  }
  overlayVisible = !overlayVisible;
});

// ---------- 5️⃣ Optional default URLs ----------
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
