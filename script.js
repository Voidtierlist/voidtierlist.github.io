document.addEventListener("DOMContentLoaded",()=>{

let allPlayersData=[];
let currentMode="overall";

/* ===============================
   GAMEMODE ICONS
================================ */
const ALL_GAMEMODES = [
    "smp",
    "sword",
    "crystal",
    "nethpot",
    "diamondpot",
    "uhc",
    "axe",
    "diamondsmp",
    "mace"
];
const GAMEMODE_ICONS={
smp:"https://mctiers.com/tier_icons/smp.svg",
sword:"https://mctiers.com/tier_icons/sword.svg",
crystal:"https://mctiers.com/tier_icons/vanilla.svg",
nethpot:"https://mctiers.com/tier_icons/nethop.svg",
uhc:"https://mctiers.com/tier_icons/uhc.svg",
axe:"https://mctiers.com/tier_icons/axe.svg",
mace:"https://mctiers.com/tier_icons/mace.svg",
diamondpot:"https://mctiers.com/tier_icons/pot.svg",
diamondsmp:"https://subtiers.net/assets/dia_smp-523efa38.svg"
};

const TIER_ORDER = {
HT1:0,
LT1:1,
HT2:2,
LT2:3,
HT3:4,
LT3:5,
HT4:6,
LT4:7,
HT5:8,
LT5:9
};

function normalizeGamemode(name){
return name
.toLowerCase()
.replace(/[^a-z]/g,"");
}

function getTierForMode(player,mode){
if(!player.gamemodes) return null;

for(const gm in player.gamemodes){
if(normalizeGamemode(gm)===mode){
return player.gamemodes[gm].tier;
}
}

return null;
}

function hasAnyGamemode(player){
return !!(player.gamemodes && Object.keys(player.gamemodes).length);
}

function getTierOrderValue(tier){
if(!tier) return Number.POSITIVE_INFINITY;

const normalizedTier=tier.toUpperCase().trim();
return TIER_ORDER[normalizedTier] ?? Number.POSITIVE_INFINITY;
}

function getSortedModesForPlayer(player){
const testedModes=[];
const untestedModes=[];

ALL_GAMEMODES.forEach(mode=>{
const tier=getTierForMode(player,mode);

if(tier){
testedModes.push({mode,tier});
return;
}

untestedModes.push({mode,tier:"-"});
});

testedModes.sort((a,b)=>{
const tierOrderDelta=getTierOrderValue(a.tier)-getTierOrderValue(b.tier);
if(tierOrderDelta!==0) return tierOrderDelta;

return a.mode.localeCompare(b.mode);
});

return [...testedModes,...untestedModes];
}

function createTiersHTML(player){
let tiersHTML="";

const orderedModes=getSortedModesForPlayer(player);

orderedModes.forEach(({mode,tier})=>{

const icon=GAMEMODE_ICONS[mode];
if(!icon) return;

const opacity=tier==="-" ? "0.35" : "1";

tiersHTML+=`
<div class="tier-circle">
<div class="tier-bubble" style="opacity:${opacity}">
<img src="${icon}">
</div>
<div class="tier-label">${tier}</div>
</div>`;
});

return tiersHTML;
}

function getSortedPlayers(data){
return Object.values(data)
.sort((a,b)=>b.total_points-a.total_points);
}

function renderLeaderboard(players){
const container=document.getElementById("leaderboard");
container.innerHTML="";
document.querySelector(".leaderboard-header")?.classList.remove("hidden");

players.forEach((player,index)=>{

const row=document.createElement("div");
row.className="player";
row.dataset.username=player.mc_username.toLowerCase();

const statusHTML=hasAnyGamemode(player)
? `<p>${player.total_points} Points</p>`
: `<p class="not-tested">Not Tested</p>`;

row.innerHTML=`

<div class="rank ${index===0?"top-1":index===1?"top-2":index===2?"top-3":""}">${index+1}.</div>

<div class="info">
<img class="skin"
src="https://render.crafty.gg/3d/bust/${player.mc_username}">

<div class="info-text">
<h3>${player.mc_username}</h3>
${statusHTML}
</div>
</div>

<div class="region region-${player.region}">
${player.region}
</div>

<div class="tiers">
${createTiersHTML(player)}
</div>
`;

row.onclick=()=>openPlayerModal(player);

container.appendChild(row);

});

applySearchFilter();
}

function renderTierMenu(players,mode){
const container=document.getElementById("leaderboard");
container.innerHTML="";
document.querySelector(".leaderboard-header")?.classList.add("hidden");

const tierMenu=document.createElement("div");
tierMenu.className="tier-menu-grid";

[1,2,3,4,5].forEach(tierNumber=>{
const tierColumn=document.createElement("section");
tierColumn.className=`tier-menu-column tier-${tierNumber}`;

const title=document.createElement("h3");
title.className="tier-menu-title";
title.textContent=`Tier ${tierNumber}`;
tierColumn.appendChild(title);

const playersInTier=players
.filter(player=>{
const tier=getTierForMode(player,mode);
if(!tier) return false;

const normalizedTier=tier.toUpperCase();
const isAllowedPrefix=normalizedTier.startsWith("HT") || normalizedTier.startsWith("LT");

return isAllowedPrefix && normalizedTier.endsWith(String(tierNumber));
})
.sort((a,b)=>b.total_points-a.total_points);

if(!playersInTier.length){
const empty=document.createElement("div");
empty.className="tier-empty";
empty.textContent="No players";
tierColumn.appendChild(empty);
}else{
playersInTier.forEach(player=>{
const tier=getTierForMode(player,mode);
const card=document.createElement("article");
card.className="tier-player-card";
card.dataset.username=player.mc_username.toLowerCase();

card.innerHTML=`
<div class="tier-player-main">
<img class="tier-player-skin" src="https://render.crafty.gg/3d/bust/${player.mc_username}" alt="${player.mc_username}">
<div class="tier-player-meta">
<h4>${player.mc_username}</h4>
<p>${tier} • ${player.total_points} pts</p>
</div>
</div>
<div class="region tier-region region-${player.region}">${player.region}</div>
`;

card.addEventListener("click",()=>openPlayerModal(player));
tierColumn.appendChild(card);
});
}

tierMenu.appendChild(tierColumn);
});

container.appendChild(tierMenu);
applySearchFilter();
}

function applyModeFilter(mode){
currentMode=mode;

if(mode==="overall"){
renderLeaderboard([...allPlayersData]);
return;
}

const players=allPlayersData.filter(player=>getTierForMode(player,mode));
renderTierMenu(players,mode);
}

/* ===============================
   LOAD PLAYERS
================================ */

function loadPlayers(){
fetch("player_points.json")
.then(r=>r.json())
.then(data=>{
allPlayersData=getSortedPlayers(data);
applyModeFilter(currentMode);
});
}

loadPlayers();
setInterval(loadPlayers,60000);

/* ===============================
   OPEN PLAYER MODAL
================================ */

function openPlayerModal(player){

const modal=document.getElementById("playerModal");

modal.classList.remove("hidden");

document.getElementById("modal-name").textContent=
player.mc_username;

document.getElementById("modal-region").textContent=
player.region;

document.getElementById("modal-skin").src=
`https://render.crafty.gg/3d/bust/${player.mc_username}`;

const pos=allPlayersData.findIndex(
p=>p.mc_username===player.mc_username)+1;

document.getElementById("modal-position")
.textContent=`#${pos} Overall • ${player.total_points} Points`;

const tiersHTML=createTiersHTML(player);

const modalTiers=document.getElementById("modal-tiers");
modalTiers.innerHTML=tiersHTML;

if(!hasAnyGamemode(player)){
modalTiers.insertAdjacentHTML(
"beforeend",
'<div class="not-tested-badge">Not Tested</div>'
);
}

}

/* ===============================
   CLOSE MODAL
================================ */

document.getElementById("closeModal")
.addEventListener("click",()=>{
document.getElementById("playerModal")
.classList.add("hidden");
});

document.getElementById("playerModal")
.addEventListener("click",(e)=>{
if(e.target.id==="playerModal"){
e.target.classList.add("hidden");
}
});

/* ===============================
   GAMEMODE FILTER TABS
================================ */

const modeButtons=document.querySelectorAll(".mode");
modeButtons.forEach(btn=>{
btn.addEventListener("click",()=>{
modeButtons.forEach(el=>el.classList.remove("active"));
btn.classList.add("active");
applyModeFilter(btn.dataset.mode);
});
});

/* ===============================
   SEARCH FILTER
================================ */

const searchInput=document.getElementById("searchInput");

function applySearchFilter(){
if(!searchInput) return;

const query=searchInput.value.trim().toLowerCase();
const players=document.querySelectorAll(".player, .tier-player-card");

players.forEach(player=>{
const name=player.dataset.username || "";
player.style.display=name.includes(query) ? "" : "none";
});
}

if(searchInput){
searchInput.addEventListener("input",applySearchFilter);
}

});
