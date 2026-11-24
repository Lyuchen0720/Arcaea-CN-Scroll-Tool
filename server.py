#!/usr/bin/env python3
"""Arcaea CN 查分站 —— 本地后端（标准库实现，无第三方依赖）。

作用：把浏览器请求转发到 https://arcaea.xd.cn/webapi，
因为对方不返回 CORS 头，浏览器无法直接跨域读。
"""
import http.server, json, os, sys, urllib.request, urllib.error, datetime

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3390
ROOT = os.path.dirname(os.path.abspath(__file__))
SONGMAP = os.path.join(ROOT, "songmap.json")
SCORES = os.environ.get("ARCAEA_SCORES") or os.path.join(ROOT, "scores.csv")
BASE = "https://arcaea.xd.cn/webapi"

CONST_FIX = 0.4

_songs = None
def songs():
    global _songs
    if _songs is None:
        with open(SONGMAP, encoding="utf-8") as f:
            _songs = json.load(f)
    return _songs


def _pot(cc, sc):
    cc = cc + CONST_FIX
    if sc >= 10000000: return cc + 2.0
    if sc >= 9800000: return cc + 1.0 + (sc - 9800000) / 200000.0
    return max(0.0, cc - (9800000 - sc) / 300000.0)


def stats():
    """本地成绩库分析。没有 scores.csv 时返回空。"""
    if not os.path.exists(SCORES):
        return {"b30": [], "r10": [], "b30_avg": 0, "r10_avg": 0, "total": 0,
                "note": "no scores.csv (see README)"}
    import csv
    rows = list(csv.DictReader(open(SCORES, encoding="utf-8-sig")))
    out = []
    for r in rows:
        try:
            cc = int(float(r["const"])); sc = int(r["score"])
        except Exception:
            continue
        out.append({"song": r["song"], "id": r["id"], "diff": r["diff"],
                    "cc": cc, "score": sc, "clear": r.get("clear", ""),
                    "date": r.get("date", ""), "pot": round(_pot(cc, sc), 3)})
    best = {}
    for r in out:
        k = (r["id"], r["diff"])
        if k not in best or r["score"] > best[k]["score"]:
            best[k] = r
    b30 = sorted(best.values(), key=lambda x: -x["pot"])[:30]
    cut = datetime.date.today() - datetime.timedelta(days=30)
    rec = []
    for r in out:
        try: d = datetime.date.fromisoformat(str(r["date"]))
        except Exception: continue
        if d >= cut: rec.append(r)
    rec.sort(key=lambda x: -x["pot"])
    r10 = rec[:10]
    return {"b30": b30, "r10": r10,
            "b30_avg": round(sum(x["pot"] for x in b30) / len(b30), 3) if b30 else 0,
            "r10_avg": round(sum(x["pot"] for x in r10) / len(r10), 3) if r10 else 0,
            "total": len(out)}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/songmap":
            self._send(200, json.dumps(songs(), ensure_ascii=False).encode())
            return
        if path == "/songmap.json":
            self._send(200, json.dumps(songs(), ensure_ascii=False).encode())
            return
        if path == "/api/stats":
            self._send(200, json.dumps(stats(), ensure_ascii=False).encode())
            return
        if path.startswith("/api/"):
            self.proxy(path[4:])
            return
        super().do_GET()

    def proxy(self, sub):
        tok = self.headers.get("X-Token") or ""
        url = BASE + sub
        h = {"Accept": "application/json", "User-Agent": "Mozilla/5.0"}
        if tok:
            h["Authorization"] = "Bearer " + tok
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=25)
            self._send(r.status, r.read())
        except urllib.error.HTTPError as e:
            self._send(e.code, e.read())
        except Exception as e:
            self._send(502, json.dumps({"error": str(e)}).encode())


if __name__ == "__main__":
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("serving on http://127.0.0.1:%d" % PORT, flush=True)
    srv.serve_forever()
