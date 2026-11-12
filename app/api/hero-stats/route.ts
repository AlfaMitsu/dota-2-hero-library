import {NextResponse} from "next/server";
export const runtime="nodejs";
const SOURCE="https://raw.githubusercontent.com/odota/dotaconstants/master/build/heroes.json";
export async function GET(){
 try{
  const response=await fetch(SOURCE,{next:{revalidate:3600},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error("Published hero constants unavailable");
  const json=await response.json() as Record<string,Record<string,unknown>>;
  const rows=Object.values(json).map(hero=>({
   ...hero,localized_name:hero.localized_name||hero.name,
   name:hero.name
  }));
  return NextResponse.json(rows,{headers:{"Cache-Control":"public,s-maxage=1800,stale-while-revalidate=3600"}});
 }catch{return NextResponse.json({error:"Hero stats temporarily unavailable"},{status:503})}
}
