// ---------- Toggle Button ----------
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
const GRID_SIZE = 20;
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

const svgNS = "http://www.w3.org/2000/svg";
const svg = document.createElementNS(svgNS,"svg");
svg.setAttribute("width",PANEL_SIZE);
svg.setAttribute("height",PANEL_SIZE);
svg.style.position = "absolute";
svg.style.top = "0";
svg.style.left = "0";
svg.style.zIndex = "0";
camPanel.appendChild(svg);

// ---------- Lock Button ----------
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
let cachedConnections = null;

// ---------- Grid helpers ----------
function gridRound(val){ return Math.floor(val/GRID_SIZE)*GRID_SIZE; }

// ---------- Generate Random Nodes ----------
function generatePositions(){
    if(locked && cachedNodes) return cachedNodes;
    const nodes = [];
    cams.forEach(cam=>{
        let x,y,tries=0;
        do{
            x = Math.floor(Math.random()*(PANEL_SIZE-BUTTON_SIZE)/GRID_SIZE)*GRID_SIZE + Math.random()*10;
            y = Math.floor(Math.random()*(PANEL_SIZE-BUTTON_SIZE)/GRID_SIZE)*GRID_SIZE + Math.random()*10;
            tries++;
        } while(nodes.some(n=>Math.hypot(n.x-x,n.y-y)<BUTTON_SIZE+10) && tries<300);
        nodes.push({cam,x,y,connections:[]});
    });
    if(!locked) cachedNodes = nodes;
    return nodes;
}

// ---------- Connect Nodes ensuring min 2 connections ----------
function connectNodes(nodes){
    const drawn = new Set();
    // Closed ring
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
    if(!locked) cachedConnections = drawn;
    return drawn;
}

// ---------- Manhattan Pathfinding ----------
function manhattanPath(a,b,occupied){
    const startX = gridRound(a.x+BUTTON_SIZE/2);
    const startY = gridRound(a.y+BUTTON_SIZE/2);
    const endX = gridRound(b.x+BUTTON_SIZE/2);
    const endY = gridRound(b.y+BUTTON_SIZE/2);
    const path = [];
    let x=startX,y=startY;
    // Horizontal first
    const dx = endX>x? GRID_SIZE: -GRID_SIZE;
    while(x !== endX){
        const keyH = `H:${Math.min(x,x+dx)}-${y}-${Math.max(x,x+dx)}`;
        if(!occupied.has(keyH)) occupied.add(keyH);
        path.push({x:x,y:y,x2:x+dx,y2:y});
        x += dx;
    }
    const dy = endY>y? GRID_SIZE: -GRID_SIZE;
    while(y !== endY){
        const keyV = `V:${x}-${Math.min(y,y+dy)}-${Math.max(y,y+dy)}`;
        if(!occupied.has(keyV)) occupied.add(keyV);
        path.push({x:x,y:y,x2:x,y2:y+dy});
        y += dy;
    }
    return path;
}

// ---------- Draw Lines ----------
function drawLines(nodes, connections){
    svg.innerHTML="";
    const occupied = new Set();
    connections.forEach(key=>{
        const [aName,bName] = key.split("-");
        const a=nodes.find(n=>n.cam===aName);
        const b=nodes.find(n=>n.cam===bName);
        const path = manhattanPath(a,b,occupied);
        path.forEach(seg=>{
            const line = document.createElementNS(svgNS,"line");
            line.setAttribute("x1",seg.x);
            line.setAttribute("y1",seg.y);
            line.setAttribute("x2",seg.x2);
            line.setAttribute("y2",seg.y2);
            line.setAttribute("stroke","gray");
            line.setAttribute("stroke-width","2");
            svg.appendChild(line);
        });
    });
}

// ---------- Create Buttons ----------
function createCamButtons(){
    camPanel.innerHTML="";
    camPanel.appendChild(svg);
    camPanel.appendChild(lockBtn);

    const nodes = generatePositions();
    const connections = connectNodes(nodes);
    drawLines(nodes,connections);

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

// ---------- Toggle Panel ----------
let panelVisible=false;
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
