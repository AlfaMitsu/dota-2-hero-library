/* Avoid destroying sliders on every oninput rerender, while preserving existing handlers. */
(()=>{"use strict";let busy=false;
function adjust(){
 for(const slider of document.querySelectorAll(".p2-level-range")){
  if(slider.dataset.phase2Fixed)return;
  slider.dataset.phase2Fixed="1";
  if(typeof slider.oninput==="function"){slider.onchange=slider.oninput;slider.oninput=null}
 }
}
function queue(){if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;adjust()})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",queue,{once:true});else queue();
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
})();