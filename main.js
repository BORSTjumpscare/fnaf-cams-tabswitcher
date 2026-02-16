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
const GRID_SIZE = 60;
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
const MIN_LINES = 2;
const MAX_LINES = 3;
let cachedNodes = null;
let cachedConnections = null;

// ---------- Generate cam positions ----------
function generatePositions(){
    if(locked && cachedNodes) return cachedNodes;
    const nodes = [];
    const rows = 2;
    const cols = 5;
    let idx=0;
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(idx>=cams.length) break;
            const baseX = c*GRID_SIZE+10;
            const baseY = r*GRID_SIZE+10;
            const x = baseX + Math.random()*10;
            const y = baseY + Math.random()*10;
            nodes.push({cam:cams[idx], x, y, connections:[], usedSides:new Set()});
            idx++;
        }
    }
    if(!locked) cachedNodes = nodes;
    return nodes;
}

// ---------- Pick different sides ----------
function pickDifferentSides(a,b){
    const sides=["top","bottom","left","right"];
    const availA = sides.filter(s=>!a.usedSides.has(s));
    const availB = sides.filter(s=>!b.usedSides.has(s));
    let sideA, sideB;
    if(availA.includes("right") && availB.includes("left")) { sideA="right"; sideB="left"; }
    else if(availA.includes("left") && availB.includes("right")) { sideA="left"; sideB="right"; }
    else if(availA.includes("top") && availB.includes("bottom")) { sideA="top"; sideB="bottom"; }
    else if(availA.includes("bottom") && availB.includes("top")) { sideA="bottom"; sideB="top"; }
    else { sideA = availA[0] || "right"; sideB = availB[0] || "left"; }
    a.usedSides.add(sideA);
    b.usedSides.add(sideB);
    return [sideA, sideB];
}

// ---------- Connect nodes with min/max lines ----------
function connectNodes(nodes){
    const drawn = new Set();

    // First, make a ring so all nodes have at least 2
    for(let i=0;i<nodes.length;i++){
        const a=nodes[i], b=nodes[(i+1)%nodes.length];
        const [sideA, sideB] = pickDifferentSides(a,b);
        a.connections.push({target:b, side:sideA});
        b.connections.push({target:a, side:sideB});
        drawn.add([a.cam,b.cam].sort().join("-"));
    }

    // Extra connections up to MAX_LINES
    let attempts = 0;
    while(nodes.some(n=>n.connections.length<MAX_LINES) && attempts<1000){
        attempts++;
        const a=nodes[Math.floor(Math.random()*nodes.length)];
        const b=nodes[Math.floor(Math.random()*nodes.length)];
        if(a===b) continue;
        if(a.connections.length>=MAX_LINES || b.connections.length>=MAX_LINES) continue;
        const key=[a.cam,b.cam].sort().join("-");
        if(drawn.has(key)) continue;

        const [sideA, sideB]=pickDifferentSides(a,b);
        a.connections.push({target:b, side:sideA});
        b.connections.push({target:a, side:sideB});
        drawn.add(key);
    }

    if(!locked) cachedConnections = drawn;
    return drawn;
}

// ---------- Draw lines ----------
function drawLines(nodes, connections){
    svg.innerHTML="";
    connections.forEach(key=>{
        const [aName,bName] = key.split("-");
        const a=nodes.find(n=>n.cam===aName);
        const b=nodes.find(n=>n.cam===bName);

        const connA = a.connections.find(c=>c.target===b);
        const connB = b.connections.find(c=>c.target===a);

        let x1=a.x+BUTTON_SIZE/2, y1=a.y+BUTTON_SIZE/2;
        let x2=b.x+BUTTON_SIZE/2, y2=b.y+BUTTON_SIZE/2;

        if(connA.side==="top") y1=a.y;
        if(connA.side==="bottom") y1=a.y+BUTTON_SIZE;
        if(connA.side==="left") x1=a.x;
        if(connA.side==="right") x1=a.x+BUTTON_SIZE;

        if(connB.side==="top") y2=b.y;
        if(connB.side==="bottom") y2=b.y+BUTTON_SIZE;
        if(connB.side==="left") x2=b.x;
        if(connB.side==="right") x2=b.x+BUTTON_SIZE;

        // Horizontal then vertical
        const lineH=document.createElementNS(svgNS,"line");
        lineH.setAttribute("x1",x1);
        lineH.setAttribute("y1",y1);
        lineH.setAttribute("x2",x2);
        lineH.setAttribute("y2",y1);
        lineH.setAttribute("stroke","gray");
        lineH.setAttribute("stroke-width","2");
        svg.appendChild(lineH);

        const lineV=document.createElementNS(svgNS,"line");
        lineV.setAttribute("x1",x2);
        lineV.setAttribute("y1",y1);
        lineV.setAttribute("x2",x2);
        lineV.setAttribute("y2",y2);
        lineV.setAttribute("stroke","gray");
        lineV.setAttribute("stroke-width","2");
        svg.appendChild(lineV);
    });
}

// ---------- Create cam buttons ----------
function createCamButtons(){
    camPanel.innerHTML="";
    camPanel.appendChild(svg);
    camPanel.appendChild(lockBtn);

    const nodes = generatePositions();
    const connections = connectNodes(nodes);
    drawLines(nodes,connections);

    nodes.forEach(node=>{
        const btn=document.createElement("div");
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
            const newUrl=prompt(`Enter new URL for ${node.cam.toUpperCase()}`);
            if(newUrl) chrome.storage.local.set({[node.cam]:newUrl},()=>alert(`${node.cam.toUpperCase()} URL updated!`));
        });
        camPanel.appendChild(btn);
    });
}

// ---------- Toggle panel ----------
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
