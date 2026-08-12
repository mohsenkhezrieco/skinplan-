import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const products=JSON.parse(await fs.readFile(path.join(root,'products.json'),'utf8'));
const outDir=path.join(root,'assets','products');
await fs.mkdir(outDir,{recursive:true});

async function download(url){
  const r=await fetch(url,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0 (GitHub Actions SkinPlan image cache)',
      'accept':'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8'
    }
  });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  const ct=(r.headers.get('content-type')||'').toLowerCase();
  if(!ct.startsWith('image/')) throw new Error(`not image: ${ct}`);
  const b=Buffer.from(await r.arrayBuffer());
  if(b.length<1500) throw new Error('image too small');
  return b;
}

async function looksLikeUsefulPackshot(buffer){
  const img=sharp(buffer,{failOn:'none'}).rotate();
  const meta=await img.metadata();
  if((meta.width||0)<180 || (meta.height||0)<180) return false;

  // Reject near-flat "error/blocked" images seen in the previous workflow.
  const small=await img.resize(120,120,{fit:'contain',background:'#ffffff'}).removeAlpha().raw().toBuffer();
  let sum=0,sum2=0;
  for(const v of small){sum+=v;sum2+=v*v}
  const n=small.length, mean=sum/n, variance=sum2/n-mean*mean;
  return variance>120;
}

let updated=0,failed=0;
const failures=[];

for(const p of products){
  const dest=path.join(outDir,`${p.id}.jpg`);
  const urls=p.imageSourceUrls||[];
  let ok=false;

  for(const u of urls){
    try{
      const b=await download(u);
      if(!(await looksLikeUsefulPackshot(b))) throw new Error('download looks like a blank/error image');

      const out=await sharp(b,{failOn:'none'})
        .rotate()
        .resize(900,900,{fit:'contain',background:'#ffffff'})
        .jpeg({quality:92,mozjpeg:true})
        .toBuffer();

      await fs.writeFile(dest,out);
      console.log(`OK ${p.id} <- ${u}`);
      updated++; ok=true; break;
    }catch(e){
      console.log(`FAIL ${p.id} ${u}: ${e.message}`);
    }
  }

  if(!ok){
    failed++;
    failures.push(p.id);
    console.log(`KEEP existing ${p.id}`);
  }
}

console.log(`Done. Updated ${updated}; kept existing for ${failed}.`);
if(failures.length) console.log(`Not updated: ${failures.join(', ')}`);
