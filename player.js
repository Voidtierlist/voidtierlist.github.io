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

function normalizeGamemode(name){
    return name.toLowerCase().replace(/[^a-z]/g,"");
}

function getTierOrderValue(tier){
    if(!tier) return Number.POSITIVE_INFINITY;

    const normalizedTier=tier.toUpperCase().trim();
    return TIER_ORDER[normalizedTier] ?? Number.POSITIVE_INFINITY;
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
