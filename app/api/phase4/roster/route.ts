import {NextResponse} from "next/server";
import heroes from "@/lib/heroes.json";
export function GET(){return NextResponse.json({heroes:heroes.map(h=>({id:h.id,name:h.name,attribute:h.attribute})),version:1},{headers:{"Cache-Control":"public,s-maxage=86400"}})}
