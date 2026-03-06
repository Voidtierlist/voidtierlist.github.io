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

const COMBAT_RANKS = [
{ minPoints: 400, title: "Combat Grandmaster", icon: "https://mctiers.com/titles/combat_grandmaster.webp" },
{ minPoints: 250, title: "Combat Master", icon: "https://mctiers.com/titles/combat_master.webp" },
{ minPoints: 100, title: "Combat Ace", icon: "https://mctiers.com/titles/combat_ace.svg" },
{ minPoints: 50, title: "Combat Specialist", icon: "https://mctiers.com/titles/combat_specialist.svg" },
{ minPoints: 20, title: "Combat Cadet", icon: "https://mctiers.com/titles/combat_cadet.svg" },
{ minPoints: 10, title: "Combat Novice", icon: "https://mctiers.com/titles/combat_novice.svg" },
{ minPoints: 0, title: "Rookie", icon: "https://mctiers.com/titles/rookie.svg" }
];

const COMBAT_RANK_THEMES = {
"Combat Grandmaster":"gold",
"Combat Master":"yellow",
"Combat Ace":"red",
"Combat Specialist":"purple",
"Combat Cadet":"blue",
"Combat Novice":"indigo",
"Rookie":"gray"
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

function getCombatRank(points){
return COMBAT_RANKS.find(rank=>points>=rank.minPoints) || COMBAT_RANKS[COMBAT_RANKS.length-1];
}

function isGoldParticleRank(title){
return title==="Combat Grandmaster" || title==="Combat Master";
}

function getRankLogoClass(title){
return isGoldParticleRank(title) ? "combat-rank-logo gold-particle-source" : "combat-rank-logo";
}

function createCombatRankHTML(player){
const rank=getCombatRank(player.total_points || 0);
const logoClass=getRankLogoClass(rank.title);

return `
<p class="combat-rank-line">
<span class="${logoClass}">
<img class="combat-rank-icon" src="${rank.icon}" alt="${rank.title} icon">
</span>
<span>${rank.title} (${player.total_points} Points)</span>
</p>`;
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
const placementClass=index===0?"top-1":index===1?"top-2":index===2?"top-3":"normal-rank";
row.className=`player ${placementClass}`;
row.dataset.username=player.mc_username.toLowerCase();

const statusHTML=hasAnyGamemode(player)
? createCombatRankHTML(player)
: `<p class="not-tested">Not Tested</p>`;

row.innerHTML=`

<div class="rank">${index+1}.</div>

<div class="info">
<div class="skin-wrap">
<img class="skin skin-shadow" src="https://render.crafty.gg/3d/bust/${player.mc_username}" aria-hidden="true">
<img class="skin" src="https://render.crafty.gg/3d/bust/${player.mc_username}" alt="${player.mc_username} skin">
</div>

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

attachGoldParticles(container);
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
const card=document.createElement("article");
card.className="tier-player-card";
card.dataset.username=player.mc_username.toLowerCase();

card.innerHTML=`
<div class="tier-player-main">
<img class="tier-player-skin" src="https://render.crafty.gg/3d/bust/${player.mc_username}" alt="${player.mc_username}">
<div class="tier-player-meta">
<h4>${player.mc_username}</h4>
</div>
</div>
<div class="tier-region-wrap">
<div class="tier-region-label">REGION</div>
<div class="region tier-region region-${player.region}">${player.region}</div>
</div>
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

const rank=getCombatRank(player.total_points || 0);
const rankTheme=COMBAT_RANK_THEMES[rank.title] || "gray";

const modalCombatRank=document.getElementById("modal-combat-rank");
const modalCombatRankIcon=document.getElementById("modal-combat-rank-icon");
const modalCombatRankTitle=document.getElementById("modal-combat-rank-title");
const modalCombatRankLogo=document.getElementById("modal-combat-rank-logo");

if(hasAnyGamemode(player)){
modalCombatRank.className=`modal-combat-rank rank-theme-${rankTheme}`;
modalCombatRankIcon.src=rank.icon;
modalCombatRankIcon.alt=`${rank.title} icon`;
modalCombatRankTitle.textContent=rank.title;
if(isGoldParticleRank(rank.title)){
modalCombatRankLogo.classList.add("gold-particle-source");
attachGoldParticles(modalCombatRank);
}else{
modalCombatRankLogo.classList.remove("gold-particle-source");
modalCombatRankLogo.dataset.particlesAttached="";
modalCombatRankLogo.querySelectorAll(".gold-particle").forEach(node=>node.remove());
}
}else{
modalCombatRank.className="modal-combat-rank hidden";
}

const topPositionClass=pos===1?"top-1":pos===2?"top-2":pos===3?"top-3":"";

document.getElementById("modal-position").innerHTML=`
<span class="modal-position-rank ${topPositionClass}">${pos}.</span>
<span class="modal-position-overall"><img class="modal-overall-icon" src="https://mctiers.com/tier_icons/overall.svg" alt="Overall icon">OVERALL</span>
<span class="modal-position-points">(${player.total_points} points)</span>`;

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

function attachGoldParticles(scope=document){
const sources=scope.querySelectorAll(".gold-particle-source");

sources.forEach(source=>{
if(source.dataset.particlesAttached==="true") return;

source.dataset.particlesAttached="true";

for(let i=0;i<12;i++){
const particle=document.createElement("span");
particle.className="gold-particle";
particle.style.setProperty("--particle-delay",`${Math.random()*1.6}s`);
particle.style.setProperty("--particle-duration",`${1.2+Math.random()*1.4}s`);
particle.style.setProperty("--particle-x",`${-14+Math.random()*28}px`);
particle.style.setProperty("--particle-scale",`${0.45+Math.random()*0.9}`);
source.appendChild(particle);
}
});
}

});
