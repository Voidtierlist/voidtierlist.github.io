const GAMEMODE_ICONS = {
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

function normalizeGamemode(name){
    return name.toLowerCase().replace(/[^a-z]/g,"");
}

function getTierOrderValue(tier){
    if(!tier) return Number.POSITIVE_INFINITY;

    const normalizedTier=tier.toUpperCase().trim();
    return TIER_ORDER[normalizedTier] ?? Number.POSITIVE_INFINITY;
}

function getCombatRank(points){
    return COMBAT_RANKS.find(rank=>points>=rank.minPoints) || COMBAT_RANKS[COMBAT_RANKS.length-1];
}

function isGoldParticleRank(title){
    return title==="Combat Grandmaster" || title==="Combat Master";
}

function attachGoldParticles(source){
    if(!source || source.dataset.particlesAttached==="true") return;

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
}

const params = new URLSearchParams(window.location.search);
const name = params.get("user");

fetch("player_points.json")
.then(res=>res.json())
.then(data=>{

    const player = Object.values(data)
    .find(p=>p.mc_username.toLowerCase()===name.toLowerCase());

    if(!player){
        document.body.innerHTML="<h1>Player not found</h1>";
        return;
    }

    document.getElementById("username").textContent =
        player.mc_username;

    document.getElementById("region").textContent =
        player.region || "NA";

    document.getElementById("points").textContent =
        player.total_points;

    const rank=getCombatRank(player.total_points || 0);
    const profileCombatRank=document.getElementById("profile-combat-rank");
    const profileCombatRankLogo=document.getElementById("profile-combat-rank-logo");
    const profileCombatRankIcon=document.getElementById("profile-combat-rank-icon");
    const profileCombatRankTitle=document.getElementById("profile-combat-rank-title");

    profileCombatRank.classList.remove("hidden");
    profileCombatRankIcon.src=rank.icon;
    profileCombatRankIcon.alt=`${rank.title} icon`;
    profileCombatRankTitle.textContent=rank.title;

    if(isGoldParticleRank(rank.title)){
        profileCombatRankLogo.classList.add("gold-particle-source");
        attachGoldParticles(profileCombatRankLogo);
    }

    document.getElementById("skin").src =
        `https://render.crafty.gg/3d/bust/${player.mc_username}`;

    const gmDiv=document.getElementById("gamemodes");
    gmDiv.innerHTML="";

    const sortedGamemodes=Object.entries(player.gamemodes)
    .map(([gm,gmData])=>({
        gm,
        gmData,
        key:normalizeGamemode(gm),
        tierOrder:getTierOrderValue(gmData?.tier)
    }))
    .filter(({key,gmData})=>GAMEMODE_ICONS[key] && gmData?.tier)
    .sort((a,b)=>{
        const tierOrderDelta=a.tierOrder-b.tierOrder;
        if(tierOrderDelta!==0) return tierOrderDelta;

        return a.key.localeCompare(b.key);
    });

    sortedGamemodes.forEach(({gmData,key})=>{

        const icon=GAMEMODE_ICONS[key];

        const card=document.createElement("div");
        card.className="tier-card";

        card.innerHTML=`
            <img class="tier-icon" src="${icon}">
            <span class="tier-rank">${gmData.tier}</span>
        `;



        gmDiv.appendChild(card);
    });

});
