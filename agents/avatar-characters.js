/* P81 original cartoon character collection. Local vector art, no external image hosts. */
export const bonusCharacters={
 bottleBandit:{label:"Bottle Bandit",colors:["#2b435a","#edc38c"],kind:"bandit"},
 wipeWarrior:{label:"Wipe Warrior",colors:["#5e343f","#e6b8a4"],kind:"ninja"},
 milkMachine:{label:"The Milk Machine",colors:["#50718d","#cde8ef"],kind:"robot"},
 diaperDragon:{label:"Diaper Dragon",colors:["#a83e36","#f6bb6a"],kind:"dragon"},
 snackasaurus:{label:"Snackasaurus",colors:["#866044","#e8be79"],kind:"dino"},
 napNinja:{label:"Nap Ninja",colors:["#343a65","#a4a3d6"],kind:"ninja"},
 fartKnight:{label:"Fart Knight",colors:["#657484","#d5dce1"],kind:"knight"},
 spillZilla:{label:"Spill Zilla",colors:["#537a82","#a5d6cd"],kind:"dino"},
 pacifierPirate:{label:"Pacifier Pirate",colors:["#30465a","#e5b782"],kind:"pirate"},
 cribCruiser:{label:"Crib Cruiser",colors:["#b33f43","#f4caa7"],kind:"racer"},
 burpBoss:{label:"Burp Boss",colors:["#563d7e","#c9b2eb"],kind:"boss"},
 mamasBoy:{label:"Mama's Boy",colors:["#b65785","#f6c6da"],kind:"heart"},
 dadasDude:{label:"Dada's Dude",colors:["#697a4c","#dfd5a1"],kind:"trooper"},
 littleLegend:{label:"Little Legend",colors:["#3f4655","#e3bfa0"],kind:"aviator"},
 foodFighter:{label:"Food Fighter",colors:["#ad5734","#f5b77c"],kind:"food"},
 pancakePower:{label:"Pancake Power",colors:["#b17b34","#f8d69b"],kind:"pancake"},
 bananaBrawler:{label:"Banana Brawler",colors:["#b89a31","#ffe98c"],kind:"banana"},
 pizzaParty:{label:"Pizza Party",colors:["#a95738","#ffd2a0"],kind:"pizza"},
 iceCreamHitman:{label:"Ice Cream Hitman",colors:["#49485d","#ead4e9"],kind:"boss"},
 toughCookie:{label:"Tough Cookie",colors:["#95613d","#edc595"],kind:"cookie"},
 tacoTerror:{label:"Taco Terror",colors:["#a46c35","#f5d184"],kind:"taco"},
 astroBaby:{label:"Astro Baby",colors:["#5067a3","#dce8ff"],kind:"astronaut"},
 alienLuca:{label:"Alien Luca",colors:["#518d5c","#bce5a0"],kind:"alien"},
 sharkBite:{label:"Shark Bite",colors:["#416987","#d6e4ed"],kind:"shark"},
 monsterMash:{label:"Monster Mash",colors:["#654ba3","#c3a3ec"],kind:"monster"},
 zombieBaby:{label:"Zombie Baby",colors:["#65866a","#b8d4a1"],kind:"zombie"},
 ghosty:{label:"Ghosty",colors:["#7188a4","#e9f0ff"],kind:"ghost"},
 pumpkinKing:{label:"Pumpkin King",colors:["#c16d31","#f8c88c"],kind:"pumpkin"},
 santaLuca:{label:"Santa Luca",colors:["#b44748","#f5c6b3"],kind:"santa"},
 reindeerDude:{label:"Reindeer Dude",colors:["#80634b","#e3c59f"],kind:"reindeer"},
 snowMonster:{label:"Snow Monster",colors:["#739eb4","#e3f5fb"],kind:"snow"},
 turkeyTerror:{label:"Turkey Terror",colors:["#98603b","#f4c69a"],kind:"turkey"},
 leprechaunLuca:{label:"Leprechaun Luca",colors:["#39744c","#c2e0a4"],kind:"leprechaun"},
 bunnyBusiness:{label:"Bunny Business",colors:["#ba7b9c","#f6d6e8"],kind:"bunny"},
 firecracker:{label:"Firecracker",colors:["#bd4c51","#f9d3a0"],kind:"firework"},
};
export function bonusAvatarSvg(key){
 const c=bonusCharacters[key];if(!c)return "";
 const [dark,light]=c.colors,k=c.kind;
 const bg='<circle cx="50" cy="50" r="49" fill="'+dark+'"/><circle cx="50" cy="50" r="44" fill="none" stroke="'+light+'" opacity=".45" stroke-width="2"/>';
 const stars='<path d="M14 20l3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1zM87 65l2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1z" fill="#ffe69c" opacity=".75"/>';
 const face='<ellipse cx="50" cy="59" rx="32" ry="33" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
 const ears=k==="bunny"||k==="reindeer"||k==="monster"?'<ellipse cx="27" cy="24" rx="9" ry="23" fill="'+light+'" transform="rotate(-15 27 24)"/><ellipse cx="73" cy="24" rx="9" ry="23" fill="'+light+'" transform="rotate(15 73 24)"/>':"";
 const eyes=k==="ninja"||k==="bandit"||k==="boss"||k==="aviator"||k==="racer"||k==="trooper"||k==="pirate"?'<rect x="23" y="47" width="54" height="15" rx="7" fill="#202c36"/><path d="M29 50l13 2m17 0 13-2" stroke="#a6d8ec" stroke-width="3" opacity=".85"/>':k==="zombie"?'<circle cx="35" cy="54" r="7" fill="#f9f9f9"/><circle cx="65" cy="54" r="7" fill="#f9f9f9"/><circle cx="36" cy="54" r="3" fill="#3a3640"/><circle cx="65" cy="55" r="3" fill="#3a3640"/>':k==="snow"||k==="ghost"?'<circle cx="35" cy="55" r="5" fill="#3b5266"/><circle cx="65" cy="55" r="5" fill="#3b5266"/>':'<circle cx="35" cy="54" r="5" fill="#253242"/><circle cx="65" cy="54" r="5" fill="#253242"/>';
 const smile=k==="zombie"||k==="monster"||k==="shark"||k==="dragon"||k==="dino"?'<path d="M34 71q16 21 32 0z" fill="#473443" stroke="#473443" stroke-width="2"/><path d="M38 72l5 8 5-7 5 8 5-7 5 5" stroke="white" stroke-width="3" fill="none"/>':'<path d="M39 71q11 12 22 0" fill="none" stroke="#624449" stroke-width="3" stroke-linecap="round"/>';
 const hats={
 ninja:'<path d="M17 45q33-37 66 0v12H17z" fill="'+dark+'"/><path d="M19 45h62" stroke="#e45b5b" stroke-width="5"/>',
 bandit:'<path d="M18 42q32-39 64 0" fill="'+dark+'"/><path d="M18 42h64" stroke="#e8c28c" stroke-width="7"/>',
 robot:'<rect x="20" y="30" width="60" height="54" rx="16" fill="'+light+'" stroke="'+dark+'" stroke-width="5"/><path d="M50 29V15" stroke="#d7f6fc" stroke-width="4"/><circle cx="50" cy="13" r="5" fill="#f5ce65"/>',
 dragon:'<path d="M17 46L20 16 35 32 50 9 64 31 81 16 83 46" fill="'+dark+'" stroke="#f9b86c" stroke-width="3"/>',
 dino:'<path d="M17 46L20 16 35 32 50 9 64 31 81 16 83 46" fill="'+dark+'" stroke="#f9b86c" stroke-width="3"/>',
 knight:'<path d="M17 52V33Q50 2 83 33V52" fill="#b4c3d0" stroke="#34475c" stroke-width="5"/><path d="M50 13V40" stroke="#e6ad51" stroke-width="6"/>',
 pirate:'<path d="M12 43q38-53 76 0l-15-5H27z" fill="#252c3e"/><path d="M50 19v12m-8-7h16" stroke="white" stroke-width="3"/>',
 racer:'<path d="M13 44q37-49 74 0" fill="#cb3e3c"/><path d="M18 44h64" stroke="#fff" stroke-width="5"/>',
 boss:'<path d="M17 43q33-44 66 0" fill="#262b40"/><path d="M12 43h76" stroke="#222b35" stroke-width="6"/>',
 trooper:'<path d="M13 44q37-49 74 0" fill="#5d704e"/><path d="M13 44h74" stroke="#263c37" stroke-width="7"/>',
 aviator:'<path d="M17 45q33-45 66 0" fill="#3b4651"/><path d="M23 42h54" stroke="#c0a076" stroke-width="7"/>',
 astronaut:'<circle cx="50" cy="55" r="42" fill="none" stroke="#eaf7ff" stroke-width="8"/>',
 alien:'<path d="M22 41l-8-17m64 17 8-17" stroke="#b1f29a" stroke-width="6"/><circle cx="14" cy="24" r="6" fill="#b1f29a"/><circle cx="86" cy="24" r="6" fill="#b1f29a"/>',
 shark:'<path d="M20 45L50 6 81 45" fill="#6a98b3" stroke="#dcefff" stroke-width="3"/>',
 monster:'<path d="M18 42l-8-24 25 14 15-26 15 26 25-14-8 24" fill="#9672c9"/>',
 ghost:'<path d="M19 50q0-36 31-36t31 36v37l-11-9-10 9-10-9-10 9-10-9-11 9z" fill="#f4f7ff"/>',
 pumpkin:'<path d="M17 50q0-35 33-35t33 35" fill="#eb9b45"/><path d="M50 17v-9" stroke="#537341" stroke-width="7"/>',
 santa:'<path d="M16 43q8-40 51-35l17 35" fill="#c94b4c"/><path d="M16 43h68" stroke="#fff" stroke-width="9"/><circle cx="69" cy="11" r="9" fill="#fff"/>',
 reindeer:'<path d="M28 40L16 9m12 31L7 23m65 17L84 9m-12 31l21-17" stroke="#d5a66e" stroke-width="6" stroke-linecap="round"/>',
 snow:'<path d="M19 42q31-49 62 0" fill="#e9f7ff"/><path d="M17 42h66" stroke="#b7e4fa" stroke-width="7"/>',
 turkey:'<path d="M13 52q-12-43 18-37l19 18 19-18q30-6 18 37" fill="#bc7048" stroke="#f7a953" stroke-width="6"/>',
 leprechaun:'<rect x="27" y="14" width="46" height="27" rx="3" fill="#287d4a"/><path d="M15 41h70" stroke="#287d4a" stroke-width="10"/><rect x="44" y="29" width="12" height="10" fill="#eac45e"/>',
 bunny:'<ellipse cx="27" cy="24" rx="9" ry="23" fill="#f8dfeb"/><ellipse cx="73" cy="24" rx="9" ry="23" fill="#f8dfeb"/>',
 firework:'<path d="M50 9v20M26 16l13 15M74 16L61 31M12 37l20 7M88 37l-20 7" stroke="#f6d577" stroke-width="5" stroke-linecap="round"/>',
 pancake:'<ellipse cx="50" cy="32" rx="31" ry="12" fill="#dc9b54"/><ellipse cx="50" cy="24" rx="27" ry="10" fill="#f7d28d"/>',
 banana:'<path d="M25 42Q30 3 74 12Q54 31 50 44" fill="#f8d65d" stroke="#9d842f" stroke-width="3"/>',
 pizza:'<path d="M15 33L50 9 85 33Z" fill="#f7c46b" stroke="#ad6739" stroke-width="4"/><circle cx="43" cy="25" r="5" fill="#bb5449"/><circle cx="59" cy="29" r="5" fill="#bb5449"/>',
 cookie:'<circle cx="50" cy="29" r="26" fill="#b9804d"/><circle cx="42" cy="23" r="5" fill="#604334"/><circle cx="60" cy="34" r="5" fill="#604334"/>',
 taco:'<path d="M14 42Q50-6 86 42Z" fill="#f3c864" stroke="#b17a32" stroke-width="4"/><path d="M20 36q30-15 60 0" stroke="#5b9d4c" stroke-width="7"/>',
 food:'<path d="M22 38Q50 3 78 38" fill="#f8ab63"/><circle cx="50" cy="22" r="9" fill="#e24f3b"/>',
 heart:'<path d="M50 34C10 2 7 44 50 65C93 44 90 2 50 34Z" fill="#f38bb1"/>'
 };
 const hat=hats[k]||"";
 const accessory=k==="food"||k==="pizza"||k==="pancake"||k==="cookie"||k==="taco"||k==="banana"?'<circle cx="84" cy="82" r="11" fill="#f6b45f" stroke="#fff2c3" stroke-width="3"/>':k==="knight"?'<path d="M80 75l8-25 8 25-8 10z" fill="#b1c9d4"/>':k==="bandit"||k==="trooper"?'<rect x="78" y="72" width="12" height="21" rx="4" fill="#e7f5f5" stroke="#557b88" stroke-width="3"/>':"";
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'+bg+stars+ears+face+hat+eyes+smile+accessory+'</svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
