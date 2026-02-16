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

// ---------- Sidebar ----------
const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.bottom = "70px";
overlay.style.right = "10px";
overlay.style.width = "120px"; // smaller
overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
overlay.style.border = "1px solid lime";
overlay.style.zIndex = "99998";
overlay.style.padding = "3px";
overlay.style.display = "none";
overlay.style.flexDirection = "column";
overlay.style.gap = "3px";
overlay.style.fontFamily = "monospace";
overlay.style.color = "lime";
overlay.style.fontSize = "10px";
document.body.appendChild(overlay);

// ---------- Camera buttons ----------
const cams = ["cam1","cam2","cam3","cam4","cam5","cam6","cam7","cam8","cam9","cam10"];
const camLabels = ["Hallway","Dining","Kitchen","Stage","Parts","Restroom","Office L","Office R","Backyard","Prize"];
let camButtons = {};

function createCamButtons() {
  overlay.innerHTML = "";

  cams.forEach((cam,i)=>{
    const camDiv = document.createElement("div");
    camDiv.style.width = "110px";
    camDiv.style.height = "60px"; // smaller
    camDiv.style.backgroundColor = "black";
    camDiv.style.border = "1px solid gray"; // simple outline
    camDiv.style.display = "flex";
    camDiv.style.flexDirection = "column";
    camDiv.style.justifyContent = "space-between";
    camDiv.style.alignItems = "center";
    camDiv.style.cursor = "pointer";
    camDiv.style.padding = "2px";
    camDiv.style.color = "gray";
    camDiv.style.fontSize = "9px";
    camDiv.style.textAlign = "center";

    // Label
    const label = document.createElement("div");
    label.innerText = `CAM${i+1} - ${camLabels[i]}`;
    camDiv.appendChild(label);

    // ---------- Mini FNAF map inside button ----------
    const map = document.createElement("div");
    map.style.width = "100px";
    map.style.height = "35px";
    map.style.position = "relative";

    // Edge-only squares representing rooms
    const rooms = [
      {left:0,top:0},{left:35,top:0},{left:70,top:0},
      {left:0,top:18},{left:35,top:18},{left:70,top:18}
    ];

    rooms.forEach((pos, idx)=>{
      const r = document.createElement("div");
      r.style.position="absolute";
      r.style.width="30px";
      r.style.height="15px";
      r.style.left=pos.left+"px";
      r.style.top=pos.top+"px";
      r.style.border="1px solid gray"; // just outline
      r.style.backgroundColor="transparent"; // no fill
      if(idx === i%rooms.length) r.style.borderColor="lime"; // highlight camera location
      map.appendChild(r);
    });

    camDiv.appendChild(map);

    // Hover effect
    camDiv.addEventListener("mouseenter",()=>{
      camDiv.style.color="lime";
      camDiv.style.border="1px solid lime";
    });
    camDiv.addEventListener("mouseleave",()=>{
      camDiv.style.color="gray";
      camDiv.style.border="1px solid gray";
    });

    // Left-click → switch/open tab
    camDiv.addEventListener("click",()=>{
      chrome.storage.local.get(cam,({[cam]:url})=>{
        if(!url) return alert(`Set URL for ${cam}`);
        chrome.runtime.sendMessage({action:"switchTab",url});
      });
    });

    // Right-click → set/change URL
    camDiv.addEventListener("contextmenu",(e)=>{
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for CAM${i+1}`);
      if(newUrl) chrome.storage.local.set({[cam]:newUrl},()=>alert(`CAM${i+1} URL updated!`));
    });

    overlay.appendChild(camDiv);
    camButtons[cam] = camDiv;
  });
}

// ---------- Toggle overlay ----------
let overlayVisible = false;
toggleBtn.addEventListener("click",()=>{
  if(!overlayVisible){
    createCamButtons();
    overlay.style.display="flex";
  } else {
    overlay.style.display="none";
  }
  overlayVisible = !overlayVisible;
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
