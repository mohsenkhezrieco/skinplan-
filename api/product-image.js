
const CODE_RE = /^[0-9]{6,10}$/;
const BOOTS_HOSTS = new Set(['www.boots.com','boots.com']);

function safePage(raw){
  if(!raw)return null;
  let u;
  try{u=new URL(raw)}catch{return null}
  if(!BOOTS_HOSTS.has(u.hostname.toLowerCase()))return null;
  if(u.protocol!=='https:')return null;
  return u;
}

function decodeHtml(s=''){
  return s.replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}

function absoluteUrl(value, base){
  if(!value)return null;
  value=decodeHtml(value.trim().replace(/^['"]|['"]$/g,''));
  if(value.startsWith('//'))return 'https:'+value;
  try{return new URL(value,base).toString()}catch{return null}
}

function extractImageFromHtml(html, pageUrl){
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /"zoomImage"\s*:\s*"([^"]+)"/i,
    /"fullImage"\s*:\s*"([^"]+)"/i,
    /"ItemImage"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*\[\s*"([^"]+)"/i,
    /"image"\s*:\s*"([^"]+)"/i
  ];
  for(const re of patterns){
    const m=html.match(re);
    if(m){
      const u=absoluteUrl(m[1].replace(/\\u002F/g,'/').replace(/\\\//g,'/'),pageUrl);
      if(u && !/NoImageIcon/i.test(u))return u;
    }
  }
  return null;
}

async function fetchImage(url){
  const r=await fetch(url,{
    headers:{
      'accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36',
      'referer':'https://www.boots.com/'
    },
    redirect:'follow'
  });
  const ct=(r.headers.get('content-type')||'').toLowerCase();
  if(!r.ok || !ct.startsWith('image/'))throw new Error('Not a usable image');
  const buf=await r.arrayBuffer();
  if(buf.byteLength<1000)throw new Error('Image response too small');
  return {buf,ct};
}

async function imageFromBootsPage(page){
  const r=await fetch(page.toString(),{
    headers:{
      'accept':'text/html,application/xhtml+xml',
      'accept-language':'en-GB,en;q=0.9',
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36'
    },
    redirect:'follow',
    cache:'no-store'
  });
  if(!r.ok)throw new Error(`Boots page HTTP ${r.status}`);
  const html=await r.text();
  const imageUrl=extractImageFromHtml(html,r.url||page.toString());
  if(!imageUrl)throw new Error('No product image found in Boots page');
  return await fetchImage(imageUrl);
}

function scene7Candidates(code){
  return [
    `https://boots.scene7.com/is/image/Boots/${code}?wid=800&hei=800&fmt=png-alpha&op_sharpen=1`,
    `https://boots.scene7.com/is/image/Boots/${code}?wid=800&hei=800&fit=constrain,1&fmt=png-alpha`,
    `https://boots.scene7.com/is/image/Boots/${code}?wid=600&hei=600&fmt=jpeg&qlt=90`
  ];
}

export async function GET(request){
  const u=new URL(request.url);
  const code=(u.searchParams.get('code')||'').trim();
  const page=safePage(u.searchParams.get('page'));
  const refresh=u.searchParams.get('refresh')==='1';

  if(!CODE_RE.test(code) && !page){
    return new Response('Invalid image request',{status:400});
  }

  let lastError='';

  // Official product page is the preferred resolver, because some Boots products
  // do not use the visible stock number as the Scene7 asset key.
  if(page){
    try{
      const {buf,ct}=await imageFromBootsPage(page);
      return new Response(buf,{status:200,headers:{
        'Content-Type':ct,
        'Cache-Control':refresh?'no-store':'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'X-Image-Source':'boots-product-page',
        'X-Content-Type-Options':'nosniff'
      }});
    }catch(e){lastError=e.message}
  }

  if(CODE_RE.test(code)){
    for(const candidate of scene7Candidates(code)){
      try{
        const {buf,ct}=await fetchImage(candidate);
        return new Response(buf,{status:200,headers:{
          'Content-Type':ct,
          'Cache-Control':refresh?'no-store':'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
          'X-Image-Source':'boots-scene7',
          'X-Content-Type-Options':'nosniff'
        }});
      }catch(e){lastError=e.message}
    }
  }

  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <rect width="100%" height="100%" fill="white"/>
    <rect x="20" y="20" width="460" height="460" rx="24" fill="#f4f6fb" stroke="#d7ddec"/>
    <text x="250" y="230" text-anchor="middle" font-family="Arial" font-size="23" fill="#27305f">Boots product image</text>
    <text x="250" y="270" text-anchor="middle" font-family="Arial" font-size="15" fill="#69738f">could not be loaded</text>
  </svg>`;
  return new Response(svg,{status:404,headers:{
    'Content-Type':'image/svg+xml; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Image-Error':lastError.slice(0,180),
    'X-Content-Type-Options':'nosniff'
  }});
}
