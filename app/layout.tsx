import "./globals.css";
import "../public/phase1.css";
import "../public/phase2.css";
import "../public/phase3.css";
import "../public/phase4.css";
import "../public/qa-fixes.css";
import "../public/phase5.css";
import "../public/hero360.css";
import "../public/phase6.css";
import "../public/phase7.css";
import "../public/phase8.css";
import "../public/phase9.css";
import "../public/phase10.css";
import type {Metadata} from "next";
import Script from "next/script";
export const metadata:Metadata={title:"Dota 2 Hero Library",description:"Explore Dota 2 heroes, builds, drafts, lore, interactive 360 degree models and patch history."};
const scripts=["clean-hero-portraits","phase1","phase1-reconcile","phase2","phase2-quality","phase3","phase4","qa-fixes","phase5","phase7","phase8","phase9","phase10"];
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}{scripts.map(id=><Script key={id} src={"/"+id+".js"} strategy="lazyOnload"/>)}</body></html>;}