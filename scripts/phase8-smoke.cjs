/* Phase 8 browser regression checks (run after Phase 8 production deployment).
 * npm install --no-save playwright && npx playwright install chromium
 * BASE_URL=https://dota-2-hero-library.vercel.app node scripts/phase8-smoke.cjs
 */
const {chromium}=require("playwright");
const BASE=process.env.BASE_URL||"https://dota-2-hero-library.vercel.app";
const report={url:BASE,checks:[]};let fail=0;
function check(value,label){report.checks.push({test:label,passed:!!value});if(!value)fail++}
async function main(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto(BASE,{waitUntil:"domcontentloaded",timeout:45000});
 await page.waitForTimeout(2300);
 check(response.status()===200,"Homepage HTTP 200");
 check(await page.locator(".hero-tile").count()===127,"127 hero portraits remain in roster");
 check(await page.locator("#p8-launch").count()===1,"My Library launcher mounted");
 check(await page.locator("#p7-open").count()===1,"Phase 7 Competitive Center preserved");
 await page.locator("#p8-launch").click();
 await page.waitForTimeout(900);
 check(await page.locator(".p8-tab").count()===6,"Six Phase 8 panels available");
 const prefs=page.locator(".p8-tab").filter({hasText:"Preferences"});await prefs.click();
 const combo=page.locator(".p8-field").first().locator("select");
 await combo.selectOption("compact");
 check(await page.evaluate(()=>document.body.classList.contains("p8-compact")),"Compact gallery preference applies");
 await page.locator(".p8-tab").filter({hasText:"Hero Builds"}).click();
 check(await page.locator(".p8-body").innerText().then(x=>x.includes("Hero Lab")),"Hero Lab build presets reachable");
 await page.locator(".p8-tab").filter({hasText:"Draft Presets"}).click();
 check(await page.locator(".p8-body").innerText().then(x=>x.includes("draft")),"Draft presets reachable");
 await page.locator(".p8-tab").filter({hasText:"Share Cards"}).click();
 await page.waitForTimeout(1800);
 check(await page.locator(".p8-card").count()===1,"Custom card preview mounted");
 const image=await page.locator(".p8-card").evaluate(x=>({ready:x.complete,loaded:x.naturalWidth>0}));
 check(image.ready&&image.loaded,"Hero SVG card rendered");
 await page.locator(".p8-tab").filter({hasText:"Cosmetics"}).click();
 check(await page.locator('a[href^="https://loadout.nyan.cafe/"]').count()===1,"Optional cosmetic catalog available");
 await page.locator(".p8-tab").filter({hasText:"Sync & Backup"}).click();
 check(await page.locator(".p8-body").innerText().then(x=>x.includes("JSON backup")),"Data export/import controls reachable");
 await page.locator(".p8-close").click();
 check(await page.locator(".hero-tile").count()===127,"Hero grid preserved after using My Library");
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto(BASE,{waitUntil:"domcontentloaded",timeout:45000});await mobile.waitForTimeout(1500);
 check((await mobile.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=1,"Mobile gallery no horizontal overflow");
 await mobile.locator("#p8-launch").click();
 check(await mobile.locator(".p8-dialog").isVisible(),"My Library usable on mobile");
 check((await mobile.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=1,"Mobile My Library no horizontal overflow");
 check(errors.length===0,"No uncaught browser JavaScript errors");
 report.errors=errors;await browser.close();
}
main().then(()=>{console.log(JSON.stringify(report,null,2));process.exitCode=fail?1:0}).catch(e=>{console.error("PHASE8_SMOKE_FAILED",e);process.exitCode=1});
