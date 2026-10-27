// node check.js <dir-glob prefix> [shots]  — loads each page, reports console errors; screenshots if 'shots'
const { chromium } = require('playwright-core'); const fs=require('fs');
(async()=>{
  const [,, prefix, shots] = process.argv;
  const root='/Users/ajinkya/Desktop/Finance Control Tower (FCT)/screens/';
  const pages=[]; for(const d of fs.readdirSync(root)){ const p=root+d; if(fs.statSync(p).isDirectory()) for(const f of fs.readdirSync(p)) pages.push(d+'/'+f); }
  const b = await chromium.launch({ executablePath: process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
  const p = await b.newPage({ viewport:{width:1440,height:900} });
  let errs=[]; p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8765/screens/login.html');
  await p.evaluate(()=>{ localStorage.setItem('fct-demo-v1',JSON.stringify({v:1,auth:{email:'x'},persona:'controller',dec:{},set:{},add:{},log:[],events:[],seq:0,flags:{},notes:{}})); });
  for(const pg of pages.filter(x=>x.startsWith(prefix||''))){
    errs=[]; await p.goto('http://localhost:8765/screens/'+pg); await p.waitForTimeout(500);
    const stub = await p.evaluate(()=>document.body.innerHTML.includes('HOLDING PAGE'));
    console.log((errs.length?'ERR ':'ok  ')+pg+(stub?' (stub)':'')+(errs.length?'\n   '+errs.join('\n   '):''));
    if(shots && !stub) await p.screenshot({path:'/private/tmp/claude-501/-Users-ajinkya-Desktop-Finance-Control-Tower--FCT-/b72991a7-987a-4ab0-ad2d-d3a56149fe84/scratchpad/shots/'+pg.replace('/','_').replace('.html','.png'), fullPage:true});
  }
  await b.close();
})();
