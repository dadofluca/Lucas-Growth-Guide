import {test,expect} from "@playwright/test";

// Spark: synthetic, read-only mobile visual inspection. Never sign in or capture family data.
for(const width of [320,390,430]){
 test(`Spark: mobile visual audit at ${width}px`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:"reduce"});
  const page=await context.newPage();
  try{
   await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
   await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
   await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
   const nav=page.locator("nav[aria-label='Main navigation']");
   await expect(nav).toBeVisible();
   const navRect=await nav.boundingBox();
   expect(navRect.x).toBeGreaterThanOrEqual(-1);
   expect(navRect.x+navRect.width).toBeLessThanOrEqual(width+1);
   await page.screenshot({path:`artifacts/spark/mobile-${width}-home.png`,fullPage:false});
   await page.locator("#navMore").click();
   await expect(page.locator("#sideMenu")).toHaveClass(/open/);
   await page.screenshot({path:`artifacts/spark/mobile-${width}-drawer.png`,fullPage:false});
   for(const selector of ["#menuInsights","#menuFamily"]){
    const row=page.locator(selector);await expect(row).toBeVisible();
    const {fg,bg,size}=await row.evaluate(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor,size:parseFloat(getComputedStyle(el).fontSize)}));
    expect(size).toBeGreaterThanOrEqual(16);
    const rgb=c=>{const v=c.match(/[0-9]+/g);return v?.slice(0,3).map(Number)};
    const luminance=c=>rgb(c).map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const a=luminance(fg),b=luminance(bg);
    expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5);
   }
  }finally{await context.close();}
 });
}
