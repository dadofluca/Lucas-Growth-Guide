// Display the original 42-character artwork as one shared image. Coordinates
// frame each portrait above its printed nameplate; the source stays untouched.
export const ARMORY_IMAGE=new URL("./assets/avatar-armory-original.png",import.meta.url).href;
export const ARMORY_SIZE={width:1312,height:1199};
const columns=[0,193,380,568,755,941,1128];
const rows=[88,272,454,637,819,1000];
const roster=[
 ["teddyTrooper","formulaCommando","diaperDoom","poopMeteor","diaperKing","evilDuck","sleepDeprived"],
 ["bottleBandit","wipeWarrior","milkMachine","diaperDragon","snackasaurus","napNinja","fartKnight"],
 ["spillZilla","pacifierPirate","cribCruiser","burpBoss","mamasBoy","dadasDude","littleLegend"],
 ["foodFighter","pancakePower","bananaBrawler","pizzaParty","iceCreamHitman","toughCookie","tacoTerror"],
 ["astroBaby","alienLuca","sharkBite","monsterMash","zombieBaby","ghosty","pumpkinKing"],
 ["santaLuca","reindeerDude","snowMonster","turkeyTerror","leprechaunLuca","bunnyBusiness","firecracker"]
];
const groups=[
 ["crew","crew","diapers","diapers","diapers","creatures","crew"],
 ["crew","diapers","crew","creatures","food","crew","diapers"],
 ["creatures","crew","crew","crew","crew","crew","crew"],
 Array(7).fill("food"),
 ["crew","creatures","creatures","creatures","creatures","creatures","holidays"],
 Array(7).fill("holidays")
];
export const avatarArtwork=Object.fromEntries(roster.flatMap((row,r)=>row.map((key,c)=>[
 key,{x:columns[c]+21,y:rows[r]+3,width:140,height:140,category:groups[r][c]}
])));
export const avatarCategories=[
 ["all","All"],["crew","The crew"],["diapers","Diaper duty"],
 ["food","Food fight"],["creatures","Creatures"],["holidays","Holidays"],["classics","Classics"]
];
export function avatarCategory(key){
 return avatarArtwork[key]?.category||({wipeTornado:"diapers",napEmperor:"crew",bottleSupreme:"crew"})[key]||"classics";
}
export function frameAvatarImage(image,key,fallback){
 const frame=avatarArtwork[key];
 image.alt="";image.loading="lazy";image.decoding="async";
 if(!frame){image.src=fallback;image.style.cssText="width:100%;height:100%;display:block";return;}
 image.src=ARMORY_IMAGE;
 image.style.cssText=`position:absolute;max-width:none;width:${ARMORY_SIZE.width/frame.width*100}%;height:${ARMORY_SIZE.height/frame.height*100}%;left:${-frame.x/frame.width*100}%;top:${-frame.y/frame.height*100}%;pointer-events:none`;
 image.addEventListener("error",()=>{image.style.cssText="width:100%;height:100%;display:block";image.src=fallback;},{once:true});
}
