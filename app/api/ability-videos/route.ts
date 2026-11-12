import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const ROOT="https://cdn.steamstatic.com/apps/dota2/videos/dota_react/abilities/";
const memo=new Map<string,{expires:number;available:boolean}>();
async function exists(hero:string,id:string){
 const key=hero+"/"+id, old=memo.get(key);
 if(old&&old.expires>Date.now())return old.available;
 const check=async(ext:string)=>{try{const response=await fetch(ROOT+hero+"/"+id+"."+ext,{method:"HEAD",signal:AbortSignal.timeout(6500),next:{revalidate:86400}});return response.ok&&(response.headers.get("content-type")||"").startsWith("video/")}catch{return false}};
 const yes=await check("webm")||await check("mp4");
 memo.set(key,{available:yes,expires:Date.now()+(yes?86400000:3600000)});
 return yes;
}
export async function GET(req:NextRequest){
 const hero=req.nextUrl.searchParams.get("hero")||"";
 const ids=[...new Set((req.nextUrl.searchParams.get("ids")||"").split(",").filter(Boolean))].slice(0,18);
 if(!/^[a-z0-9_]{1,60}$/.test(hero)||ids.some(id=>!/^[a-z0-9_]{1,100}$/.test(id)))return NextResponse.json({error:"Invalid hero or ability IDs"},{status:400});
 const results=await Promise.all(ids.map(id=>exists(hero,id)));
 return NextResponse.json({available:ids.filter((id,i)=>results[i])},{headers:{"Cache-Control":"public, max-age=120, s-maxage=3600"}});
}
