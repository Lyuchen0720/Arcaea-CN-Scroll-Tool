# Arcaea 国服查分站

一个自托管的 Arcaea（国服，`com.xd.arcaea.tapcn`）成绩查询网页，带本地后端代理 + B30/R10 计算。

> ⚠️ **免责声明**：本项目通过游戏客户端自带的接口读取**你自己账号**的数据，属于非官方、未授权调用。
> 使用前请阅读 lowiro 与 XD 的用户协议。作者不对封号、法律或其他后果负责。**不要用它去查别人的成绩，也不要公开分享你的 `a_t`。**

## 它能做什么

| 功能 | 数据来源 | 状态 |
|---|---|---|
| 账号卡（名字 / user_code / rating） | `GET /webapi/user/me` | ✅ |
| 最近成绩 | `user/me` 的 `recent_score` | ✅（官方只给 1 条） |
| 世界排行榜 | `GET /webapi/score/total_ranking/world` | ✅ |
| **B30 / R10** | 本地 `scores.csv` | ✅（需自己导出，见下） |

## 为什么需要 `a_t`

国服客户端把登录令牌存在私有目录：

```
/data/data/com.xd.arcaea.tapcn/shared_prefs/Cocos2dxPrefsFile.xml
    <string name="a_t">…</string>
```

**读取需要 root**。没有 root 的话，等官方开放网页版登录后再来 —— 目前官方 `/authapi/auth/login/exchange` 接口返回 504，第三方没法代你登录。

拿到 `a_t` 后直接粘进页面的输入框（整行 XML 也行，会自动提取）。

## 快速开始

```bash
python server.py 3390
# 打开 http://127.0.0.1:3390
```

无第三方依赖，Python 3.8+ 标准库即可。

### 导出 `scores.csv`（可选，用于 B30/R10）

在 root 过的设备上取出游戏的 SQLite 成绩库：

```bash
adb root
adb pull /data/data/com.xd.arcaea.tapcn/files/st3 ./st3.db
adb pull /data/data/com.xd.arcaea.tapcn/files/cb/active/songs/songlist ./songlist.json
```

然后 join 出 CSV，列名如下（放到项目根目录，或用 `ARCAEA_SCORES` 环境变量指定）：

```csv
song,id,diff,const,score,shiny,pure,far,lost,clear,pot,date,set,designer
Grievous Lady,grievouslady,Future,11,9863372,0,...
```

> 定数说明：官方下发的 `rating` 是**取整值**，本项目统一 `+0.4` 近似真实定数（与官方 rating 误差 < 0.01）。

## 自部署

后端必须存在（`arcaea.xd.cn` 不返回 CORS 头，浏览器无法直接跨域）。两个选择：

**1. 本机 / 家里 NAS**

```bash
python server.py 3390
```

**2. 带 Serverless 的平台**（Vercel / Cloudflare Workers）

把 `server.py` 的 `proxy()` 逻辑搬到对应函数里即可，逻辑很简单：转发 `X-Token` 到 `https://arcaea.xd.cn/webapi/<path>`。

> GitHub Pages 只能放静态文件，**跑不了后端**，直接传上去是打不开的。

## 文件说明

| 文件 | 说明 |
|---|---|
| `server.py` | 后端：静态文件 + `/api/*` 代理 + B30/R10 计算 |
| `index.html` | 前端：深色玻璃拟态，账号卡 / 最近成绩 / B30 表 / R10 表 |
| `songmap.json` | 570 首歌的 id → 标题 / 定数映射（从 `songlist` 提取） |

## 已知限制

- `/webapi/score/song/me/all` 返回 `error_code 1401`，拿不到完整成绩，只能靠本地 CSV
- 定数 `+0.4` 是全局近似，单曲潜力有 ±0.2 误差（排序正确）
- 没有好友功能：`/webapi/friend/me` 只返回空数组，没有查询他人成绩的接口
- TapTap 登录链路（`/authapi/auth/login/exchange`）目前全线 504，等官方修

## License

MIT（仅供学习研究）
