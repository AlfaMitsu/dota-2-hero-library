import {NextRequest,NextResponse} from "next/server";
import heroes from "@/lib/heroes.json";
import slugs from "@/lib/slugs.json";
export const runtime="nodejs";
const accents:Record<string,string>={cyan:"#67d7e8",gold:"#e8c66b",violet:"#b4a1f0",red:"#ee8b82",green:"#86d8ae"};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]||c));
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams,name=(p.get("hero")||"").trim(),hero=heroes.find(h=>h.name===name);
 if(!hero)return NextResponse.json({error:"Hero not in current roster"},{status:400});
 const accent=accents[p.get("accent")||"cyan"]||accents.cyan;
 const style=p.get("style")==="minimal"?"minimal":"cinematic";
 const subtitle=esc((p.get("text")||"Explore · Build · Draft").trim().slice(0,54).replace(/[\x00-\x1f]/g," "));
 const slug=(slugs as Record<string,string>)[name]||name.toLowerCase().replace(/['’]/g,"").replace(/[^a-z0-9]+/g,"_");
 let art="";
 try{
  const r=await fetch("https://cdn.steamstatic.com/apps/dota2/images/dota_react/heroes/social/"+encodeURIComponent(slug)+".jpg",{next:{revalidate:86400},signal:AbortSignal.timeout(8000)});
  if(r.ok){const b=Buffer.from(await r.arrayBuffer());if(b.length&&b.length<1800000)art="data:image/jpeg;base64,"+b.toString("base64")}
 }catch{}
 const color=accent,titleSize=name.length>19?57:name.length>14?69:90;
 const image=art?'<image href="'+art+'" x="'+(style==="minimal"?790:690)+'" y="-30" width="'+(style==="minimal"?425:510)+'" height="700" preserveAspectRatio="xMidYMid slice" opacity="'+(style==="minimal"?"0.68":"0.95")+'"/>':"";
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'+
 '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#102937"/><stop offset=".6" stop-color="#091522"/><stop offset="1" stop-color="#253e4d"/></linearGradient><linearGradient id="fade"><stop offset="0" stop-color="#0b1b29"/><stop offset=".75" stop-color="#0b1b29" stop-opacity=".82"/><stop offset="1" stop-color="#0b1b29" stop-opacity="0"/></linearGradient><clipPath id="clip"><rect width="1200" height="630" rx="18"/></clipPath></defs>'+
 '<g clip-path="url(#clip)"><rect width="1200" height="630" fill="url(#bg)"/>'+image+'<rect width="1040" height="630" fill="url(#fade)"/>'+
 '<rect x="45" y="47" width="190" height="5" rx="2" fill="'+color+'"/><text x="45" y="99" font-family="Arial,sans-serif" font-size="21" letter-spacing="4" fill="#c1d8e5">DOTA 2 HERO LIBRARY</text>'+
 '<text x="43" y="270" font-family="Arial,sans-serif" font-size="'+titleSize+'" font-weight="900" fill="#f7fafc">'+esc(name)+'</text>'+
 '<rect x="45" y="304" width="280" height="49" rx="6" fill="#193443" stroke="'+color+'" stroke-width="2"/>'+
 '<text x="64" y="337" font-size="22" font-family="Arial,sans-serif" letter-spacing="2" fill="'+color+'">'+esc(hero.attribute.toUpperCase())+'</text>'+
 '<text x="45" y="500" font-size="24" font-family="Arial,sans-serif" fill="#e9f2f7">'+subtitle+'</text>'+
 '<text x="45" y="576" font-size="17" font-family="Arial,sans-serif" fill="#99b9c9">dota-2-hero-library.vercel.app</text></g></svg>';
 return new NextResponse(svg,{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public,s-maxage=3600,stale-while-revalidate=86400","X-Content-Type-Options":"nosniff","Content-Disposition":'inline; filename="'+slug+'-custom-card.svg"'}});
}
