"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Star, RotateCcw, X, ChevronLeft, ChevronRight, Swords, Shield, Footprints, Timer, Target, Heart, Droplets, Pause, Play } from "lucide-react";
import heroesJson from "@/lib/heroes.json";
import profilesJson from "@/lib/profiles.json";
import loreJson from "@/lib/lore.json";
import slugsJson from "@/lib/slugs.json";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Hero360Preview from "@/components/hero-360-preview";

interface Hero { id:string; name:string; attribute:string; image:string }
interface Profile {roles:string[];attack:string;specialty:string;description:string;playstyle:string}
interface Stat {name:string;localized_name:string;roles?:string[];attack_type?:string;base_str:number;base_agi:number;base_int:number;str_gain:number;agi_gain:number;int_gain:number;base_health?:number;base_mana?:number;base_attack_min:number;base_attack_max:number;base_armor:number;move_speed:number;attack_rate:number;attack_range:number;primary_attr?:string;health_regen?:number;mana_regen?:number;attack_speed?:number;}
interface Ability {dname?:string;desc?:string;dmg_type?:string;bkbpierce?:string}
interface HeroAbility { abilities?:string[];talents?:{name:string;level:number}[] }
interface Constants {hero_abilities:Record<string,HeroAbility>;abilities:Record<string,Ability>}
const heroes:Hero[]=heroesJson;
const profiles=profilesJson as Record<string,Profile>;
const lore=loreJson as Record<string,string>;
const slugs=slugsJson as Record<string,string>;
const TYPES=["Strength","Agility","Intelligence","Universal"];
const SYM:Record<string,string>={Strength:"♜",Agility:"◉",Intelligence:"❄",Universal:"✺"};
const TYPE_CLASS:Record<string,string>={Strength:"strength",Agility:"agility",Intelligence:"intelligence",Universal:"universal"};
const cdn="https://cdn.cloudflare.steamstatic.com/apps/dota2/";
const abilityCdn=cdn+"images/dota_react/abilities/";
const slug=(h:Hero)=>slugs[h.name]||h.name.toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const fullImage=(h:Hero)=>`${cdn}images/dota_react/heroes/${slug(h)}.png`;
const anim=(h:Hero)=>`${cdn}videos/dota_react/heroes/renders/${slug(h)}.webm`;
const portrait=(h:Hero)=>`/assets/${h.image.split("/").pop()}`;
const abilityText=(a:string)=>a.replace(/^special_bonus_/,"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const strip=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const format=(n:number,d=1)=>Number(n.toFixed(d)).toString();
const clearTags=(s:string)=>s.replace(/<[^>]+>/g,"");

let statsRequest:Promise<Stat[]>|null=null;
let constantsRequest:Promise<Constants|null>|null=null;
async function getStats(){
 if(!statsRequest)statsRequest=(async()=>{
  try{const r=await fetch("/api/hero-stats");if(!r.ok)throw new Error("stats");const data=await r.json();localStorage.setItem("dota-stats-v10",JSON.stringify(data));return data as Stat[]}
  catch{try{return JSON.parse(localStorage.getItem("dota-stats-v10")||"[]") as Stat[]}catch{return []}}
 })();return statsRequest;
}
async function getConstants(){
 if(!constantsRequest)constantsRequest=(async()=>{
   const base="https://raw.githubusercontent.com/odota/dotaconstants/master/build/";
   try{const [ar,br]=await Promise.all([fetch(base+"hero_abilities.json"),fetch(base+"abilities.json")]);if(!ar.ok||!br.ok)throw new Error("constants");const data={hero_abilities:await ar.json(),abilities:await br.json()} as Constants;try{localStorage.setItem("dota-constants-v10",JSON.stringify(data))}catch{}return data}
   catch{try{return JSON.parse(localStorage.getItem("dota-constants-v10")||"null") as Constants|null}catch{return null}}
 })();return constantsRequest;
}
function getHeroStats(stats:Stat[],h:Hero){return stats.find(s=>s.name==="npc_dota_hero_"+slug(h)||s.localized_name===h.name)}
function getKey(h:Hero){return "npc_dota_hero_"+slug(h)}
function abilityIds(c:Constants|null,h:Hero){return [...new Set((c?.hero_abilities[getKey(h)]?.abilities||[]).filter(v=>!v.startsWith("special_bonus_")&&!v.startsWith("generic_")))];}
function HeroVideo({hero,className,playing=true,onError}:{hero:Hero;className?:string;playing?:boolean;onError?:()=>void}){
 const ref=useRef<HTMLVideoElement>(null);
 useEffect(()=>{const v=ref.current;if(!v)return;if(playing)v.play().catch(()=>onError?.());else v.pause()},[hero.id,playing,onError]);
 return <video key={hero.id} ref={ref} className={className} src={anim(hero)} autoPlay={playing} playsInline loop muted preload="auto" onError={onError}/>;
}
function Popout({hero,anchor,abilityIdsList}:{hero:Hero;anchor:{left:number;top:number};abilityIdsList:string[]}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[hero.id]);
 return <div className="hover-popout" style={{left:anchor.left,top:anchor.top}} aria-hidden="true">
  <img src={fullImage(hero)} alt="" className="pop-static" onError={e=>{e.currentTarget.src=portrait(hero)}}/>
  {!failed&&<HeroVideo hero={hero} className="pop-video" onError={()=>setFailed(true)}/>}
  <div className="pop-bottom"><div className="pop-name">{hero.name.toUpperCase()}</div><div className="pop-abilities">{abilityIdsList.slice(0,4).map(a=><img key={a} src={abilityCdn+a+".png"} alt="" onError={e=>{e.currentTarget.style.visibility="hidden"}}/>)}</div></div>
 </div>
}
function statNumbers(s:Stat,level:number){
 const bonus=Math.max(0,level-1);
 const strength=s.base_str+s.str_gain*bonus, agility=s.base_agi+s.agi_gain*bonus,intelligence=s.base_int+s.int_gain*bonus;
 const health=(s.base_health??120)+22*strength, mana=(s.base_mana??75)+12*intelligence;
 const primary=s.primary_attr==="str"?strength-s.base_str:s.primary_attr==="agi"?agility-s.base_agi:s.primary_attr==="int"?intelligence-s.base_int:0.7*((strength-s.base_str)+(agility-s.base_agi)+(intelligence-s.base_int));
 const armor=s.base_armor+agility/6;
 const speed=(s.attack_speed??100)+agility;
 return {strength,agility,intelligence,health,mana,damageMin:s.base_attack_min+primary,damageMax:s.base_attack_max+primary,armor,speed};
}
function ProfileDialog({hero,onClose,onNext,onPrev,isFavorite,onFavorite,stats,constants}:{hero:Hero;onClose:()=>void;onNext:()=>void;onPrev:()=>void;isFavorite:boolean;onFavorite:()=>void;stats:Stat[];constants:Constants|null}){
 const [level,setLevel]=useState(1);
 const modalRef=useRef<HTMLDivElement>(null);
 const heroStats=getHeroStats(stats,hero);const p=profiles[hero.name];
 const n=heroStats?statNumbers(heroStats,level):null;
 const ids=abilityIds(constants,hero);
 const talents=constants?.hero_abilities[getKey(hero)]?.talents||[];
 useEffect(()=>{setLevel(1)},[hero.id]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();else if(e.key==="ArrowRight")onNext();else if(e.key==="ArrowLeft")onPrev()};document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key)},[onClose,onNext,onPrev]);
 useEffect(()=>{const prev=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=prev}},[]);
 return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}} role="presentation">
  <div className="hero-dialog" ref={modalRef} role="dialog" aria-modal="true" aria-label={`${hero.name} hero details`}>
   <button className="close-dialog" onClick={onClose} title="Close hero details" aria-label="Close hero details"><X size={21}/></button>
   <div className="hero-stage hero-stage-360"><Hero360Preview key={hero.id} heroSlug={slug(hero)} heroName={hero.name} fallbackSrc={fullImage(hero)}/></div>
   <div className="hero-details">
    <div className="attr-overline">{hero.attribute.toUpperCase()} HERO</div>
    <div className="profile-name-row"><h2>{hero.name}</h2><Button size="icon" variant="ghost" onClick={onFavorite} title={isFavorite?"Remove favorite":"Add favorite"}><Star size={21} className={isFavorite?"starred":""}/></Button></div>
    <div className="stats-panel">
     <div className="meta-row"><span className={`attribute-bubble ${TYPE_CLASS[hero.attribute]}`}>{SYM[hero.attribute]}</span><span className="diamond-difficulty">◇◇◇</span><strong>ATTACK TYPE</strong><span>{heroStats?.attack_type||p?.attack||"—"}</span><strong>TAGS</strong><div className="tag-list">{(heroStats?.roles||p?.roles||[]).slice(0,5).map(role=><span key={role}>{role}</span>)}</div></div>
     <div className="small-ability-row">{ids.length?ids.slice(0,9).map(id=><img key={id} title={constants?.abilities[id]?.dname||abilityText(id)} alt="" src={abilityCdn+id+".png"} onError={e=>e.currentTarget.style.display="none"}/>):<span className="dim-note">Abilities load online and are saved for future visits.</span>}</div>
     <div className="level-selector"><div><span>HERO LEVEL</span><strong>{level}</strong></div><div onKeyDownCapture={e=>{if(!(e.target instanceof HTMLElement)||!e.target.closest('[role="slider"]'))return;const k=e.key;let change:number|null=null;if(k==="ArrowRight"||k==="ArrowUp")change=level+1;else if(k==="ArrowLeft"||k==="ArrowDown")change=level-1;else if(k==="Home")change=1;else if(k==="End")change=30;else if(k==="PageUp")change=level+10;else if(k==="PageDown")change=level-10;if(change!==null){e.preventDefault();e.stopPropagation();setLevel(Math.max(1,Math.min(30,change)))}}}><Slider min={1} max={30} step={1} value={[level]} onValueChange={v=>setLevel(Math.max(1,Math.min(30,v[0])))} aria-label="Hero level"/></div><div className="level-marks"><span>1</span><span>10</span><span>20</span><span>30</span></div></div>
     {heroStats&&n?<div className="stats-layout"><div className="core-attributes"><div className="core-stat strength"><span>STRENGTH</span><strong>{format(n.strength)} <small>+{format(heroStats.str_gain)}</small></strong></div><div className="core-stat agility"><span>AGILITY</span><strong>{format(n.agility)} <small>+{format(heroStats.agi_gain)}</small></strong></div><div className="core-stat intelligence"><span>INTELLIGENCE</span><strong>{format(n.intelligence)} <small>+{format(heroStats.int_gain)}</small></strong></div></div><div className="combat-and-bars"><div className="combat-stats"><div title="Base attack damage, including level attributes"><Swords/> <b>{Math.round(n.damageMin)}–{Math.round(n.damageMax)}</b><small>Damage</small></div><div><Shield/> <b>{format(n.armor)}</b><small>Armor</small></div><div><Footprints/> <b>{heroStats.move_speed}</b><small>Move</small></div><div><Timer/> <b>{format(heroStats.attack_rate,2)}</b><small>BAT</small></div><div><Target/> <b>{heroStats.attack_range}</b><small>Range</small></div></div><Resource label="MAX HEALTH" value={Math.round(n.health)} cap={3500} kind="health"/><Resource label="MAX MANA" value={Math.round(n.mana)} cap={2500} kind="mana"/><p className="calc-footnote">Base level scaling, excluding equipment, talents, and temporary effects.</p></div></div>:<p className="dim-note">Detailed hero statistics require an online data load. Hero roles and lore remain available.</p>}
    </div>
    <div className="profile-pills">{(p?.roles||[]).map(r=><span key={r}>{r}</span>)}</div>
    <Info title="Hero overview">{p?.description||"A hero of the Dota 2 roster."}</Info>
    <Info title="Playstyle">{p?.playstyle||"A flexible hero with unique strengths."}</Info>
    <Info title="Hero lore">{lore[hero.name]||"A hero of the Dota 2 universe."}</Info>
    <div className="info-section"><h3>ABILITIES</h3>{ids.length?<div className="abilities-cards">{ids.map(id=><div className="ability-card" key={id}><img src={abilityCdn+id+".png"} alt="" onError={e=>{e.currentTarget.style.visibility="hidden"}}/><div><strong>{constants?.abilities[id]?.dname||abilityText(id)}</strong><p>{strip(constants?.abilities[id]?.desc||"").slice(0,270)}</p></div></div>)}</div>:<p className="dim-note">Ability data will appear once downloaded from Dota constants.</p>}</div>
    <div className="info-section"><h3>TALENT TREE</h3>{talents.length?<div className="talent-tree">{[25,20,15,10].map((tier,i)=>{const pair=talents.filter(t=>t.level===4-i);return <div className="talent-row" key={tier}><div>{constants?.abilities[pair[0]?.name]?.dname|| (pair[0]?abilityText(pair[0].name):"—")}</div><strong>{tier}</strong><div>{constants?.abilities[pair[1]?.name]?.dname|| (pair[1]?abilityText(pair[1].name):"—")}</div></div>})}</div>:<p className="dim-note">Talents appear when the online data is available.</p>}</div>
    <div className="modal-actions"><Button variant="outline" onClick={onFavorite}>{isFavorite?"★ Remove favorite":"☆ Add to favorites"}</Button><Button variant="outline" onClick={onPrev}><ChevronLeft size={15}/> Previous</Button><Button variant="outline" onClick={onNext}>Next <ChevronRight size={15}/></Button></div>
   </div>
  </div>
 </div>;
}
function Resource({label,value,cap,kind}:{label:string;value:number;cap:number;kind:string}){return <div className="resource"><div><span>{label}</span><b>{value.toLocaleString()}</b></div><div className={`resource-track ${kind}`}><div style={{width:`${clamp(value/cap*100,12,100)}%`}}/></div></div>}
function Info({title,children}:{title:string;children:React.ReactNode}){return <section className="info-section"><h3>{title}</h3><p>{children}</p></section>}
export default function HeroLibrary(){
 const [search,setSearch]=useState("");const [onlyFav,setOnlyFav]=useState(false);const [category,setCategory]=useState<string|null>(null);
 const [favorites,setFavorites]=useState<string[]>([]);const [selected,setSelected]=useState<string|null>(null);
 const [hover,setHover]=useState<{id:string;left:number;top:number}|null>(null);
 const [stats,setStats]=useState<Stat[]>([]);const [constants,setConstants]=useState<Constants|null>(null);
 const close=useCallback(()=>setSelected(null),[]);
 useEffect(()=>{try{setFavorites(JSON.parse(localStorage.getItem("dota-hero-favorites")||"[]"))}catch{};getStats().then(setStats);getConstants().then(setConstants)},[]);
 const filtered=useMemo(()=>heroes.filter(h=>(!category||h.attribute===category)&&(!onlyFav||favorites.includes(h.id))&&h.name.toLowerCase().includes(search.toLowerCase())),[category,onlyFav,favorites,search]);
 const selectedHero=heroes.find(h=>h.id===selected)||null;
 const toggleFav=()=>{if(!selected)return;setFavorites(old=>{const next=old.includes(selected)?old.filter(id=>id!==selected):[...old,selected];localStorage.setItem("dota-hero-favorites",JSON.stringify(next));return next})};
 const step=useCallback((delta:number)=>{setSelected(current=>{let i=filtered.findIndex(h=>h.id===current);return filtered[(i+delta+filtered.length)%filtered.length]?.id||null})},[filtered]);
 const reset=()=>{setSearch("");setOnlyFav(false);setCategory(null);setHover(null)};
 const onHover=(h:Hero,e:React.MouseEvent<HTMLButtonElement>)=>{const rect=e.currentTarget.getBoundingClientRect();const width=185;const left=clamp(rect.left+rect.width/2-width/2,8,window.innerWidth-width-8);const top=clamp(rect.top-110,8,window.innerHeight-325);setHover({id:h.id,left,top})};
 const hoverHero=heroes.find(h=>h.id===hover?.id);
 const hoverIds=hoverHero?abilityIds(constants,hoverHero):[];
 return <main className="app-shell"><header className="app-header"><div className="header-brand"><div className="dota-mark"><svg width="33" height="33" viewBox="0 0 48 48" aria-label="Dota 2 logo"><path fill="currentColor" d="M5 6 17 3l5 10 13-7 8 7-4 20-9 2-7 10-10-2-9-13 6-12zm9 6-3 13 8-4 6 9 6-5-8-14z"/></svg></div><span>HERO LIBRARY</span></div><div className="toolbar"><div className="search-wrap"><Search size={17}/><input aria-label="Search heroes" placeholder="Search heroes…" value={search} onChange={e=>setSearch(e.target.value)}/></div><Button variant="outline" onClick={()=>setOnlyFav(x=>!x)} className={onlyFav?"selected-filter":""}><Star size={16}/> Favorites</Button><Button variant="outline" onClick={reset}><RotateCcw size={16}/> Reset</Button></div></header>
  <div className="hero-gallery">{TYPES.filter(t=>!category||t===category).map(t=>{const group=filtered.filter(h=>h.attribute===t);if(!group.length)return null;return <section className={`hero-category ${TYPE_CLASS[t]}`} key={t}><button className="category-title" onClick={()=>setCategory(category===t?null:t)} title={`Filter ${t} heroes`}><span className="attr-symbol">{SYM[t]}</span><span>{t.toUpperCase()}</span><small>{group.length}</small></button><div className="tiles">{group.map(h=><button className="hero-tile" title={h.name} aria-label={`View ${h.name}`} key={h.id} onClick={()=>{setHover(null);setSelected(h.id)}} onMouseEnter={e=>onHover(h,e)} onMouseLeave={()=>setHover(null)} onFocus={e=>{const rect=e.currentTarget.getBoundingClientRect();setHover({id:h.id,left:clamp(rect.left,8,window.innerWidth-185),top:clamp(rect.top-110,8,window.innerHeight-325)})}} onBlur={()=>setHover(null)}><img src={portrait(h)} alt="" loading="lazy"/><span className="tile-name">{h.name}</span>{favorites.includes(h.id)&&<Star size={13} className="tile-favorite" fill="currentColor"/>}</button>)}</div></section>})}</div>
  {filtered.length===0&&<div className="empty-state">No heroes matched. Try another search or reset filters.</div>}
  {hoverHero&&hover&&!selectedHero&&<Popout key={hoverHero.id} hero={hoverHero} anchor={hover} abilityIdsList={hoverIds}/>}
  {selectedHero&&<ProfileDialog hero={selectedHero} onClose={close} onNext={()=>step(1)} onPrev={()=>step(-1)} onFavorite={toggleFav} isFavorite={favorites.includes(selectedHero.id)} stats={stats} constants={constants}/>}
 </main>;
}
