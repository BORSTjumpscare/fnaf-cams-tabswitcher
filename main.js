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

// ---------- Camera panel (lower right, small squares) ----------
const camPanel = document.createElement("div");
camPanel.style.position = "fixed";
camPanel.style.bottom = "70px";
camPanel.style.right = "10px";
camPanel.style.display = "grid";
camPanel.style.gridTemplateColumns = "repeat(2, 40px)";
camPanel.style.gridGap = "5px";
camPanel.style.zIndex = "99998";
camPanel.style.backgroundColor = "rgba(0,0,0,0.8)";
camPanel.style.padding = "5px";
camPanel.style.border = "1px solid lime";
camPanel.style.display = "none"; // hidden initially
document.body.appendChild(camPanel);

// ---------- Minimap overlay (separate, small) ----------
const minimap = document.createElement("div");
minimap.style.position = "fixed";
minimap.style.bottom = "70px";
minimap.style.right = "110px";
minimap.style.width = "120px";
minimap.style.height = "90px";
minimap.style.backgroundColor = "#111";
minimap.style.border = "1px solid gray";
minimap.style.display = "flex";
minimap.style.flexWrap = "wrap";
minimap.style.padding = "2px";
minimap.style.zIndex = "99997";
document.body.appendChild(minimap);

// Rooms on minimap (small squares, outline only)
for (let i = 0; i < 6; i++) {
  const room = document.createElement("div");
  room.style.width = "35px";
  room.style.height = "35px";
  room.style.margin = "2px";
  room.style.border = "1px solid gray";
  room.style.backgroundColor = "transparent"; // only edges visible
  minimap.appendChild(room);
}

// ---------- Camera buttons ----------
const cams = [
  "cam1","cam2","cam3","cam4","cam5",
  "cam6","cam7","cam8","cam9","cam10"
];

let camButtons = {};

function createCamButtons() {
  camPanel.innerHTML = "";
  cams.forEach((cam,i)=>{
    const btn = document.createElement("div");
    btn.style.width = "40px";
    btn.style.height = "40px";
    btn.style.border = "1px solid gray";
    btn.style.backgroundColor = "black";
    btn.style.cursor = "pointer";
    btn.style.display = "flex";
    btn.style.justifyContent = "center";
    btn.style.alignItems = "center";
    btn.style.color = "gray";
    btn.style.fontSize = "8px";
    btn.innerText = `C${i+1}`;

    // Hover effect
    btn.addEventListener("mouseenter",()=>{ btn.style.color="lime"; btn.style.border="1px solid lime"; });
    btn.addEventListener("mouseleave",()=>{ btn.style.color="gray"; btn.style.border="1px solid gray"; });

    // Left-click → switch tab
    btn.addEventListener("click",()=>{
      chrome.storage.local.get(cam,({[cam]:url})=>{
        if(!url) return alert(`Set URL for ${cam}`);
        chrome.runtime.sendMessage({action:"switchTab",url});
      });
    });

    // Right-click → set/change URL
    btn.addEventListener("contextmenu",(e)=>{
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for ${cam}`);
      if(newUrl) chrome.storage.local.set({[cam]:newUrl},()=>alert(`${cam} URL updated!`));
    });

    camPanel.appendChild(btn);
    camButtons[cam] = btn;
  });
}

// ---------- Toggle cam panel ----------
let panelVisible = false;
toggleBtn.addEventListener("click",()=>{
  if(!panelVisible){
    createCamButtons();
    camPanel.style.display="grid";
  } else {
    camPanel.style.display="none";
  }
  panelVisible=!panelVisible;
});

// ---------- Optional default URLs ----------
chrome.storage.local.set({
  cam1:"https://www.google.com",
  cam2:"https://www.youtube.com",
  cam3:"https://chat.openai.com/",
  cam4:"https://news.google.com/",
  cam5:"https://twitter.com/",
  cam6:"https://reddit.com/",
  cam7:"https://github.com/",
  cam8:"https://stackoverflow.com/",
  cam9:"https://youtube.com/",
  cam10:"https://discord.com/"
});
