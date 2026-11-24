// Arcaea 国服查分站 —— Cloudflare Worker CORS 代理
// 部署后把 Worker 地址填进网页的「API 服务器」输入框。
// 前端只会请求 /api/<path>，这里转发到 https://arcaea.xd.cn/webapi/<path>

const ORIGIN = 'https://arcaea.xd.cn';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'X-Token, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (!url.pathname.startsWith('/api/')) {
      return new Response('Arcaea proxy. Use /api/<path>.', {
        status: 404,
        headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const sub = url.pathname.slice(4);          // /api/user/me -> /user/me
    const tok = request.headers.get('X-Token') || '';

    const headers = { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' };
    if (tok) headers.Authorization = 'Bearer ' + tok;

    try {
      const res = await fetch(ORIGIN + '/webapi' + sub + url.search, {
        method: 'GET',
        headers,
      });
      const body = await res.arrayBuffer();
      return new Response(body, {
        status: res.status,
        headers: {
          ...CORS,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: String(e) }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
  },
};
