import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const products=JSON.parse(await fs.readFile(path.join(root,'products.json'),'utf8'));
const outDir=path.join(root,'assets','products');
await fs.mkdir(outDir,{recursive:true});

async function download(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (GitHub Actions SkinPlan image cache)','accept':'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8'}});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  const ct=(r.headers.get('content-type')||'').toLowerCase();
  if(!ct.startsWith('image/')) throw new Error(`not image: ${ct}`);
  const b=Buffer.from(await r.arrayBuffer());
  if(b.length<1500) throw new Error('image too small');
  return b;
}

let changed=0, failed=0;
for(const p of products){
  const dest=path.join(outDir,`${p.id}.jpg`);
  const urls=p.imageSourceUrls||[];
  let ok=false;
  for(const u of urls){
    try{
      const b=await download(u);
      const out=await sharp(b,{failOn:'none'}).rotate().resize(900,900,{fit:'contain',background:'#ffffff'}).jpeg({quality:92,mozjpeg:true}).toBuffer();
      await fs.writeFile(dest,out);
      console.log(`OK ${p.id} <- ${u}`); changed++; ok=true; break;
    }catch(e){console.log(`FAIL ${p.id} ${u}: ${e.message}`)}
  }
  if(!ok){console.log(`KEEP existing ${p.id}`);failed++}
}
console.log(`Done. Updated ${changed}; kept existing for ${failed}.`);
