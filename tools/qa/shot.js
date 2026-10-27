// usage: node shot.js <page-path> <out.png> [actions-json]  — logs in via localStorage, captures console errors
const { chromium } = require('playwright-core');
(async()=>{
  const [,, page, out, w='1440', h='900', clickSel] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
  const p = await b.newPage({ viewport:{width:+w,height:+h} });
  const errs=[]; p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8765/screens/login.html');
  await p.evaluate(()=>{ const s=JSON.parse(localStorage.getItem('fct-demo-v1')||'null')||{v:1,dec:{},set:{},add:{},log:[],events:[],seq:0,flags:{},notes:{}}; s.auth={email:'x'}; s.persona='controller'; localStorage.setItem('fct-demo-v1',JSON.stringify(s)); });
  await p.goto('http://localhost:8765/'+page); await p.waitForTimeout(900);
  if(clickSel){ for(const c of clickSel.split('||')){ await p.click(c); await p.waitForTimeout(400);} }
  await p.screenshot({ path: out, fullPage: true });
  console.log(errs.length? errs.join('\n') : 'no errors');
  await b.close();
})();
