/* Phase 8: My Library, privacy-respecting local customization and presets.
 * Add as a lazyOnload script after previous phases; never replaces current tools.
 */
(()=>{"use strict";
const KEY="dota-phase8-v1",LAB="dota-lab-v2-",DRAFT="dota-competitive-draft-v7",FAV="dota-hero-favorites";
const fresh=()=>({prefs:{density:"standard",hover:true,motion:true,accent:"cyan"},pins:[],builds:[],drafts:[]});
const read=(key,def)=>{try{return JSON.parse(localStorage.getItem(key)||"null")??def}catch{return def}};
const clampName=s=>typeof s==="string"?s.trim().slice(0,68):"";
const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>Array.from(r.querySelectorAll(s));
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const append=(p,...children)=>{for(const c of children)if(c)p.append(c);return p};
const btn=(label,cls,onClick)=>{const b=node("button",cls,label);b.type="button";b.onclick=onClick;return b};
const option=(value,label)=>{const o=node("option","",label);o.value=value;return o};
const note=s=>node("p","p8-note",s);
const heading=(name,detail)=>append(node("div","p8-heading"),node("h3","",name),node("small","",detail));
function sanitize(data){
 const v=data&&typeof data==="object"?data:{},p=v.prefs&&typeof v.prefs==="object"?v.prefs:{};
 return {prefs:{
  density:["standard","compact","roomy"].includes(p.density)?p.density:"standard",
  hover:p.hover!==false,motion:p.motion!==false,
  accent:["cyan","gold","violet","red","green"].includes(p.accent)?p.accent:"cyan"},
  pins:Array.isArray(v.pins)?[...new Set(v.pins.filter(x=>typeof x==="string").map(clampName))].slice(0,16):[],
  builds:Array.isArray(v.builds)?v.builds.filter(x=>x&&typeof x.hero==="string"&&x.state&&typeof x.state==="object").slice(0,32):[],
  drafts:Array.isArray(v.drafts)?v.drafts.filter(x=>x&&x.state&&typeof x.state==="object").slice(0,24):[]}
}
let state=sanitize(read(KEY,null)),heroes=[],loading=null,modal=null,activeTab="home",focusBefore=null,schedulePending=false,toastTimer=0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{message("Device storage is full. Export a backup.")}};
const isHero=name=>heroes.some(x=>x.name===name);
const currentHero=()=>clampName($(".profile-name-row h2")?.textContent)||heroes[0]?.name||"Axe";
function message(text){
 let toast=$("#p8-toast");if(!toast){toast=node("div","p8-toast");toast.id="p8-toast";toast.setAttribute("role","status");document.body.append(toast)}
 toast.textContent=text;toast.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("visible"),3600);
}
function loadHeroes(){
 if(heroes.length)return Promise.resolve(heroes);
 if(!loading)loading=fetch("/api/phase4/roster").then(r=>{if(!r.ok)throw Error("Roster unavailable");return r.json()}).then(d=>{heroes=(d.heroes||[]).filter(x=>x&&typeof x.name==="string"&&typeof x.id==="string");return heroes}).catch(e=>{loading=null;throw e});
 return loading;
}
function heroSelect(initial,changed){
 const select=node("select","p8-input");
 for(const h of heroes)select.append(option(h.name,h.name));
 select.value=isHero(initial)?initial:currentHero();
 if(!select.value&&heroes[0])select.value=heroes[0].name;
 if(changed)select.onchange=()=>changed(select.value);
 select.setAttribute("aria-label","Select Dota 2 hero");
 return select;
}
function selected(options,current,onChange){
 const select=node("select","p8-input");for(const [key,label] of options)select.append(option(key,label));
 select.value=current;select.onchange=()=>onChange(select.value);return select;
}
function label(name,input){return append(node("label","p8-field"),node("span","",name),input)}
function labState(name){
 const s=read(LAB+name,null);
 return s&&typeof s==="object"&&!Array.isArray(s)?{...s,items:Array.isArray(s.items)?s.items.slice(0,6):[]}:null
}
function draftState(){
 const s=read(DRAFT,null);
 if(!s||typeof s!=="object"||!Array.isArray(s.radiant)||!Array.isArray(s.dire))return null;
 return {...s,radiant:s.radiant.slice(0,5),dire:s.dire.slice(0,5),bans:Array.isArray(s.bans)?s.bans.slice(0,12):[]}
}
function saveBuild(name,label){
 const snapshot=labState(name);
 if(!snapshot){message("Configure this hero in Hero Lab before saving.");return false}
 state.builds.unshift({id:String(Date.now())+"-"+Math.random().toString(36).slice(2,6),name:clampName(label)||name+" build",hero:name,state:snapshot,created:Date.now()});
 state.builds=state.builds.slice(0,32);save();message("Hero Lab preset saved.");return true
}
function saveDraft(label){
 const snapshot=draftState();
 if(!snapshot){message("Create your lineup in Draft & Items first.");return false}
 state.drafts.unshift({id:String(Date.now())+"-"+Math.random().toString(36).slice(2,6),name:clampName(label)||"Competitive draft",state:snapshot,created:Date.now()});
 state.drafts=state.drafts.slice(0,24);save();message("Draft preset saved.");return true
}
function restoreBuild(build){
 if(!isHero(build.hero)){message("Hero no longer exists in the roster.");return}
 localStorage.setItem(LAB+build.hero,JSON.stringify(build.state));
 try{sessionStorage.setItem("dota-phase8-open",build.hero)}catch{}
 location.reload()
}
function restoreDraft(draft){localStorage.setItem(DRAFT,JSON.stringify(draft.state));location.reload()}
function pin(name){
 if(!isHero(name))return;
 if(state.pins.includes(name))state.pins=state.pins.filter(x=>x!==name);
 else if(state.pins.length<16)state.pins.push(name);
 else{message("Up to 16 pinned heroes are supported.");return}
 save();apply();refreshHero();message(state.pins.includes(name)?"Hero pinned":"Hero unpinned");
}
function apply(){
 document.body.classList.toggle("p8-compact",state.prefs.density==="compact");
 document.body.classList.toggle("p8-spacious",state.prefs.density==="roomy");
 document.body.classList.toggle("p8-hide-hover",!state.prefs.hover);
 document.body.classList.toggle("p8-reduce-motion",!state.prefs.motion);
 document.body.dataset.p8Accent=state.prefs.accent;
 pinnedBar()
}
function openHero(name,section,silent=false){
 const tile=all(".hero-tile").find(x=>x.getAttribute("aria-label")==="View "+name);
 if(!tile){if(!silent)message("Clear hero search or category filters and try again.");return false}
 close();tile.click();
 if(section){
  let tries=0;
  const seek=()=>{
   const tab=all(".qa-tab").find(x=>x.textContent?.trim()===section);
   if(tab)tab.click();else if(++tries<50)requestAnimationFrame(seek)
  };
  requestAnimationFrame(seek)
 }
 return true
}
function pinnedBar(){
 const header=$(".app-header");if(!header)return;
 let bar=$("#p8-pins");if(!state.pins.length){bar?.remove();return}
 if(!bar){bar=node("section","p8-pins");bar.id="p8-pins";bar.setAttribute("aria-label","Pinned heroes");header.after(bar)}
 const signature=state.pins.join("|");
 if(bar.dataset.signature===signature)return;
 bar.dataset.signature=signature;bar.replaceChildren(node("span","p8-pins-title","PINNED HEROES"));
 for(const name of state.pins)bar.append(btn(name,"p8-pin",()=>openHero(name)));
 bar.append(btn("Edit pins","p8-muted-button",()=>open("home")))
}
function refreshHero(){
 const row=$(".profile-name-row");if(!row)return;
 const name=clampName($("h2",row)?.textContent);
 if(!name||!isHero(name))return;
 let action=$("#p8-hero-pin",row);
 if(!action){action=btn("☆ Pin","p8-profile-button",()=>pin(currentHero()));action.id="p8-hero-pin";row.append(action)}
 const label=state.pins.includes(name)?"★ Unpin":"☆ Pin";
 if(action.textContent!==label)action.textContent=label;
 const lab=$(".p2-panel"),header=lab&&$(".p2-header",lab);
 if(header&&!$("#p8-save-build",header)){
  const saveBtn=btn("Save preset","p8-profile-button",()=>open("builds"));saveBtn.id="p8-save-build";header.append(saveBtn)
 }
}
function install(){
 const toolbar=$(".toolbar");
 if(toolbar&&!$("#p8-launch",toolbar)){const b=btn("✦ My Library","p8-launch",()=>open("home"));b.id="p8-launch";toolbar.prepend(b)}
 refreshHero();pinnedBar()
}
function schedule(){if(schedulePending)return;schedulePending=true;requestAnimationFrame(()=>{schedulePending=false;install()})}
function close(){
 if(!modal)return;modal.remove();modal=null;document.body.classList.remove("p8-locked");
 document.removeEventListener("keydown",escape,true);focusBefore?.focus?.()
}
function escape(e){if(e.key==="Escape"&&modal){e.preventDefault();e.stopPropagation();close()}}
function open(tab){
 activeTab=tab||"home";
 if(!modal){
  focusBefore=document.activeElement;
  modal=node("div","p8-shade");
  const dialog=node("section","p8-dialog");dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-label","My Library premium personalization");
  const head=append(node("header","p8-head"),append(node("div",""),node("small","","DOTA 2 · PHASE 8"),node("h2","","My Library")),btn("×","p8-close",close));
  dialog.append(head,node("nav","p8-tabs"),node("div","p8-body"));modal.append(dialog);modal.onclick=e=>{if(e.target===modal)close()};
  document.body.append(modal);document.body.classList.add("p8-locked");document.addEventListener("keydown",escape,true)
 }
 render();
 loadHeroes().then(()=>{if(modal)render()}).catch(()=>{if(modal)$(".p8-body",modal).append(note("Hero catalog is unavailable. Backups can still be exported."))})
}
function render(){
 if(!modal)return;
 const tabs=$(".p8-tabs",modal),body=$(".p8-body",modal);tabs.replaceChildren();body.replaceChildren();
 for(const [key,text] of [["home","Preferences"],["builds","Hero Builds"],["drafts","Draft Presets"],["cards","Share Cards"],["cosmetics","Cosmetics"],["backup","Sync & Backup"]]){
  tabs.append(btn(text,"p8-tab"+(activeTab===key?" selected":""),()=>{activeTab=key;render()}))
 }
 if(activeTab==="home")preferences(body);
 else if(activeTab==="builds")builds(body);
 else if(activeTab==="drafts")drafts(body);
 else if(activeTab==="cards")cards(body);
 else if(activeTab==="cosmetics")cosmetics(body);
 else backup(body)
}
function preferences(body){
 body.append(note("Customize the homepage without changing any hero images or abilities. Saved preferences apply to this browser."));
 const group=node("div","p8-grid");
 group.append(label("Portrait spacing",selected([["standard","Standard"],["compact","Compact"],["roomy","Spacious"]],state.prefs.density,v=>{state.prefs.density=v;save();apply()})));
 group.append(label("Accent color",selected([["cyan","Cyan"],["gold","Gold"],["violet","Violet"],["red","Red"],["green","Green"]],state.prefs.accent,v=>{state.prefs.accent=v;save();apply()})));
 for(const [key,title] of [["hover","Hover previews"],["motion","Interface animations"]]){
  const check=node("input");check.type="checkbox";check.checked=state.prefs[key];
  check.onchange=()=>{state.prefs[key]=check.checked;save();apply()};
  group.append(append(node("label","p8-check"),check,node("span","",title)))
 }
 body.append(group,heading("Pinned heroes",state.pins.length+" / 16 selected"));
 const chips=node("div","p8-chips");
 for(const name of state.pins)chips.append(btn(name+" ×","p8-chip",()=>{pin(name);render()}));
 body.append(chips);
 if(heroes.length){
  const choice=heroSelect(currentHero());
  body.append(append(node("div","p8-inline"),choice,btn("Pin / unpin","p8-action",()=>{pin(choice.value);render()})))
 }
 body.append(note("Pinned heroes appear above your original four-attribute roster. Open a hero profile to pin it directly."));
}
function builds(body){
 body.append(note("Save multiple Hero Lab configurations, including selected items, level and available simulator upgrades. Presets are stored on this device."));
 body.append(heading("Save Hero Lab build",state.builds.length+" / 32 presets"));
 if(heroes.length){
  const choice=heroSelect(currentHero()),input=node("input","p8-input");
  input.placeholder="Name this build";input.maxLength=68;input.setAttribute("aria-label","Build preset name");
  body.append(append(node("div","p8-inline"),choice,input,btn("Save","p8-action",()=>{if(saveBuild(choice.value,input.value))render()})))
 }
 const list=node("div","p8-list");
 for(const build of state.builds){
  const row=node("article","p8-preset");
  row.append(append(node("div","p8-preset-info"),node("strong","",build.name||"Build"),node("small","",build.hero+" · "+(build.state?.items||[]).filter(Boolean).length+" items")),
  btn("Apply & open Lab","p8-action",()=>restoreBuild(build)),
  btn("Delete","p8-delete",()=>{state.builds=state.builds.filter(x=>x.id!==build.id);save();render()}));
  list.append(row)
 }
 body.append(list);
 if(!state.builds.length)body.append(note("Open any hero, choose Hero Lab, configure your build and save it here."));
}
function drafts(body){
 body.append(note("Preserve your entire Radiant/Dire draft and ban selections. Restoring a preset reloads the page so the original draft simulator uses the restored state."));
 body.append(heading("Save competitive draft",state.drafts.length+" / 24 presets"));
 const input=node("input","p8-input");input.placeholder="Draft preset name";input.maxLength=68;input.setAttribute("aria-label","Draft name");
 body.append(append(node("div","p8-inline"),input,btn("Save draft","p8-action",()=>{if(saveDraft(input.value))render()})));
 const list=node("div","p8-list");
 for(const draft of state.drafts){
  const s=draft.state||{},count=[...(s.radiant||[]),...(s.dire||[])].filter(Boolean).length;
  const row=node("article","p8-preset");
  row.append(append(node("div","p8-preset-info"),node("strong","",draft.name||"Draft"),node("small","",count+" picks · "+(s.bans||[]).length+" bans")),
  btn("Restore","p8-action",()=>restoreDraft(draft)),
  btn("Delete","p8-delete",()=>{state.drafts=state.drafts.filter(x=>x.id!==draft.id);save();render()}));
  list.append(row)
 }
 body.append(list);
 if(!state.drafts.length)body.append(note("Create your lineup in ⚔ Draft & Items, then return to save it."));
}
function cardUrl(hero,accent,style,text){return "/api/phase8/card?"+new URLSearchParams({hero,accent,style,text}).toString()}
function cards(body){
 body.append(note("Create a customizable 1200 × 630 SVG card with original hero artwork, your chosen accent and a short tagline."));
 if(!heroes.length){body.append(note("Loading hero catalog…"));return}
 const hero=heroSelect(currentHero()),preview=node("img","p8-card");preview.alt="Custom hero card";
 const accent=selected([["cyan","Cyan"],["gold","Gold"],["violet","Violet"],["red","Red"],["green","Green"]],state.prefs.accent,refresh);
 const style=selected([["cinematic","Cinematic"],["minimal","Minimal"]],"cinematic",refresh);
 const text=node("input","p8-input");text.value="Explore · Build · Draft";text.maxLength=54;text.setAttribute("aria-label","Hero card tagline");
 const feedback=note("SVG cards retain sharp text when resized.");
 const download=node("a","p8-action","Download SVG");download.setAttribute("download","hero-card.svg");
 function refresh(){
  const u=cardUrl(hero.value,accent.value,style.value,text.value);
  preview.src=u;download.href=u;download.download=hero.value.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-card.svg"
 }
 hero.onchange=refresh;text.oninput=refresh;
 body.append(append(node("div","p8-grid"),label("Hero",hero),label("Accent",accent),label("Layout",style),label("Tagline",text)));
 body.append(preview);
 body.append(append(node("div","p8-inline"),download,btn("Copy card link","p8-action",()=>{
  const url=location.origin+cardUrl(hero.value,accent.value,style.value,text.value);
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>feedback.textContent="Link copied.").catch(()=>feedback.textContent=url);
  else feedback.textContent=url
 })),feedback);
 refresh()
}
function slug(name){
 const alias={"Anti-Mage":"antimage","Centaur Warrunner":"centaur","Doom":"doom_bringer","Io":"wisp","Lifestealer":"life_stealer","Nature's Prophet":"furion","Outworld Destroyer":"obsidian_destroyer","Queen of Pain":"queenofpain","Shadow Fiend":"nevermore","Timbersaw":"shredder","Treant Protector":"treant","Underlord":"abyssal_underlord","Vengeful Spirit":"vengefulspirit","Windranger":"windrunner","Wraith King":"skeleton_king","Zeus":"zuus"};
 return alias[name]||name.toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g,"_")
}
function cosmetics(body){
 body.append(note("The existing 360° viewer remains your default. An optional community loadout tool can preview wearable cosmetics where that hero's assets are available."));
 if(!heroes.length){body.append(note("Loading hero catalog…"));return}
 const hero=heroSelect(currentHero()),link=node("a","p8-action","Open full cosmetic catalog");
 link.rel="noopener noreferrer";link.target="_blank";
 const preview=node("div","p8-cosmetic-host");
 const update=()=>{link.href="https://loadout.nyan.cafe/#"+slug(hero.value);preview.replaceChildren()};
 hero.onchange=update;update();
 body.append(heading("Cosmetic loadout preview","Availability varies by hero and community catalog"),hero);
 body.append(append(node("div","p8-inline"),btn("Preview inside My Library","p8-action",()=>{
  preview.replaceChildren();
  const frame=node("iframe","p8-cosmetic-frame");frame.title=hero.value+" community cosmetic preview";frame.loading="lazy";
  frame.src=link.href;frame.referrerPolicy="no-referrer";frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups");
  preview.append(frame,note("If the external preview is blocked by your browser, use the full cosmetic catalog link."))
 }),link),preview);
 body.append(note("The catalog is an external community service. This website does not access or equip items in your Steam account."));
}
function exported(){
 const labs={};for(const h of heroes){const state=labState(h.name);if(state)labs[h.name]=state}
 return {format:"dota-phase8-profile",version:1,exportedAt:new Date().toISOString(),
  preferences:state.prefs,pins:state.pins,builds:state.builds,drafts:state.drafts,
  favorites:read(FAV,[]),currentDraft:draftState(),labs}
}
function download(){
 const data=new Blob([JSON.stringify(exported(),null,2)],{type:"application/json"}),url=URL.createObjectURL(data),a=node("a");
 a.href=url;a.download="dota-hero-library-backup.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)
}
function importBackup(raw){
 if(!raw||raw.format!=="dota-phase8-profile"||raw.version!==1)throw Error("Unsupported backup format");
 const allowed=new Set(heroes.map(x=>x.name)),ids=new Set(heroes.map(x=>x.id));
 const restored=sanitize({prefs:raw.preferences,pins:raw.pins,builds:raw.builds,drafts:raw.drafts});
 state.prefs=restored.prefs;state.pins=restored.pins.filter(x=>allowed.has(x));
 state.builds=restored.builds.filter(x=>allowed.has(x.hero));state.drafts=restored.drafts;save();
 const current=read(FAV,[]),incoming=Array.isArray(raw.favorites)?raw.favorites:[];
 localStorage.setItem(FAV,JSON.stringify([...new Set([...(Array.isArray(current)?current:[]),...incoming].filter(x=>ids.has(x)))]));
 if(raw.labs&&typeof raw.labs==="object"){
  for(const [name,item] of Object.entries(raw.labs)){
   if(allowed.has(name)&&item&&typeof item==="object"&&!Array.isArray(item)){
    localStorage.setItem(LAB+name,JSON.stringify({...item,items:Array.isArray(item.items)?item.items.slice(0,6):[]}))
   }
  }
 }
 if(raw.currentDraft&&Array.isArray(raw.currentDraft.radiant)&&Array.isArray(raw.currentDraft.dire))localStorage.setItem(DRAFT,JSON.stringify({...raw.currentDraft,radiant:raw.currentDraft.radiant.slice(0,5),dire:raw.currentDraft.dire.slice(0,5)}));
 apply()
}
function transferUrl(){
 const data=JSON.stringify({prefs:state.prefs,pins:state.pins,favorites:read(FAV,[])});
 const encoded=btoa(unescape(encodeURIComponent(data))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 const url=new URL(location.origin+location.pathname);url.searchParams.set("p8",encoded);return url.toString()
}
function backup(body){
 body.append(note("Your saved preferences, favorites, builds and drafts stay in this browser. There is no configured cloud account or automatic cross-device sync."));
 body.append(heading("Full backup","Includes saved Hero Lab builds, draft presets, current draft, favorites, pins and appearance settings"));
 body.append(btn("Download JSON backup","p8-action",download));
 const file=node("input","p8-input");file.type="file";file.accept=".json,application/json";file.setAttribute("aria-label","Select Hero Library backup");
 const result=note("Import restores the selected preferences and presets, and merges favorites.");
 body.append(append(node("div","p8-inline"),file,btn("Import backup","p8-action",async()=>{
  if(!file.files?.[0]){result.textContent="Choose a backup file.";return}
  if(file.files[0].size>800000){result.textContent="Maximum backup size is 800 KB.";return}
  try{await loadHeroes();importBackup(JSON.parse(await file.files[0].text()));result.textContent="Imported successfully. Reloading to apply preferences and drafts…";setTimeout(()=>location.reload(),800)}
  catch(e){result.textContent="Import failed: "+(e?.message||"Invalid backup")}
 })),result);
 body.append(heading("Device transfer link","Transfers pinned heroes, favorites and appearance settings only"));
 const status=note("Anyone with the link can view the selected favorites. For full builds and drafts, use a JSON backup.");
 body.append(btn("Copy transfer link","p8-action",()=>{
  try{
   const url=transferUrl();if(url.length>5000){status.textContent="Link too long; use JSON backup.";return}
   if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>status.textContent="Transfer link copied.").catch(()=>status.textContent=url);
   else status.textContent=url
  }catch{status.textContent="Unable to generate link."}
 }),status);
 body.append(note("Account-based cloud sync requires a configured authentication provider, database and privacy controls, and is not enabled in this release."));
}
function incomingLink(){
 const url=new URL(location.href),encoded=url.searchParams.get("p8");if(!encoded)return;
 url.searchParams.delete("p8");history.replaceState(null,"",url.pathname+url.search+url.hash);
 if(encoded.length>4800)return;
 try{
  const obj=JSON.parse(decodeURIComponent(escape(atob(encoded.replace(/-/g,"+").replace(/_/g,"/")))));
  if(!obj||!obj.prefs)return;
  if(!window.confirm("Import these shared Dota 2 favorites, pins and appearance settings? Existing favorites will be kept."))return;
  loadHeroes().then(()=>{
   const allowed=new Set(heroes.map(x=>x.name)),ids=new Set(heroes.map(x=>x.id)),prefs=sanitize(obj);
   state.prefs=prefs.prefs;state.pins=prefs.pins.filter(x=>allowed.has(x));save();
   const old=read(FAV,[]),incoming=Array.isArray(obj.favorites)?obj.favorites:[];
   localStorage.setItem(FAV,JSON.stringify([...new Set([...(Array.isArray(old)?old:[]),...incoming].filter(x=>ids.has(x)))]));location.reload()
  }).catch(()=>message("Link import failed."))
 }catch{message("The transfer link is invalid.")}
}
function restoreLastBuild(){
 let name=null;
 try{name=sessionStorage.getItem("dota-phase8-open");sessionStorage.removeItem("dota-phase8-open")}catch{}
 if(!name)return;
 let attempts=0;
 const check=()=>{if(openHero(name,"Hero Lab",true))return;if(++attempts<50)setTimeout(check,160)};
 setTimeout(check,350)
}
function start(){
 apply();schedule();loadHeroes().then(()=>{incomingLink();restoreLastBuild();schedule()}).catch(()=>{});
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true})
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
