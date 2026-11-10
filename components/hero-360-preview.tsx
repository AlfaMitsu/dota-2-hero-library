"use client";
import {useEffect,useRef,useState} from "react";
import {HeroViewer} from "dota-loadout";
type Status="loading"|"ready"|"unavailable";
export default function Hero360Preview({heroSlug,heroName,fallbackSrc}:{heroSlug:string;heroName:string;fallbackSrc:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const viewer=useRef<HeroViewer|null>(null);
 const [status,setStatus]=useState<Status>("loading");
 const [message,setMessage]=useState("Loading interactive 3D model…");
 useEffect(()=>{
  const target=canvas.current;
  if(!target)return;
  let active=true;
  setStatus("loading");setMessage("Loading interactive 3D model…");
  let instance:HeroViewer;
  try{
   instance=new HeroViewer(target,{controls:true,wheel:"zoom",framing:"hero",pixelRatio:Math.min(2,window.devicePixelRatio||1),bloom:0.25});
   viewer.current=instance;
  }catch{
   setStatus("unavailable");
   setMessage("3D preview unavailable on this device");
   return;
  }
  const timeout=window.setTimeout(()=>{
   if(active){setStatus("unavailable");setMessage("3D model could not load. Original hero artwork shown.");}
  },20000);
  instance.load(heroSlug).then(result=>{
   if(!active)return;
   window.clearTimeout(timeout);
   if(!result){setStatus("unavailable");setMessage("3D model not available for this hero.");return;}
   const anim=(result.animations||instance.animations||[]).find(a=>/idle/i.test(a.activity||a.name));
   if(anim){try{instance.play(anim.name)}catch{}}
   setStatus("ready");
   setMessage("Drag to rotate 360° · Scroll or pinch to zoom");
  }).catch(()=>{
   if(!active)return;
   window.clearTimeout(timeout);
   setStatus("unavailable");setMessage("3D model unavailable. Original hero artwork shown.");
  });
  return()=>{active=false;window.clearTimeout(timeout);viewer.current=null;try{instance.dispose()}catch{}};
 },[heroSlug]);
 return <div className="hero360-root" aria-label={heroName+" interactive 360 degree model"}>
   <img className={"hero360-fallback"+(status==="ready"?" hero360-hide":"")} src={fallbackSrc} alt={heroName} draggable={false} onError={e=>{e.currentTarget.style.opacity="0"}}/>
   <canvas ref={canvas} className={"hero360-canvas"+(status==="ready"?" hero360-visible":"")} aria-label={"Rotate the "+heroName+" 3D hero model"}/>
   <div className="hero360-status" role="status">{message}</div>
 </div>;
}