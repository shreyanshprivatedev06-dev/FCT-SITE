/* Loads the browser data and engine files into a sandbox with a fake window (used by the P2P tests). */
const vm=require('vm'), fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'../..');
module.exports = (files)=>{ const store={}; const ctx={ console, Intl, Date, Math, JSON, URLSearchParams,
  localStorage:{ getItem:(k)=>store[k]||null, setItem:(k,v)=>{store[k]=String(v);}, removeItem:(k)=>{delete store[k];} } };
  ctx.window=ctx; vm.createContext(ctx);
  files.forEach(f=> vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), ctx, {filename:f})); return ctx; };
