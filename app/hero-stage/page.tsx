import "./hero-stage.css";
import AnimationStudio from "@/components/phase4-animation-studio";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{hero?:string}>}){
 const {hero}=await searchParams;
 const selected=/^[a-z0-9_]{1,48}$/.test(hero||"")?hero!:"axe";
 return <AnimationStudio hero={selected}/>;
}