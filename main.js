// ---------- 1️⃣ Create the toggle button ----------
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

// ---------- 2️⃣ Create the sidebar (hidden by default) ----------
const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.bottom = "90px"; // above toggle button
overlay.style.right = "20px";
overlay.style.width = "160px";
overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
overlay.style.border = "2px solid lime";
overlay.style.zIndex = "99998";
overlay.style.padding = "5px";
overlay.style.display = "none"; // hidden initially
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
const camButtons = {};

// Function to create camera buttons dynamically
function createCamButtons() {
  overlay.innerHTML = ""; // clear existing buttons
  cams.forEach((cam) => {
    const btn = document.createElement("button");
    btn.innerText = cam.toUpperCase();
    btn.style.backgroundColor = "black";
    btn.style.color = "gray"; // default color
    btn.style.border = "1px solid gray";
    btn.style.cursor = "pointer";
    btn.style.padding = "5px";

    // Hover effect
    btn.addEventListener("mouseenter", () => {
      btn.style.color = "lime";
      btn.style.border = "1px solid lime";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.color = "gray";
      btn.style.border = "1px solid gray";
    });

    // Left-click → switch tab
    btn.addEventListener("click", () => {
      chrome.storage.local.get(cam, ({ [cam]: url }) => {
        if (!url) return alert(`Set a URL first for ${cam}`);
        chrome.runtime.sendMessage({ action: "switchTab", url });
      });
    });

    // Right-click → set/change URL dynamically
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for ${cam.toUpperCase()}:`);
      if (newUrl) {
        chrome.storage.local.set({ [cam]: newUrl }, () => {
          alert(`${cam.toUpperCase()} URL updated!`);
        });
      }
    });

    overlay.appendChild(btn);
    camButtons[cam] = btn;
  });
}

// ---------- 4️⃣ Toggle sidebar visibility ----------
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

// ---------- 5️⃣ Optional: set default URLs for testing ----------
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
