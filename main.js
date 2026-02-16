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
const GRID_SIZE = 40;

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
const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("width", PANEL_SIZE);
svg.setAttribute("height", PANEL_SIZE);
svg.style.position = "absolute";
svg.style.top = "0";
svg.style.left = "0";
svg.style.zIndex = "0";
camPanel.appendChild(svg);

// ---------- Lock button ----------
let locked = false;
const lockBtn = document.createElement("button");
lockBtn.innerText = "LOCK";
lockBtn.style.position = "absolute";
lockBtn.style.top = "5px";
lockBtn.style.right = "5px";
lockBtn.style.zIndex = "100";
lockBtn.style.cursor = "pointer";
lockBtn.style.padding = "2px 5px";
lockBtn.style.fontSize = "10px";
lockBtn.style.backgroundColor = "black";
lockBtn.style.color = "lime";
lockBtn.style.border = "1px solid lime";
camPanel.appendChild(lockBtn);

lockBtn.addEventListener("click",()=>{
  locked = !locked;
  lockBtn.innerText = locked ? "LOCKED" : "LOCK";
});

// ---------- Cameras ----------
const cams = ["cam1","cam2","cam3","cam4","cam5","cam6","cam7","cam8","cam9","cam10"];
let cachedNodes = null;

// ---------- Random cam positions ----------
function generatePositions() {
  const nodes = [];
  cams.forEach(cam => {
    let x,y,tries=0;
    do {
      x = Math.floor(Math.random() * (PANEL_SIZE-BUTTON_SIZE)/GRID_SIZE)*GRID_SIZE + Math.random()*10;
      y = Math.floor(Math.random() * (PANEL_SIZE-BUTTON_SIZE)/GRID_SIZE)*GRID_SIZE + Math.random()*10;
      tries++;
    } while(nodes.some(n=>Math.hypot(n.x-x,n.y-y)<BUTTON_SIZE+10) && tries<300);
    nodes.push({cam,x,y,connections:[]});
  });
  return nodes;
}

// ---------- Connect nodes ----------
function connectNodes(nodes) {
  const drawn = new Set();
  // Ring for closed shape
  for(let i=0;i<nodes.length;i++){
    const a=nodes[i], b=nodes[(i+1)%nodes.length];
    a.connections.push(b);
    b.connections.push(a);
    drawn.add([a.cam,b.cam].sort().join("-"));
  }
  // Extra connections
  nodes.forEach(node=>{
    while(node.connections.length<2){
      const target=nodes[Math.floor(Math.random()*nodes.length)];
      const key=[node.cam,target.cam].sort().join("-");
      if(target!==node && !node.connections.includes(target) && !drawn.has(key)){
        node.connections.push(target);
        target.connections.push(node);
        drawn.add(key);
      }
    }
  });
  return drawn;
}

// ---------- Draw non-crossing Manhattan lines ----------
function drawManhattanNoCross(a,b,usedH,usedV){
  const x1 = Math.round(a.x+BUTTON_SIZE/2);
  const y1 = Math.round(a.y+BUTTON_SIZE/2);
  const x2 = Math.round(b.x+BUTTON_SIZE/2);
  const y2 = Math.round(b.y+BUTTON_SIZE/2);

  const points=[{x:x1,y:y1}];

  const verticalFirst = Math.random()<0.5;
  let offset = GRID_SIZE/2; // spacing for parallel lines

  if(verticalFirst){
    // vertical then horizontal
    let midY = y2;
    let vKey = `V:${x1}-${Math.min(y1,midY)}-${Math.max(y1,midY)}`;
    if(usedV.has(vKey)) points.push({x:x1+offset,y:y1}); // small offset to avoid crossing
    usedV.add(vKey);
    points.push({x:x1,y:midY});

    let hKey = `H:${Math.min(x1,x2)}-${y2}-${Math.max(x1,x2)}`;
    if(usedH.has(hKey)) points.push({x:x1,y:y2+offset});
    usedH.add(hKey);
    points.push({x:x2,y:y2});

  } else {
    // horizontal then vertical
    let midX = x2;
    let hKey = `H:${Math.min(x1,midX)}-${y1}-${Math.max(x1,midX)}`;
    if(usedH.has(hKey)) points.push({x:x1,y:y1+offset});
    usedH.add(hKey);
    points.push({x:midX,y:y1});

    let vKey = `V:${x2}-${Math.min(y1,y2)}-${Math.max(y1,y2)}`;
    if(usedV.has(vKey)) points.push({x:x2+offset,y:y1});
    usedV.add(vKey);
    points.push({x:x2,y:y2});
  }

  // Draw lines
  for(let i=0;i<points.length-1;i++){
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1",points[i].x);
    line.setAttribute("y1",points[i].y);
    line.setAttribute("x2",points[i+1].x);
    line.setAttribute("y2",points[i+1].y);
    line.setAttribute("stroke","gray");
    line.setAttribute("stroke-width","2");
    svg.appendChild(line);
  }
}

// ---------- Create cams and network ----------
function createCamButtons(){
  camPanel.innerHTML="";
  camPanel.appendChild(svg);
  svg.innerHTML="";
  camPanel.appendChild(lockBtn);

  let nodes = locked && cachedNodes ? cachedNodes : generatePositions();
  if(!locked) cachedNodes = nodes;

  const drawn = connectNodes(nodes);
  const usedH = new Set();
  const usedV = new Set();

  nodes.forEach(node=>{
    node.connections.forEach(target=>{
      const key=[node.cam,target.cam].sort().join("-");
      if(!drawn.has(key)) return;
      drawManhattanNoCross(node,target,usedH,usedV);
      drawn.delete(key);
    });
  });

  nodes.forEach(node=>{
    const btn = document.createElement("div");
    btn.innerText=node.cam.toUpperCase();
    btn.style.position="absolute";
    btn.style.left=node.x+"px";
    btn.style.top=node.y+"px";
    btn.style.width=BUTTON_SIZE+"px";
    btn.style.height=BUTTON_SIZE+"px";
    btn.style.backgroundColor="black";
    btn.style.border="1px solid gray";
    btn.style.color="gray";
    btn.style.display="flex";
    btn.style.justifyContent="center";
    btn.style.alignItems="center";
    btn.style.fontSize="9px";
    btn.style.cursor="pointer";
    btn.style.zIndex="2";

    btn.addEventListener("mouseenter",()=>{btn.style.border="1px solid lime"; btn.style.color="lime";});
    btn.addEventListener("mouseleave",()=>{btn.style.border="1px solid gray"; btn.style.color="gray";});
    btn.addEventListener("click",()=>{
      chrome.storage.local.get(node.cam,({[node.cam]:url})=>{
        if(!url) return alert(`Set URL for ${node.cam}`);
        chrome.runtime.sendMessage({action:"switchTab",url});
      });
    });
    btn.addEventListener("contextmenu",e=>{
      e.preventDefault();
      const newUrl = prompt(`Enter new URL for ${node.cam.toUpperCase()}`);
      if(newUrl) chrome.storage.local.set({[node.cam]:newUrl},()=>alert(`${node.cam.toUpperCase()} URL updated!`));
    });

    camPanel.appendChild(btn);
    node.element=btn;
  });
}

// ---------- Toggle panel ----------
let panelVisible = false;
toggleBtn.addEventListener("click",()=>{
  if(!panelVisible){
    createCamButtons();
    camPanel.style.display="block";
  } else {
    camPanel.style.display="none";
  }
  panelVisible=!panelVisible;
});

// ---------- Default URLs ----------
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
