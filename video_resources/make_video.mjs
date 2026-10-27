/* FCT demo — narrated walkthrough builder (audio-led, Kokoro TTS, Playwright native recordVideo, ffmpeg mux).
   Usage: node make_video.mjs <storyline.mjs> [--only-audio] [--reuse-audio]
   1. Narration: each beat's text → Kokoro (local ONNX, voice from the storyline) → output/<name>/audio/beatN.wav (cached by text hash).
   2. Picture: one headless Chromium session with a native recording; every beat runs its actions, then holds until
      its narration has finished (+ pad). Beat start times are measured, not assumed.
   3. Mux: each beat's wav is placed at its measured start; the video is trimmed to beat 1. */
import { KokoroTTS } from 'kokoro-js';
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';

const story = (await import(path.resolve(process.argv[2]))).default;
const ONLY_AUDIO = process.argv.includes('--only-audio');
const OUT = path.resolve('output', story.name), AUD = path.join(OUT, 'audio');
fs.mkdirSync(AUD, { recursive:true });
const dur = (f)=> +execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','csv=p=0', f]).toString().trim();

/* ---------- 1. narration ---------- */
let tts = null;
const beats = story.beats;
for(let i=0;i<beats.length;i++){
  const b = beats[i], h = crypto.createHash('sha1').update(story.voice+'|'+(story.speed||1)+'|'+b.say).digest('hex').slice(0,10);
  const f = path.join(AUD, `beat${i+1}_${h}.wav`);
  if(!fs.existsSync(f)){
    tts = tts || await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype:'q8', device:'cpu' });
    const parts = []; /* split into sentences so long beats keep a natural cadence */
    for(const s of b.say.match(/[^.!?]+[.!?]+/g) || [b.say]){ const a = await tts.generate(s.trim(), { voice:story.voice, speed:story.speed||1 }); parts.push(a); }
    const tmp = []; for(let j=0;j<parts.length;j++){ const p = f+'.'+j+'.wav'; await parts[j].save(p); tmp.push(p); }
    /* 0.25 s of air between sentences */
    const filt = tmp.map((p,j)=> `[${j}:a]apad=pad_dur=0.25[a${j}]`).join(';') + ';' + tmp.map((p,j)=> `[a${j}]`).join('') + `concat=n=${tmp.length}:v=0:a=1[o]`;
    execFileSync('ffmpeg', ['-y', ...tmp.flatMap(p=> ['-i', p]), '-filter_complex', filt, '-map', '[o]', '-ar', '24000', f], { stdio:'ignore' });
    tmp.forEach(p=> fs.unlinkSync(p));
  }
  b.wav = f; b.secs = dur(f);
  console.log(`beat ${i+1} ${b.title}: ${b.secs.toFixed(1)} s`);
}
console.log('narration total', beats.reduce((s,b)=> s+b.secs, 0).toFixed(1), 's');
if(ONLY_AUDIO) process.exit(0);

/* ---------- 2. picture ---------- */
const BASE = story.base, VW = 1440, VH = 900;
const browser = await chromium.launch();
/* sign in once outside the recording, so the video opens straight on beat 1 */
const pre = await browser.newContext({ viewport:{ width:VW, height:VH } });
const p0 = await pre.newPage(); await p0.goto(BASE+'screens/login.html');
await p0.evaluate(()=>{ FCT.login('admin','FCT@towers#2026'); FCT.state.persona='controller'; FCT.save(); });
for(const u of story.warm||[]){ await p0.goto(BASE+u); await p0.waitForTimeout(1500); }
const state = await pre.storageState(); await pre.close();

const ctx = await browser.newContext({ viewport:{ width:VW, height:VH }, storageState:state, recordVideo:{ dir:path.join(OUT,'raw'), size:{ width:VW, height:VH } } });
const page = await ctx.newPage(); const T0 = Date.now();
/* cursor ring and chapter chip live in the page; re-injected on every navigation */
await page.addInitScript(()=>{
  addEventListener('DOMContentLoaded', ()=>{
    const c = document.createElement('div'); c.id = '__cur';
    c.style.cssText = 'position:fixed;left:-40px;top:-40px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2.5px solid #F5C451;background:rgba(245,196,81,.18);z-index:2147483647;pointer-events:none;transition:left .55s cubic-bezier(.3,.7,.2,1),top .55s cubic-bezier(.3,.7,.2,1),transform .15s;box-shadow:0 0 0 3px rgba(0,0,0,.25)';
    document.body.appendChild(c);
    const ch = document.createElement('div'); ch.id = '__chap';
    ch.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483646;pointer-events:none;font:600 15px/1.2 Inter,system-ui,sans-serif;color:#fff;background:rgba(10,30,30,.88);border:1px solid #E0B25A;border-radius:999px;padding:9px 18px;letter-spacing:.01em;box-shadow:0 6px 24px rgba(0,0,0,.35);opacity:0;transition:opacity .3s';
    document.body.appendChild(ch);
    const s = sessionStorage.getItem('__chap'); if(s){ ch.textContent = s; ch.style.opacity = 1; }
  });
});
const chapter = async(t)=> page.evaluate((t)=>{ sessionStorage.setItem('__chap', t); const ch = document.getElementById('__chap'); if(ch){ ch.textContent = t; ch.style.opacity = 1; } }, t).catch(()=>{});
const loc = (a)=>{ let l = page.locator(a.sel); if(a.hasText) l = l.filter({ hasText:a.hasText }); return l.nth(a.nth||0); };
const moveTo = async(l)=>{ const bx = await l.boundingBox().catch(()=>null); if(!bx) return null;
  const x = bx.x + Math.min(bx.width/2, 160), y = bx.y + bx.height/2;
  await page.evaluate(([x,y])=>{ const c = document.getElementById('__cur'); if(c){ c.style.left = x+'px'; c.style.top = y+'px'; } }, [x,y]); await page.waitForTimeout(650); return [x,y]; };
const pulse = ()=> page.evaluate(()=>{ const c = document.getElementById('__cur'); if(c){ c.style.transform = 'scale(.7)'; setTimeout(()=> c.style.transform = 'scale(1)', 160); } });
async function act(a){
  if(a.goto){ await page.goto(BASE+a.goto); await page.waitForSelector(a.ready || '.px-scr', { timeout:20000 }).catch(()=>{}); await page.waitForTimeout(a.settle||900); return; }
  if(a.wait){ await page.waitForTimeout(a.wait); return; }
  if(a.show){ await page.evaluate(([s,t,n,b])=>{ const els = [...document.querySelectorAll(s)].filter(e=> !t || e.textContent.includes(t)); const e = els[n||0]; e && e.scrollIntoView({ behavior:'smooth', block:b||'start' }); }, [a.show, a.hasText, a.nth, a.block]); await page.waitForTimeout(a.settle||1300); return; }
  if(a.point){ const l = loc({ sel:a.point, hasText:a.hasText, nth:a.nth }); await l.scrollIntoViewIfNeeded().catch(()=>{}); await moveTo(l); await page.waitForTimeout(a.settle||500); return; }
  if(a.click || a.dbl){ const l = loc({ sel:a.click||a.dbl, hasText:a.hasText, nth:a.nth }); await l.scrollIntoViewIfNeeded().catch(()=>{}); await moveTo(l); await pulse();
    if(a.dbl) await l.dblclick({ timeout:5000 }).catch(e=> console.log('  ! dbl', a.dbl, e.message.split('\n')[0]));
    else await l.click({ timeout:5000 }).catch(e=> console.log('  ! click', a.click, a.hasText||'', e.message.split('\n')[0]));
    await page.waitForTimeout(a.settle||1100); return; }
  if(a.key){ await page.keyboard.press(a.key); await page.waitForTimeout(a.settle||700); return; }
  if(a.eval){ await page.evaluate(a.eval).catch(e=> console.log('  ! eval', e.message)); await page.waitForTimeout(a.settle||600); return; }
}
const marks = [];
for(let i=0;i<beats.length;i++){
  const b = beats[i];
  if(i===0 && b.actions[0] && b.actions[0].goto){ await act(b.actions[0]); b.actions = b.actions.slice(1); }
  const start = (Date.now()-T0)/1000; marks.push(start); await chapter((i+1)+' · '+b.title);
  const until = Date.now() + (b.secs + (story.pad||0.6))*1000;
  for(const a of b.actions){ await act(a); if(a.goto) await chapter((i+1)+' · '+b.title); }
  const left = until - Date.now(); if(left>0) await page.waitForTimeout(left); else console.log(`  beat ${i+1} actions overran narration by ${(-left/1000).toFixed(1)} s`);
}
const end = (Date.now()-T0)/1000;
await page.close(); const raw = await page.video().path(); await ctx.close(); await browser.close();

/* ---------- 3. mux ---------- */
const lead = marks[0], LAG = 0.27;      /* recording starts ~0.27 s after the page exists */
const vStart = Math.max(0, lead - LAG);
const inputs = ['-y', '-ss', vStart.toFixed(3), '-i', raw];
beats.forEach(b=> inputs.push('-i', b.wav));
const delays = beats.map((b,i)=> `[${i+1}:a]adelay=${Math.round((marks[i]-lead+0.35)*1000)}:all=1[a${i}]`).join(';');
const mix = beats.map((b,i)=> `[a${i}]`).join('') + `amix=inputs=${beats.length}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
const final = path.join(OUT, story.name+'_narrated.mp4');
execFileSync('ffmpeg', [...inputs, '-filter_complex', delays+';'+mix, '-map', '0:v:0', '-map', '[aout]', '-t', (end-lead+0.5).toFixed(2),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', final], { stdio:'ignore' });
fs.writeFileSync(path.join(OUT, 'beat_marks.json'), JSON.stringify(beats.map((b,i)=> ({ beat:i+1, title:b.title, start:+(marks[i]-lead).toFixed(2), narration:+b.secs.toFixed(2) })), null, 1));
console.log('wrote', final, (end-lead).toFixed(1)+' s');
