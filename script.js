document.addEventListener("DOMContentLoaded",()=>{

let allPlayersData=[];
let currentMode="overall";
let modalCloseTimer=null;
let searchDebounceTimer=null;

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

const TIER_POINTS = {
HT1:60,
LT1:45,
HT2:30,
LT2:20,
HT3:10,
LT3:6,
HT4:4,
LT4:3,
HT5:2,
LT5:1
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

const VALID_MODES = new Set(["overall",...ALL_GAMEMODES]);

function getSkinSourceCandidates(username,retryToken=""){
const safeUsername=encodeURIComponent(username);
const retrySuffix=retryToken ? `?retry=${encodeURIComponent(retryToken)}` : "";

return [
`https://render.crafty.gg/3d/bust/${safeUsername}${retrySuffix}`,
`https://mc-heads.net/body/${safeUsername}/right`,
`https://crafatar.com/renders/body/${safeUsername}?overlay`
];
}

function createInitialFallbackDataUri(username){
const initial=(username || "?").trim().charAt(0).toUpperCase() || "?";
const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
<defs>
<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
<stop offset='0%' stop-color='%23172a45'/>
<stop offset='100%' stop-color='%230e1c33'/>
</linearGradient>
</defs>
<rect width='96' height='96' rx='12' fill='url(%23bg)'/>
<text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='%23dbe8ff' font-family='Inter,Arial,sans-serif' font-size='44' font-weight='700'>${initial}</text>
</svg>`;

return `data:image/svg+xml;utf8,${svg}`;
}

function setSkinImageWithFallback(img,username,{variant="head"}={}){
if(!img) return;

if(!username){
img.onerror=null;
img.onload=null;
img.classList.add("skin-fallback");
img.src=createInitialFallbackDataUri("?");
return;
}

const requestId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
let sourceIndex=0;

img.dataset.skinRequestId=requestId;
img.classList.remove("skin-fallback");
img.decoding="async";
img.loading="lazy";

const loadNextSource=()=>{
if(img.dataset.skinRequestId!==requestId) return;
const retryToken=sourceIndex===0 ? "" : `${requestId}-${sourceIndex}`;
const sourceCandidates=getSkinSourceCandidates(username,retryToken);
const source=sourceCandidates[sourceIndex];

if(!source){
img.onerror=null;
img.onload=null;
img.classList.add("skin-fallback");
img.src=createInitialFallbackDataUri(username);
return;
}

img.src=source;
};

img.onload=()=>{
if(img.dataset.skinRequestId!==requestId) return;
img.classList.remove("skin-fallback");
};

img.onerror=()=>{
if(img.dataset.skinRequestId!==requestId) return;

sourceIndex+=1;
loadNextSource();
};

loadNextSource();
}

function normalizePath(path){
if(!path) return "/";

const normalized=path.replace(/\/+$/,"" );
return normalized || "/";
}

function getRankingsBasePath(pathname=window.location.pathname){
const normalized=normalizePath(pathname);
const rankingsIndex=normalized.indexOf("/rankings");

if(rankingsIndex===-1) return "";

return normalized.slice(0,rankingsIndex);
}

function getModeFromPath(pathname=window.location.pathname){
const normalized=normalizePath(pathname);
const segments=normalized.split("/").filter(Boolean);
const rankingsIndex=segments.indexOf("rankings");

if(rankingsIndex===-1) return "overall";

const requestedMode=segments[rankingsIndex+1] || "overall";
return VALID_MODES.has(requestedMode) ? requestedMode : "overall";
}

function buildPathForMode(mode){
const basePath=normalizePath(getRankingsBasePath());
const rankingsPath=basePath==="/" ? "/rankings" : `${basePath}/rankings`;

if(mode==="overall") return rankingsPath;

return `${rankingsPath}/${mode}`;
}

function syncModeInUrl(mode,{replace=false}={}){
const nextPath=buildPathForMode(mode);
const currentPath=window.location.pathname || "/";
const normalizedCurrentPath=normalizePath(currentPath);

if(currentPath===nextPath) return;
if(normalizedCurrentPath===nextPath && !currentPath.endsWith("/")) return;

const nextState={mode};
if(replace){
history.replaceState(nextState,"",nextPath);
return;
}

history.pushState(nextState,"",nextPath);
}

function setActiveModeButton(mode){
const modeButtons=document.querySelectorAll(".mode");

modeButtons.forEach(btn=>{
btn.classList.toggle("active",btn.dataset.mode===mode);
});
}

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

function getTierTooltipData(tier){
const normalizedTier=(tier || "-").toUpperCase().trim();

if(normalizedTier==="-" || !(normalizedTier in TIER_POINTS)){
return {
label:"Untested",
pointsText:"No points"
};
}

return {
label:normalizedTier,
pointsText:`${TIER_POINTS[normalizedTier]} points`
};
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
const tooltipData=getTierTooltipData(tier);

tiersHTML+=`
<div class="tier-circle" tabindex="0" role="img" aria-label="${tooltipData.label}: ${tooltipData.pointsText}">
<div class="tier-bubble" style="opacity:${opacity}">
<img src="${icon}">
</div>
<div class="tier-label">${tier}</div>
<div class="tier-tooltip" aria-hidden="true">
<span class="tier-tooltip-name">${tooltipData.label}</span>
<span class="tier-tooltip-points">${tooltipData.pointsText}</span>
</div>
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

<div class="rank-cell">
<div class="rank-bar">
<div class="rank">${index+1}.</div>
</div>
</div>

<div class="info">
<div class="skin-wrap">
<img class="skin" alt="${player.mc_username} skin">
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

const skinImages=row.querySelectorAll(".skin");
skinImages.forEach(img=>setSkinImageWithFallback(img,player.mc_username,{variant:"bust"}));

});

attachGoldParticles(container);
applySearchFilter();
}

function renderLeaderboardLoadingSkeleton(count=6){
const container=document.getElementById("leaderboard");
if(!container) return;

const skeletonRows=Array.from({length:count},()=>'<div class="leaderboard-skeleton-row" aria-hidden="true"></div>').join("");
container.innerHTML=`<div class="leaderboard-loading" aria-live="polite" aria-busy="true">${skeletonRows}</div>`;
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
<img class="tier-player-skin" alt="${player.mc_username}">
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

const tierPlayerSkin=card.querySelector(".tier-player-skin");
setSkinImageWithFallback(tierPlayerSkin,player.mc_username,{variant:"bust"});
});
}

tierMenu.appendChild(tierColumn);
});

container.appendChild(tierMenu);
applySearchFilter();
}

function applyModeFilter(mode,{syncUrl=true,fromButton=false}={}){
currentMode=mode;
setActiveModeButton(mode);

if(fromButton){
const selectedButton=document.querySelector(`.mode[data-mode="${mode}"]`);
animateModeSelection(selectedButton);
selectedButton?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
}

if(syncUrl){
syncModeInUrl(mode);
}

showLeaderboardUpdateState();
renderLeaderboardLoadingSkeleton(5);

setTimeout(()=>{
if(mode==="overall"){
renderLeaderboard([...allPlayersData]);
hideLeaderboardUpdateState();
return;
}

const players=allPlayersData.filter(player=>getTierForMode(player,mode));
renderTierMenu(players,mode);
hideLeaderboardUpdateState();
},170);
}


function setupMobileMenu(){
const toggle=document.getElementById("mobileMenuToggle");
const drawer=document.getElementById("mobileNav");
const backdrop=document.getElementById("mobileNavBackdrop");
const closeBtn=document.getElementById("mobileNavClose");

if(!toggle || !drawer || !backdrop) return;

const closeMenu=()=>{
 drawer.classList.remove("is-open");
 drawer.setAttribute("aria-hidden","true");
 toggle.setAttribute("aria-expanded","false");
 backdrop.hidden=true;
 document.body.classList.remove("mobile-menu-open");
};

const openMenu=()=>{
 drawer.classList.add("is-open");
 drawer.setAttribute("aria-hidden","false");
 toggle.setAttribute("aria-expanded","true");
 backdrop.hidden=false;
 document.body.classList.add("mobile-menu-open");
};

toggle.addEventListener("click",()=>{
 const isOpen=drawer.classList.contains("is-open");
 if(isOpen){
   closeMenu();
   return;
 }
 openMenu();
});

closeBtn?.addEventListener("click",closeMenu);
backdrop.addEventListener("click",closeMenu);
drawer.querySelectorAll("a").forEach(link=>link.addEventListener("click",closeMenu));

document.addEventListener("keydown",(event)=>{
 if(event.key==="Escape"){
   closeMenu();
 }
});
}

function setupInfoPanel(){
const infoToggle=document.getElementById("infoToggle");
const infoPanel=document.getElementById("infoPanel");

if(!infoToggle || !infoPanel) return;

infoToggle.addEventListener("click",(event)=>{
const willOpen=!infoPanel.classList.contains("is-open");
infoPanel.classList.toggle("is-open",willOpen);
infoToggle.setAttribute("aria-expanded",String(willOpen));
event.stopPropagation();
});

infoPanel.addEventListener("click",(event)=>{
event.stopPropagation();
});

document.addEventListener("click",()=>{
if(!infoPanel.classList.contains("is-open")) return;
infoPanel.classList.remove("is-open");
infoToggle.setAttribute("aria-expanded","false");
});
}

function showPageLoader(){
const loader=document.getElementById("pageLoader");
if(!loader) return;
loader.classList.remove("hidden");
}

function hidePageLoader(){
const loader=document.getElementById("pageLoader");
if(!loader) return;
loader.classList.add("hidden");
}

function animateModeSelection(button){
if(!button) return;
button.classList.remove("is-switching");
void button.offsetWidth;
button.classList.add("is-switching");
}

function showLeaderboardUpdateState(){
const board=document.getElementById("leaderboard");
if(!board) return;
board.classList.add("is-updating");
}

function hideLeaderboardUpdateState(){
const board=document.getElementById("leaderboard");
if(!board) return;
board.classList.remove("is-updating");
}

function showSearchLoading(){
const searchResults=document.getElementById("searchResults");
if(!searchResults) return;

searchResults.innerHTML=`
<div class="search-loading" role="status" aria-live="polite">
<span class="loader-spinner" aria-hidden="true"></span>
<span>Searching players...</span>
</div>`;
}

function hideSearchLoading(){
const searchResults=document.getElementById("searchResults");
if(!searchResults) return;
searchResults.innerHTML="";
}

function showModalLoading(){
const modalCard=document.querySelector("#playerModal .modal-card");
if(!modalCard) return;
modalCard.classList.add("loading");
}

function hideModalLoading(){
const modalCard=document.querySelector("#playerModal .modal-card");
if(!modalCard) return;
modalCard.classList.remove("loading");
}

function closeModalWithAnimation(){
const modal=document.getElementById("playerModal");
if(!modal || modal.classList.contains("hidden")) return;

modal.classList.add("is-closing");
modal.classList.remove("is-visible");

clearTimeout(modalCloseTimer);
modalCloseTimer=setTimeout(()=>{
modal.classList.add("hidden");
modal.classList.remove("is-closing");
},200);
}

/* ===============================
   LOAD PLAYERS
================================ */

function loadPlayers(){
fetch("/player_points.json")
.then(r=>r.json())
.then(data=>{
allPlayersData=getSortedPlayers(data);
applyModeFilter(currentMode,{syncUrl:false});
})
.finally(()=>{
hidePageLoader();
});
}

currentMode=getModeFromPath();
setActiveModeButton(currentMode);
syncModeInUrl(currentMode,{replace:true});

setupInfoPanel();
setupMobileMenu();
showPageLoader();
loadPlayers();
setInterval(loadPlayers,60000);

/* ===============================
   OPEN PLAYER MODAL
================================ */

function openPlayerModal(player){

const modal=document.getElementById("playerModal");

modal.classList.remove("hidden");
showModalLoading();
modal.classList.remove("is-closing");
requestAnimationFrame(()=>{
modal.classList.add("is-visible");
});

document.getElementById("modal-name").textContent=
player.mc_username;

document.getElementById("modal-region").textContent=
player.region;

setSkinImageWithFallback(document.getElementById("modal-skin"),player.mc_username,{variant:"bust"});

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

setTimeout(hideModalLoading,160);

}

/* ===============================
   CLOSE MODAL
================================ */

document.getElementById("closeModal")
.addEventListener("click",()=>{
closeModalWithAnimation();
});

document.getElementById("playerModal")
.addEventListener("click",(e)=>{
if(e.target.id==="playerModal"){
closeModalWithAnimation();
}
});

/* ===============================
   GAMEMODE FILTER TABS
================================ */

const modeButtons=document.querySelectorAll(".mode");
modeButtons.forEach(btn=>{
btn.addEventListener("click",()=>{
applyModeFilter(btn.dataset.mode,{fromButton:true});
});
});

window.addEventListener("popstate",()=>{
const modeFromPath=getModeFromPath();
if(modeFromPath===currentMode) return;

applyModeFilter(modeFromPath,{syncUrl:false});
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

hideSearchLoading();
}

if(searchInput){
searchInput.addEventListener("input",()=>{
showSearchLoading();
clearTimeout(searchDebounceTimer);
searchDebounceTimer=setTimeout(applySearchFilter,150);
});
}

document.addEventListener("keydown",(event)=>{
const isSlashKey=event.key==="/";
const focusedTag=document.activeElement?.tagName;
const isTypingField=focusedTag==="INPUT" || focusedTag==="TEXTAREA" || document.activeElement?.isContentEditable;

if(!isSlashKey || isTypingField || !searchInput) return;

event.preventDefault();
searchInput.focus();
searchInput.select();
});

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
