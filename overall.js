document.addEventListener("DOMContentLoaded",()=>{

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

function animateModeSelection(button){
if(!button) return;
button.classList.remove("is-switching");
void button.offsetWidth;
button.classList.add("is-switching");
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

const modeButtons=document.querySelectorAll(".mode");
modeButtons.forEach(btn=>{
btn.addEventListener("click",()=>{
modeButtons.forEach(button=>button.classList.remove("active"));
btn.classList.add("active");
animateModeSelection(btn);
btn.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
});
});

const searchInput=document.getElementById("searchInput");

document.addEventListener("keydown",(event)=>{
const isSlashKey=event.key==="/";
const focusedTag=document.activeElement?.tagName;
const isTypingField=focusedTag==="INPUT" || focusedTag==="TEXTAREA" || document.activeElement?.isContentEditable;

if(!isSlashKey || isTypingField || !searchInput) return;

event.preventDefault();
searchInput.focus();
searchInput.select();
});

setupInfoPanel();
setupMobileMenu();
showPageLoader();
setTimeout(hidePageLoader,300);

});
