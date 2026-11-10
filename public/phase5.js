/* Phase 5: graceful image fallback for missing Dota ability and innate assets.
 * Does not modify the 127 hero portraits or the original gallery layout.
 */
(()=>{"use strict";
 const missing=new Set(),known=new Set(["axe_one_man_army","rattletrap_armor_power"]);
 function nameFrom(url){try{const file=new URL(url,location.origin).pathname.split("/").pop()||"";return file.replace(/(_hp2)?\.(png|webp|jpg)$/i,"")}catch{return""}}
 function replaceMissing(img){
  if(!(img instanceof HTMLImageElement)||!img.isConnected)return;
  const src=img.currentSrc||img.src||"";
  if(!/\/abilities\//.test(src))return;
  const parent=img.closest(".p1-icon,.ability-icon-frame,.p2-ability-icon");
  if(!parent)return;
  if(parent.classList.contains("p5-missing-icon"))return;
  const id=nameFrom(src),innate=/innate|one_man_army|armor_power|prickly/i.test(id+" "+(img.closest("[title]")?.getAttribute("title")||""));
  const fallback=document.createElement("span");
  fallback.className="p5-icon-text";
  fallback.textContent=innate?"INNATE":"ABILITY";
  fallback.setAttribute("role","img");
  fallback.setAttribute("aria-label","Illustrative "+(innate?"innate":"ability")+" icon; original artwork unavailable");
  parent.classList.add("p5-missing-icon");
  parent.replaceChildren(fallback);
  missing.add(id);
 }
 document.addEventListener("error",event=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement))return;
  if(!/\/abilities\//.test(img.currentSrc||img.src))return;
  event.stopImmediatePropagation();
  replaceMissing(img);
 },true);
 let queued=false;
 function scan(){
  for(const img of document.querySelectorAll(".p1-icon img,.ability-icon-frame img,.p2-ability-icon img")){
   const src=img.getAttribute("src")||"",id=nameFrom(src);
   if(known.has(id)){replaceMissing(img)}
  }
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 Object.defineProperty(window,"dotaMissingAbilityIcons",{get:()=>Array.from(missing),configurable:false});
})();
