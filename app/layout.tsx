import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Dota 2 Hero Library",description:"Explore Dota 2 heroes, lore, abilities, animated previews and level-based statistics."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
