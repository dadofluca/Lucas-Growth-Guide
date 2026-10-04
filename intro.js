(function(){
 const w=document.getElementById("bootCinematic"); if(!w)return;
 const vids=[...w.querySelectorAll("video")], skip=w.querySelector(".introSkip");
 let closed=false,timer;
 const close=()=>{if(closed)return;closed=true;clearTimeout(timer);w.classList.add("done");vids.forEach(v=>{try{v.pause()}catch(e){}});setTimeout(()=>w.remove(),650)};
 skip.addEventListener("click",close);
 vids.forEach(v=>{v.currentTime=0;const p=v.play();if(p&&p.catch)p.catch(()=>{})});
 vids[1].addEventListener("ended",close,{once:true});
 timer=setTimeout(close,11500);
})();
