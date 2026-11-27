/* ===== export-engine.js · 导出模板引擎（查分页和预览页共用） =====
   纯 Canvas 绘制，不依赖任何第三方库。
   三款模板：portrait 竖版长图 / wide 横版 16:9 / wall 曲绘墙
   页面只需提供：$('#csv')、LAST、parseCSV、computeBest、computeRecent、
                 avgOf、jacketSrc、imgLoad；
   预览页用 ARC_TPL.build({rows, me, tpl}) 直接出图，不需要上面这些。 */
var ARC_TPL = (function(){

var CONST_FIX = 0.4;
function f_fmt(n){ return (n / 1e6).toFixed(6); }
function f_pot(cc, sc){
  if (sc >= 10000000) return cc + 2;
  if (sc >= 9800000) return cc + 1 + (sc - 9800000) / 200000;
  return Math.max(0, cc - (9800000 - sc) / 300000);
}

/* 行的 pot 可能来自不同数据源（CSV 原始行没有 pot），统一在这里兜底 */
function potOf(r, a){
  if (!r) return 0;
  var v = r.pot;
  if (typeof v === 'number' && isFinite(v)) return v;
  if (v != null){
    var n = parseFloat(v);
    if (isFinite(n)) return n;
  }
  var cc = r.cc;
  var ccn = (cc == null || cc === '-') ? 0 : parseFloat(cc);
  if (!isFinite(ccn)) ccn = 0;
  return f_pot(ccn + CONST_FIX, r.score || 0);
}
function f_diffLabel(d){
  var m = { 0: 'PAST', 1: 'PRESENT', 2: 'FUTURE', 3: 'BEYOND', 4: 'BEYOND' };
  if (typeof d === 'string') return d.toUpperCase();
  return m[d] || d;
}

var JACKET_CACHE = {};

function f_rrPath(G, x, y, w, h, r){
  var c = G.c;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function f_drawCard(G, x, y, w, h){
  var c = G.c;
  f_rrPath(G, x, y, w, h, 18);
  c.fillStyle = 'rgba(255,255,255,.045)';
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,.085)';
  c.lineWidth = 1;
  c.stroke();
}

function f_clipText(G, text, max){
  var c = G.c;
  if (c.measureText(text).width <= max) return text;
  var t = String(text);
  while (t.length > 1 && c.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

function f_drawJacket(G, im, x, y, size){
  var c = G.c, s = G.s;
  c.save();
  f_rrPath(G, x, y, size, size, 8);
  c.clip();
  if (im){
    c.drawImage(im, x, y, size, size);
  } else {
    c.fillStyle = 'rgba(255,255,255,.07)';
    c.fillRect(x, y, size, size);
    c.fillStyle = 'rgba(255,255,255,.28)';
    c.font = (22 * s).toFixed(1) + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♫', x + size / 2, y + size / 2 + 1);
    c.textAlign = 'left';
    c.textBaseline = 'top';
  }
  c.restore();
}

/* 一行成绩：名次 / 封面 / 定数 / 歌名 / 难度+判定 / 分数 / 潜力 */
function f_drawSongRow(G, x, y, w, r, rank, im, sm, opt){
  var c = G.c, s = G.s;
  var H = (opt && opt.rowH) || 66;

  c.font = '700 ' + (14 * s).toFixed(1) + 'px "Consolas",monospace';
  c.textAlign = 'right';
  c.textBaseline = 'middle';
  c.fillStyle = rank <= 3 ? '#f472b6' : 'rgba(255,255,255,.30)';
  c.fillText(String(rank), x + 40 * s, y + H / 2);
  c.textAlign = 'left';

  var size = H - 12, cy = y + H / 2;
  f_drawJacket(G, im, x + 50 * s, cy - size / 2, size);

  var info = (sm && sm[r.id]) || {};
  var title = r.song || info.title || r.id;
  var diff = f_diffLabel(r.diff);

  var scW = 118 * s;
  var tx = x + 50 * s + size + 14 * s;
  var tw = w - (tx - x) - scW - 22 * s;

  c.font = '700 ' + (13 * s).toFixed(1) + 'px "Consolas","Microsoft YaHei",monospace';
  var ccTxt = '[' + (r.cc == null || r.cc === '' ? '-' : String(r.cc)) + ']';
  c.textBaseline = 'top';
  c.textAlign = 'left';
  c.fillStyle = 'rgba(196,181,253,.85)';
  c.fillText(ccTxt, tx, y + 10 * s);
  var cw2 = c.measureText(ccTxt).width;

  c.font = '600 ' + (17 * s).toFixed(1) + 'px "Microsoft YaHei","Segoe UI",sans-serif';
  c.fillStyle = '#ece7ff';
  var mx = tx + cw2 + 7 * s;
  c.fillText(f_clipText(G, title, tx + tw - mx), mx, y + 8 * s);

  c.font = (12 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = 'rgba(255,255,255,.40)';
  c.fillText(diff, tx, y + 32 * s);
  var dx = tx + c.measureText(diff).width + 10 * s;

  var hasJudge = (typeof r.pure === 'number' && !isNaN(r.pure) && r.pure > 0);
  if (hasJudge){
    var base = (12 * s).toFixed(1) + 'px "Consolas","Segoe UI",monospace';
    c.font = base;
    c.fillStyle = 'rgba(255,255,255,.58)';
    var a1 = 'P' + r.pure;
    c.fillText(a1, dx, y + 32 * s);
    var x2 = dx + c.measureText(a1).width;
    if (r.shiny > 0){
      c.fillStyle = 'rgba(196,181,253,.80)';
      var a2 = '+' + r.shiny;
      c.fillText(a2, x2, y + 32 * s);
      x2 += c.measureText(a2).width;
    }
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.fillText(' · ', x2, y + 32 * s);
    var x3 = x2 + c.measureText(' · ').width;
    c.fillStyle = 'rgba(255,255,255,.50)';
    var a3 = 'F' + r.far;
    c.fillText(a3, x3, y + 32 * s);
    var x4 = x3 + c.measureText(a3).width;
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.fillText(' · ', x4, y + 32 * s);
    var x5 = x4 + c.measureText(' · ').width;
    c.fillStyle = r.lost > 0 ? 'rgba(248,113,113,.78)' : 'rgba(255,255,255,.50)';
    c.fillText('L' + r.lost, x5, y + 32 * s);
  }

  c.textAlign = 'right';
  c.textBaseline = 'top';
  c.font = '600 ' + (18 * s).toFixed(1) + 'px "Consolas","Segoe UI",monospace';
  c.fillStyle = '#ffffff';
  c.fillText(f_fmt(r.score), x + w - 10 * s, y + 8 * s);

  c.font = '600 ' + (14 * s).toFixed(1) + 'px "Consolas",monospace';
  c.fillStyle = '#c4b5fd';
  c.fillText(potOf(r).toFixed(3), x + w - 10 * s, y + 31 * s);

  c.textAlign = 'left';
}

/* 多列排版：一列就是列表，两列就是双列 */
function f_drawBlock(G, x, y, w, list, cols, rowH, sm, imgs){
  var gap = 16;
  var colW = (w - gap * (cols - 1)) / cols;
  for (var i = 0; i < list.length; i++){
    var col = i % cols, row = Math.floor(i / cols);
    f_drawSongRow(G, x + col * (colW + gap), y + row * rowH, colW, list[i], i + 1, imgs[list[i].id], sm, { rowH: rowH });
  }
}

/* ===== 导出模板引擎：纯 Canvas，三款模板共用一套绘制原语 ===== */
/* 模板：portrait 竖版长图 · wide 横版 16:9 · wall 曲绘墙 */
/* 所有绘制函数都吃一个 ctx 对象 G：
     G.c 画布上下文  G.ox/G.oy 平移原点（缩放渲染时用）
     G.P 纸面系 → 设备系比例  G.s 视觉尺寸系数（≈1，让 1× 和 2× 视觉一致）
   这样同一份布局代码既能出 1080 宽，也能按倍率放到 2160/3240。 */
var TPL_VER = 2;
var TPL_KEY = 'arcaea_tpl_ver' + TPL_VER;
var TLIST = [
  { id: 'portrait', name: '竖版长图' },
  { id: 'wide',     name: '横版 16:9' },
  { id: 'wall',     name: '曲绘墙' }
];
var TDESC = {
  portrait: 'B30 / R10 完整列表，发群塞满屏',
  wide:     '1920×1080 横版，B30 六列，当壁纸',
  wall:     '曲绘九宫格风格，只有图没有长文字'
};

function TtGet(){ try { return localStorage.getItem(TPL_KEY) || 'portrait'; } catch(e){ return 'portrait'; } }
function TtSet(v){ try { localStorage.setItem(TPL_KEY, v); } catch(e){} }
function tplSet(v){ try { localStorage.setItem(TPL_KEY, v); } catch(e){} }

function TSIG(){
  var who = '';
  try { if (typeof LAST !== 'undefined' && LAST && LAST.me) who = LAST.me.name || LAST.me.display_name || ''; } catch(e){ who = ''; }
  var n = 0;
  try { n = (typeof LAST !== 'undefined' && LAST && LAST.rows) ? LAST.rows.length : 0; } catch(e){}
  return n + '|' + who + '|' + TtGet();
}

/* 纸面系（布局坐标）→ G 对象 */
function G_make(cv, P, s){
  return { cv: cv, c: cv.getContext('2d'), P: P, s: s || 1, ox: 0, oy: 0 };
}

function paintBg(G, W, H, t){
  var c = G.c;
  c.save();
  c.setTransform(G.P, 0, 0, G.P, 0, 0);
  var bg = c.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, '#15111f');
  bg.addColorStop(0.45, '#1b1529');
  bg.addColorStop(1, '#110e19');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  var glow = c.createRadialGradient(W * 0.5, -80, 0, W * 0.5, -80, Math.max(W, 720) * 0.95);
  glow.addColorStop(0, 'rgba(139,92,246,.26)');
  glow.addColorStop(0.55, 'rgba(139,92,246,.07)');
  glow.addColorStop(1, 'rgba(139,92,246,0)');
  c.fillStyle = glow;
  c.fillRect(0, 0, W, Math.min(H, 520));
  if (t && t.glow2){
    var g2 = c.createRadialGradient(W * 0.86, H * 0.92, 0, W * 0.86, H * 0.92, W * 0.55);
    g2.addColorStop(0, 'rgba(236,72,153,.16)');
    g2.addColorStop(1, 'rgba(236,72,153,0)');
    c.fillStyle = g2;
    c.fillRect(0, 0, W, H);
  }
  c.restore();
}

/* 标题栏，固定占 96 */
function f_drawHead(G, W, PAD, opt){
  var c = G.c, s = G.s;
  var big = (opt.big || 42) * s, y = 30;
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.font = 'bold ' + big + 'px "Microsoft YaHei","Segoe UI",sans-serif';
  c.fillStyle = '#f0eaff';
  c.fillText('ARCAEA', PAD, y);
  var tw = c.measureText('ARCAEA').width;
  c.font = '600 ' + Math.round(big * 0.52) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = '#a78bfa';
  c.fillText('国服成绩', PAD + tw + 16 * s, y + Math.round(big * 0.38));
  c.font = (15 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.fillText(opt.sub || 'BEST 30 + RECENT 10', PAD, y + 58);
  if (opt.badge){
    c.textAlign = 'right';
    c.font = '600 ' + (13 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
    c.fillStyle = 'rgba(196,181,253,.55)';
    c.fillText(opt.badge, W - PAD, y + 62);
    c.textAlign = 'left';
  }
}

/* 账号卡，返回占用高度 */
function f_drawProfile(G, x, y, w, h, me){
  var c = G.c, s = G.s;
  f_drawCard(G, x, y, w, h);
  var av = Math.min(76 * s, h - 32), ax = x + 24, ay = y + (h - av) / 2;
  var ag = c.createLinearGradient(ax, ay, ax + av, ay + av);
  ag.addColorStop(0, '#8b5cf6');
  ag.addColorStop(1, '#ec4899');
  c.beginPath();
  c.arc(ax + av / 2, ay + av / 2, av / 2, 0, Math.PI * 2);
  c.fillStyle = ag;
  c.fill();
  c.fillStyle = '#fff';
  c.font = 'bold ' + Math.round(av * 0.47) + 'px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('✦', ax + av / 2, ay + av / 2 + 2);
  c.textAlign = 'left';
  c.textBaseline = 'top';

  c.fillStyle = '#fff';
  c.font = 'bold ' + (30 * s).toFixed(1) + 'px "Microsoft YaHei","Segoe UI",sans-serif';
  c.fillText(f_clipText(G, String(me.display_name || me.name || '—'), w * 0.52), ax + av + 22 * s, y + 30);
  c.font = (14 * s).toFixed(1) + 'px "Consolas",monospace';
  c.fillStyle = 'rgba(255,255,255,.42)';
  c.fillText('USER CODE ' + (me.user_code || ''), ax + av + 22 * s, y + 76);

  c.textAlign = 'right';
  var rnum = ((me.rating || 0) / 1000).toFixed(3);
  c.font = 'bold ' + (46 * s).toFixed(1) + 'px "Consolas","Segoe UI",monospace';
  var pg = c.createLinearGradient(x + w - 320, y, x + w - 40, y + h);
  pg.addColorStop(0, '#a78bfa');
  pg.addColorStop(1, '#f472b6');
  c.fillStyle = pg;
  c.fillText(rnum, x + w - 30 * s, y + 26);
  c.font = (12 * s).toFixed(1) + 'px "Consolas",monospace';
  c.fillStyle = 'rgba(255,255,255,.38)';
  c.fillText('POTENTIAL', x + w - 30 * s, y + 82);
  c.textAlign = 'left';
}

/* 区块标题，固定占 54 */
function f_drawBlockHead(G, x, y, w, title, right, rightColor){
  var c = G.c, s = G.s;
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.font = '600 ' + (20 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = '#e9e3ff';
  c.fillText(title, x + 22 * s, y + 18);
  if (right){
    c.textAlign = 'right';
    c.font = 'bold ' + (22 * s).toFixed(1) + 'px "Consolas",monospace';
    c.fillStyle = rightColor || '#c4b5fd';
    c.fillText(right, x + w - 22 * s, y + 17);
    c.textAlign = 'left';
  }
}

function drawFoot(G, W, H, PAD, alphabetic){
  var c = G.c, s = G.s;
  c.textAlign = 'left';
  c.textBaseline = alphabetic ? 'alphabetic' : 'top';
  c.font = (13 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = 'rgba(255,255,255,.26)';
  c.fillText('定数已按 +0.4 修正 · B30/R10 为本地估算，官方 rating 以游戏内为准', PAD, H - 60.5);
  c.textAlign = 'right';
  c.fillText('曲绘版权归 lowiro 所有 · 仅用于曲目识别', W - PAD, H - 60.5);
  c.textAlign = 'left';
}

/* 曲绘格子（横版网格 / 曲绘墙共用）：封面铺满 + 底部渐隐 + 分数 */
function drawWallTile(G, x, y, w, h, r, rank, im, opt){
  var c = G.c, s = G.s;
  opt = opt || {};
  c.save();
  f_rrPath(G, x, y, w, h, 12);
  c.clip();
  if (im){
    var sw = im.naturalWidth || im.width || 1, sh = im.naturalHeight || im.height || 1;
    var sc = Math.max(w / sw, h / sh);
    c.drawImage(im, x + (w - sw * sc) / 2, y + (h - sh * sc) / 2, sw * sc, sh * sc);
  } else {
    c.fillStyle = 'rgba(255,255,255,.07)';
    c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.font = (26 * s) + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♫', x + w / 2, y + h / 2);
    c.textAlign = 'left';
    c.textBaseline = 'top';
  }
  var shade = c.createLinearGradient(0, y + h * 0.42, 0, y + h);
  shade.addColorStop(0, 'rgba(8,6,14,0)');
  shade.addColorStop(1, 'rgba(8,6,14,.86)');
  c.fillStyle = shade;
  c.fillRect(x, y, w, h);
  c.restore();

  f_rrPath(G, x + 0.5, y + 0.5, w - 1, h - 1, 12);
  c.strokeStyle = 'rgba(255,255,255,.10)';
  c.lineWidth = 1;
  c.stroke();

  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.font = '700 ' + (13 * s).toFixed(1) + 'px "Consolas",monospace';
  c.fillStyle = rank <= 3 ? '#f472b6' : 'rgba(255,255,255,.55)';
  c.fillText(String(rank), x + 12 * s, y + 10);

  c.textAlign = 'right';
  c.font = '600 ' + (17 * s * (opt.a) ).toFixed(1) + 'px "Consolas","Segoe UI",monospace';
  c.fillStyle = '#fff';
  c.fillText(f_fmt(r.score), x + w - 12 * s, y + h - 42 * s * (opt.a || 1));
  c.font = '600 ' + (12 * s * (opt.a || 1)).toFixed(1) + 'px "Consolas",monospace';
  c.fillStyle = '#c4b5fd';
  c.fillText(potOf(r).toFixed(3), x + w - 12 * s, y + h - 23 * s * (opt.a || 1));
  c.textAlign = 'left';
}


/* ---------- 数据层：B30 / R10 / recent 一次算好，所有模板共用 ---------- */
function csvRows(){
  if (typeof LAST !== 'undefined' && LAST && LAST.rows && LAST.rows.length) return LAST.rows;
  var el = document.querySelector('#csv');
  return (el && typeof parseCSV === 'function') ? parseCSV(el.value) : [];
}

function buildRecentList(me, sm){
  if (!me || !me.recent_score) return [];
  sm = sm || {};
  return me.recent_score.map(function(s){
    var info = sm[s.song_id] || {};
    var d = info.difficulties || {};
    var cc = d[String(s.difficulty)];
    var ccv = (cc == null) ? 0 : cc;
    return { id: s.song_id, song: info.title || s.song_id, diff: s.difficulty,
             cc: (cc == null ? '-' : cc), score: s.score,
             pot: f_pot(ccv + CONST_FIX, s.score),
             shiny: s.shiny_perfect_count || 0,
             pure: (s.perfect_count != null ? s.perfect_count : (s.shiny_perfect_count || 0)),
             far: s.near_count || 0, lost: s.miss_count || 0 };
  });
}

function computeBest(rows){
  var best = {};
  rows.forEach(function(r){
    var k = r.id + '|' + r.diff;
    if (!best[k] || r.score > best[k].score) best[k] = r;
  });
  return Object.keys(best).map(function(k){
    var r = best[k];
    return { song: r.song, diff: r.diff, cc: r.cc, score: r.score,
             pot: f_pot(r.cc + CONST_FIX, r.score), date: r.date, id: r.id };
  }).sort(function(a, b){ return b.pot - a.pot; }).slice(0, 30);
}

function computeRecent(rows){
  var cut = Date.now() - 30 * 864e5;
  var rec = [];
  rows.forEach(function(r){
    var t = Date.parse(r.date);
    if (!t || t < cut) return;
    rec.push({ song: r.song, diff: r.diff, cc: r.cc, score: r.score,
               pot: f_pot(r.cc + CONST_FIX, r.score), date: r.date, id: r.id });
  });
  rec.sort(function(a, b){ return b.pot - a.pot; });
  return rec.slice(0, 10);
}

function avgOf(list){
  if (!list || !list.length) return 0;
  return list.reduce(function(s, x){ return s + x.pot; }, 0) / list.length;
}

function collectExportData(opt){
  opt = opt || {};
  var rows = opt.rows || csvRows();
  if (!rows || !rows.length) return null;
  var me = (opt.me !== undefined) ? opt.me
         : ((typeof LAST !== 'undefined' && LAST) ? LAST.me : null);
  var sm = opt.sm || (typeof LAST !== 'undefined' && LAST && LAST.sm) || {};
  return { sm: sm, me: me, b30: computeBest(rows), r10: computeRecent(rows), recent: buildRecentList(me, sm) };
}

/* 曲绘目录：默认 jackets/；预览页会把它改成查分页的绝对目录 */
var ARC_FS_DIR = '', ARC_FS_EXT = '';

function TjacketUrl(id){
  var src = '';
  if (typeof jacketSrc === 'function'){
    try { src = jacketSrc(id); } catch(e) { src = ''; }
  }
  if (!src) src = 'jackets/' + id + (ARC_FS_EXT || '.jpg');
  if (ARC_FS_DIR && !/^[a-z]+:/i.test(src) && src.charAt(0) !== '/') src = ARC_FS_DIR + src;
  return src;
}

function jacketNeeds(d){
  var need = {};
  [d.b30, d.r10, d.recent].forEach(function(list){
    if (!list) return;
    list.forEach(function(r){ if (r.id && !need[r.id]) need[r.id] = TjacketUrl(r.id); });
  });
  return need;
}

/* 预览页没有查分页的 imgLoad，就退回本地实现（同样带超时，防止永远转圈） */
function defaultImgLoad(src){
  return new Promise(function(res){
    if (!src) return res(null);
    if (JACKET_CACHE[src]) return res(JACKET_CACHE[src]);
    var done = false;
    function fin(v){ if (!done){ done = true; res(v); } }
    var im = new Image();
    im.onload = function(){ fin(im); };
    im.onerror = function(){ fin(null); };
    setTimeout(function(){ fin(null); }, 8000);
    im.src = src;
  });
}

function loadJacketImages(need){
  var imgs = {};
  var loader = (typeof imgLoad === 'function') ? imgLoad : defaultImgLoad;
  return Promise.all(Object.keys(need).map(function(id){
    return loader(need[id]).then(function(im){
      imgs[id] = im;
      if (im) JACKET_CACHE[id] = im;
    });
  })).then(function(){ return imgs; });
}


/* ---------- 模板一：竖版长图（沿用第一版查分页的原版布局） ---------- */
function portraitSize(d){
  var HEAD = 54, ROW = 74, COLS = 2, GAP = 14;
  var hRec = d.recent.length ? HEAD + Math.ceil(d.recent.length / COLS) * ROW + 12 : 0;
  var hB30 = d.b30.length ? HEAD + Math.ceil(d.b30.length / COLS) * ROW + 12 : 0;
  var hR10 = d.r10.length ? HEAD + Math.ceil(d.r10.length / COLS) * ROW + 12 : 0;
  return {
    W: 1080,
    H: 30 + 96 + GAP + (d.me ? 132 + GAP : 0) + (hRec ? hRec + GAP : 0)
       + (hB30 ? hB30 + GAP : 0) + (hR10 ? hR10 + GAP : 0) + 62
  };
}

function renderPortrait(G, W, H, d, imgs){
  var PAD = 40, CW = W - PAD * 2, ROW = 74, HEAD = 54, GAP = 14, COLS = 2;
  var me = d.me, b30 = d.b30, r10 = d.r10, recent = d.recent, sm = d.sm;
  paintBg(G, W, H, null);
  G.c.textBaseline = 'top';
  G.c.textAlign = 'left';
  var y = 30;
  f_drawHead(G, W, PAD, { sub: 'BEST 30 + RECENT 10' });
  y += 96;

  if (me){
    f_drawProfile(G, PAD, y, CW, 132, me);
    y += 132 + GAP;
  }
  if (recent.length){
    var hRec = HEAD + Math.ceil(recent.length / COLS) * ROW + 12;
    f_drawCard(G, PAD, y, CW, hRec);
    f_drawBlockHead(G, PAD, y, CW, '最近成绩', '', '');
    f_drawBlock(G, PAD + 14, y + HEAD, CW - 28, recent, COLS, ROW, sm, imgs);
    y += hRec + GAP;
  }
  if (b30.length){
    var hB30 = HEAD + Math.ceil(b30.length / COLS) * ROW + 12;
    f_drawCard(G, PAD, y, CW, hB30);
    f_drawBlockHead(G, PAD, y, CW, 'BEST 30', 'AVG ' + avgOf(b30).toFixed(3), '#c4b5fd');
    f_drawBlock(G, PAD + 14, y + HEAD, CW - 28, b30, COLS, ROW, sm, imgs);
    y += hB30 + GAP;
  }
  if (r10.length){
    var hR10 = HEAD + Math.ceil(r10.length / COLS) * ROW + 12;
    f_drawCard(G, PAD, y, CW, hR10);
    f_drawBlockHead(G, PAD, y, CW, 'RECENT 10', 'AVG ' + avgOf(r10).toFixed(3), '#f9a8d4');
    f_drawBlock(G, PAD + 14, y + HEAD, CW - 28, r10, COLS, ROW, sm, imgs);
    y += hR10 + GAP;
  }
  drawFoot(G, W, H, PAD, true);
}


/* ---------- 模板二：横版 16:9（1920×1080，B30 六列网格） ---------- */
var WIDE_W = 1920, WIDE_H = 1080;

function wideSize(){ return { W: WIDE_W, H: WIDE_H }; }

function renderWide(G, d, imgs){
  var c = G.c, s = G.s;
  var W = WIDE_W, H = WIDE_H, PAD = 60, GAP = 18;
  var me = d.me, b30 = d.b30, r10 = d.r10, recent = d.recent;
  paintBg(G, W, H, { glow2: true });
  c.textBaseline = 'top';
  c.textAlign = 'left';
  f_drawHead(G, W, PAD, { big: 46, sub: 'BEST 30', badge: '国服 · 本地成绩提取' });

  var LW = 404, LX = PAD, LY = 140, LH = H - LY - 84;
  f_drawCard(G, LX, LY, LW, LH);
  if (me){
    var av = 120, ax = LX + (LW - av) / 2, ay = LY + 44;
    var ag = c.createLinearGradient(ax, ay, ax + av, ay + av);
    ag.addColorStop(0, '#8b5cf6');
    ag.addColorStop(1, '#ec4899');
    c.beginPath();
    c.arc(ax + av / 2, ay + av / 2, av / 2, 0, Math.PI * 2);
    c.fillStyle = ag;
    c.fill();
    c.fillStyle = '#fff';
    c.font = 'bold ' + Math.round(56 * s) + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('✦', ax + av / 2, ay + av / 2 + 3);
    c.textBaseline = 'top';
    c.fillStyle = '#fff';
    c.font = 'bold ' + (34 * s).toFixed(1) + 'px "Microsoft YaHei","Segoe UI",sans-serif';
    c.fillText(f_clipText(G, String(me.display_name || me.name || '—'), LW - 40), LX + LW / 2, ay + av + 26);
    c.font = (14 * s).toFixed(1) + 'px "Consolas",monospace';
    c.fillStyle = 'rgba(255,255,255,.42)';
    c.fillText('USER CODE ' + (me.user_code || ''), LX + LW / 2, ay + av + 74);

    var pb = c.createLinearGradient(LX + 40, 0, LX + LW - 40, 0);
    pb.addColorStop(0, '#a78bfa');
    pb.addColorStop(1, '#f472b6');
    c.font = 'bold ' + (76 * s) + 'px "Consolas","Segoe UI",monospace';
    var pText = ((me.rating || 0) / 1000).toFixed(3);
    var pW = c.measureText(pText).width;
    c.textAlign = 'left';
    c.fillStyle = pb;
    c.fillText(pText, LX + (LW - pW) / 2, LY + 300);
    c.textAlign = 'center';
    c.font = (13 * s).toFixed(1) + 'px "Consolas",monospace';
    c.fillStyle = 'rgba(255,255,255,.38)';
    c.fillText('OFFICIAL RATING', LX + LW / 2, LY + 396);

    var stats = [
      ['B30 均值', avgOf(b30).toFixed(3), '#c4b5fd'],
      ['R10 均值', avgOf(r10).toFixed(3), '#f9a8d4'],
      ['最近成绩', String(recent.length) + ' 条', 'rgba(255,255,255,.72)']
    ];
    var sy = LY + 456;
    for (var i = 0; i < stats.length; i++){
      f_rrPath(G, LX + 28, sy, LW - 56, 74, 12);
      c.fillStyle = 'rgba(255,255,255,.045)';
      c.fill();
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.font = (15 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
      c.fillStyle = 'rgba(255,255,255,.40)';
      c.fillText(stats[i][0], LX + 48, sy + 27);
      c.textAlign = 'right';
      c.font = 'bold ' + (26 * s).toFixed(1) + 'px "Consolas",monospace';
      c.fillStyle = stats[i][2];
      c.fillText(stats[i][1], LX + LW - 48, sy + 20);
      sy += 74 + 14;
    }
    c.textAlign = 'left';
  } else {
    c.font = (16 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.textAlign = 'center';
    c.fillText('未查询账号', LX + LW / 2, LY + LH / 2 - 20);
    c.textAlign = 'left';
  }

  /* 右上：最近 10 横排缩略图 */
  var RX = LX + LW + GAP, RW = W - RX - PAD;
  var RHY = 140, RHh = 150;
  f_drawCard(G, RX, RHY, RW, RHh);
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.font = '600 ' + (18 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = '#e9e3ff';
  c.fillText('最近成绩', RX + 20, RHY + 14);
  var ts = 54, tgap = 12;
  var slotW = (RW - 40 - tgap * 9) / 10;
  var recentList = recent.length ? recent : r10;
  for (var j = 0; j < 10; j++){
    var rj = recentList[j];
    var tx = RX + 20 + j * (slotW + tgap);
    if (rj){
      f_drawJacket(G, imgs[rj.id], tx, RHY + 50, ts);
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = (11 * s).toFixed(1) + 'px "Consolas",monospace';
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.fillText(f_fmt(rj.score).slice(2), tx + ts / 2, RHY + 108);
    } else {
      f_rrPath(G, tx, RHY + 50, ts, ts, 8);
      c.fillStyle = 'rgba(255,255,255,.04)';
      c.fill();
    }
    c.textAlign = 'left';
  }

  /* 右下：B30 网格 6×5 */
  var BY = RHY + RHh + GAP, BH = H - BY - 84;
  f_drawCard(G, RX, BY, RW, BH);
  c.font = '600 ' + (18 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
  c.fillStyle = '#e9e3ff';
  c.fillText('BEST 30', RX + 20, BY + 14);
  c.textAlign = 'right';
  c.font = 'bold ' + (22 * s).toFixed(1) + 'px "Consolas",monospace';
  c.fillStyle = '#c4b5fd';
  c.fillText('AVG ' + avgOf(b30).toFixed(3), RX + RW - 20, BY + 11);
  c.textAlign = 'left';

  var cols = 6, rowsN = 5, cgap = 12;
  var cellW = (RW - 40 - cgap * (cols - 1)) / cols;
  var cellH = Math.min(cellW, (BH - 56 - 10 * (rowsN - 1)) / rowsN);
  for (var k = 0; k < Math.min(30, b30.length); k++){
    var col = k % cols, row = Math.floor(k / cols);
    drawWallTile(G, RX + 20 + col * (cellW + cgap), BY + 56 + row * (cellH + 10),
                 cellW, cellH, b30[k], k + 1, imgs[b30[k].id], { a: 0.9 });
  }
  drawFoot(G, W, H, PAD);
}

/* ---------- 模板三：曲绘墙（宽 1080，5 列成品字排） ---------- */
function wallSize(d){
  var W = 1080, PAD = 40, COLS = 5, GAP = 12;
  var tile = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;
  var secH = function(n){ return n ? 54 + Math.ceil(n / COLS) * (tile + GAP) + 14 : 0; };
  var H = 30 + 96 + (d.me ? 132 + 14 : 0) + secH(d.recent.length) + secH(d.b30.length) + secH(d.r10.length) + 84;
  return { W: W, H: H, PAD: PAD, COLS: COLS, GAP: GAP, tile: tile };
}

function renderWall(G, W, H, d, imgs){
  var c = G.c, s = G.s;
  var L = wallSize(d), PAD = L.PAD, COLS = L.COLS, GAP = L.GAP, tile = L.tile;
  paintBg(G, W, H, null);
  c.textBaseline = 'top';
  c.textAlign = 'left';
  var y = 30;
  f_drawHead(G, W, PAD, { sub: 'BEST 30 · CURTAIN WALL' });
  y += 96;
  if (d.me){
    f_drawProfile(G, PAD, y, W - PAD * 2, 132, d.me);
    y += 132 + 14;
  }
  var drawSec = function(title, list, color){
    if (!list || !list.length) return;
    var h = 54 + Math.ceil(list.length / COLS) * (tile + GAP) + 14;
    f_drawCard(G, PAD, y, W - PAD * 2, h);
    c.textAlign = 'left';
    c.font = '600 ' + (20 * s).toFixed(1) + 'px "Microsoft YaHei",sans-serif';
    c.fillStyle = '#e9e3ff';
    c.fillText(title, PAD + 24, y + 18);
    c.textAlign = 'right';
    c.font = 'bold ' + (20 * s).toFixed(1) + 'px "Consolas",monospace';
    c.fillStyle = color;
    c.fillText('AVG ' + avgOf(list).toFixed(3), W - PAD - 24, y + 19);
    c.textAlign = 'left';
    for (var i = 0; i < list.length; i++){
      var col = i % COLS, row = Math.floor(i / COLS);
      drawWallTile(G, PAD + 18 + col * (tile + GAP), y + 46 + row * (tile + GAP), tile, tile, list[i], i + 1, imgs[list[i].id]);
    }
    y += h + 14;
  };
  drawSec('最近成绩', d.recent, '#c4b5fd');
  drawSec('BEST 30', d.b30, '#c4b5fd');
  drawSec('RECENT 10', d.r10, '#f9a8d4');
  drawFoot(G, W, H, PAD);
}


/* ---------- 统一出口 ---------- */
function tplSize(tpl, d){
  if (tpl === 'wide') return wideSize(d);
  if (tpl === 'wall') return wallSize(d);
  return portraitSize(d);
}

function drawTemplate(G, tpl, W, H, d, imgs){
  if (tpl === 'wide') renderWide(G, d, imgs);
  else if (tpl === 'wall') renderWall(G, W, H, d, imgs);
  else renderPortrait(G, W, H, d, imgs);
}

/* 先出一张 1×，确认尺寸后再查分页上做导出（预览页直接 1× 显示） */
async function buildScoreImage(opt){
  opt = opt || {};
  var d = opt.data || collectExportData(opt);
  if (!d) return null;
  var tpl = opt.tpl || TtGet();
  var imgs = await loadJacketImages(jacketNeeds(d));
  var S = tplSize(tpl, d);
  var cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(S.W));
  cv.height = Math.max(1, Math.round(S.H));
  var G = G_make(cv, 1, 1);
  drawTemplate(G, tpl, S.W, S.H, d, imgs);
  return cv;
}

/* 倍率版：纸面坐标不变，整体放大到 round(scale) 倍，字体/线宽跟着放大，糊不了 */
function buildScaled(opt){
  opt = opt || {};
  var d = opt.data || collectExportData(opt);
  if (!d) return null;
  var tpl = opt.tpl || TtGet();
  var S = tplSize(tpl, d);
  var k = Math.max(1, Math.min(4, Math.round(opt.scale || 1)));
  return loadJacketImages(jacketNeeds(d)).then(function(imgs){
    var cv = document.createElement('canvas');
    cv.width = Math.round(S.W * k);
    cv.height = Math.round(S.H * k);
    var G = G_make(cv, k, 1);
    drawTemplate(G, tpl, S.W, S.H, d, imgs);
    return cv;
  });
}

function tplNote(){
  var el = document.getElementById('tplState');
  if (el) el.textContent = TDESC[TtGet()] || '';
}

/* 查分页：模板选择（卡片式；没有卡片容器时退回老的下拉框） */
(function mountTemplatePicker(){
  function paint(){
    var cur = TtGet();
    var cs = document.querySelectorAll('#tplBox .tplcard');
    for (var i = 0; i < cs.length; i++){
      var on = cs[i].getAttribute('data-tpl') === cur;
      cs[i].classList.toggle('on', on);
      cs[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  var cards = document.querySelectorAll('#tplBox .tplcard');
  if (cards.length){
    for (let i = 0; i < cards.length; i++){
      (function(btn){
        var id = btn.getAttribute('data-tpl');
        if (TDESC[id]) btn.title = TDESC[id];
        btn.onclick = function(){ TtSet(id); paint(); tplNote(); };
      })(cards[i]);
    }
    paint(); tplNote();
    return;
  }
  var el = document.getElementById('tplSel');
  if (!el) return;
  TLIST.forEach(function(t){
    var o = document.createElement('option');
    o.value = t.id;
    o.textContent = t.name;
    o.title = TDESC[t.id] || '';
    el.appendChild(o);
  });
  el.value = TtGet();
  el.onchange = function(){ TtSet(el.value); tplNote(); };
  tplNote();
})();

/* ---------- 预览窗：先看再下，换模板/清晰度都不用重新查分 ---------- */
var PREVIEW_CACHE_KEY = 'arcaea_preview_' + TPL_VER;

function exportScoreImage(){
  var tpl = TtGet();
  var rows = csvRows();
  if (!rows.length){ alert('没有成绩数据。先粘贴 CSV 或点「查询」。'); return; }
  var w = window.open('preview.html?tpl=' + encodeURIComponent(tpl), '_blank');
  if (!w){ alert('预览窗被浏览器拦了，右上角允许弹窗再试。'); return; }
  var me = (typeof LAST !== 'undefined' && LAST) ? (LAST.me || null) : null;
  try { w.ARC_PREVIEW = { rows: rows, me: me, tpl: tpl, site: location.href.split('#')[0] }; } catch (e) {}
  try {
    localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify({ rows: rows, me: me, site: location.href.split('#')[0] }));
  } catch (e) {}
}


return {
  ver: TPL_VER,
  list: TLIST,
  desc: TDESC,
  get: TtGet,
  set: TtSet,
  note: tplNote,
  signature: TSIG,
  exportImage: exportScoreImage,
  build: buildScoreImage,
  buildScaled: buildScaled,
  setJacketDir: function(dir, ext){ ARC_FS_DIR = dir || ''; ARC_FS_EXT = ext || ''; },
  _collect: collectExportData,
  _size: tplSize
};
})();
