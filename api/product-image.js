
const ALLOWED = /^[0-9]{6,10}$/;

export async function GET(request) {
  try {
    const u = new URL(request.url);
    const code = (u.searchParams.get('code') || '').trim();
    if (!ALLOWED.test(code)) {
      return new Response('Invalid product image code', { status: 400 });
    }
    const target = `https://boots.scene7.com/is/image/Boots/${code}?wid=800&hei=800&fmt=png-alpha&op_sharpen=1`;
    const upstream = await fetch(target, { cache: 'force-cache' });
    if (!upstream.ok) return new Response('Image unavailable', { status: 502 });
    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('content-type') || 'image/png');
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    return new Response('Image proxy error', { status: 500 });
  }
}
