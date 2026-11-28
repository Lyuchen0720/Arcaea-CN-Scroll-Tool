<p align="center"><img src="readme-header.webp" alt="Arcaea 国服查分工具" width="100%"></p>

# Arcaea-CN-Scroll-Tool

> 🎬 **视频教程**：[【韵律源点】Arcaea国服查分系统已发布！](https://www.bilibili.com/video/BV1vGykzgEL1/)
> 作者：B 站 @碱式碳酸铜_Offical · 约 5 分钟

一个纯前端的 Arcaea（国服，`com.xd.arcaea.tapcn`）成绩查询页面，附带 Cloudflare Worker 代理脚本，可自托管或部署成在线站。

- 账号卡：名称 / user code / 官方 rating
- 最近成绩
- **B30 / R10**：粘贴成绩 CSV 后在**浏览器本地**计算
- 支持 GitHub Pages 静态托管 + Worker 代理

### 下载（国内推荐）

| 渠道 | 链接 |
|---|---|
| 蓝奏云（最快） | <https://wwbgn.lanzouw.com/b01i61li9g> 密码 `3t5r` |
| GitHub 加速镜像 | <https://ghfast.top/https://github.com/Lyuchen0720/Arcaea-CN-Scroll-Tool/releases/latest/download/ArcaeaScoreTool.exe> |
| GitHub 官方 | <https://github.com/Lyuchen0720/Arcaea-CN-Scroll-Tool/releases/latest> |

> `github.com` 在国内经常连不上，镜像走 `ghfast.top`，实测 200+ KB/s。

## 一键提取工具（推荐先用这个）

模拟器 + 游戏内登录一次，就能一键导出 `a_t` 和成绩 CSV：

| 下载方式 | 地址 |
|---|---|
| **蓝奏云（国内快）** | https://wwbgn.lanzouw.com/b01i61li9g 密码 **3t5r** |
| **GitHub Releases** | https://github.com/Lyuchen0720/Arcaea-CN-Scroll-Tool/releases/latest |

介绍页（有截图和详细用法）：https://lyuchen0720.github.io/Arcaea-CN-Scroll-Tool/tool.html

- 需要模拟器（MuMu 已验证）里装好国服 Arcaea 并**登录过一次**
- 首次启动会弹 UAC，点「是」（读模拟器私有数据需要管理员权限）
- 托盘右键可「打开页面 / 重启服务 / 退出」
- 导出 CSV 后粘进下面的网页即可看 B30 / R10
- **当前版本 v2.7.6**：一键同步（自动开模拟器 → 开游戏 → 等成绩同步）、内置 570 张曲绘、官网风界面、难度排行、最近成绩单卡、双列导出长图

### 更新记录

| 版本 | 主要变化 |
|---|---|
| **v2.7.6** | 防呆：没登录时不再把旧数据当新的返回；a_t 为空 / 0 条成绩会标黄提示；多开 MuMu 自动挑实例；图片加载加超时 |
| v2.7.6 | 单实例（重复双击不再多开）+ 关掉网页 15 秒后自动退出 |
| v2.7.6 | 模拟器检测增强：注册表 + 扫盘，装在自定义目录也能找到 |
| v2.7.6 | 日志与曲绘缓存移到 `%LOCALAPPDATA%\ArcaeaScoreTool\`，桌面不再产生文件 |
| v2.7.6 | 曲绘懒加载，exe 从 31 MB 降到 27 MB |
| v2.7.6 | 最近成绩页 + 成绩分布 + 排行页搜索筛选 |
| v2.7.6 | 官网风皮肤（头图 + 六边形标题） |

在线版：https://lyuchen0720.github.io/Arcaea-CN-Scroll-Tool/

## 为什么需要代理

`arcaea.xd.cn` 的接口**不返回 `Access-Control-Allow-Origin`**，浏览器直接 `fetch` 会被 CORS 拦掉。所以必须有一个后端转发请求。

本仓库提供两种代理：

| 方式 | 文件 | 场景 |
|---|---|---|
| Python 本地服务 | `server.py` | 本机跑 |
| Cloudflare Worker | `worker.js` | 在线部署（免费） |

## 用法一：本地运行

```bash
python server.py 3390
# 打开 http://127.0.0.1:3390
```

`server.py` 只依赖标准库，不需要 `pip install`。

## 用法二：在线部署（推荐）

### 第 1 步：前端放 GitHub Pages

1. 仓库 Settings → Pages
2. Source 选 `Deploy from a branch`，分支 `main`，目录 `/ (root)`
3. 等一两分钟，访问 `https://<你的用户名>.github.io/Arcaea-CN-Scroll-Tool/`

### 第 2 步：部署 Worker 代理

1. 打开 https://dash.cloudflare.com → Workers & Pages → Create → Worker
2. 名字随便，比如 `arcaea-proxy`
3. 把 `worker.js` 的**全部内容**粘进去，替换默认代码
4. Deploy
5. 记下地址，形如 `https://arcaea-proxy.<你的子域>.workers.dev`

### 第 3 步：连起来

打开 Pages 上的页面，在「API 服务器」输入框填 Worker 地址：

```
https://arcaea-proxy.xxxx.workers.dev
```

点「查询」。设置会存在 `localStorage`，下次自动带上。

## 登录凭证 a_t

页面需要 `a_t`（游戏登录后的 access token）。它存在：

```
/data/data/com.xd.arcaea.tapcn/shared_prefs/Cocos2dxPrefsFile.xml
```

形如：

```xml
<string name="a_t">mehZ2U/....=</string>
```

**整行 XML 或只填等号后面那串都可以**，页面会自动提取。

这个目录是 App 私有目录，**非 root 读不到**。所以目前只有 root 设备 / 模拟器能拿到。

### 取 a_t 的可行做法

1. Android 模拟器（MuMu / 雷电等）装游戏 → 登录 → 开 root → `adb pull` 那个 XML
2. 真机 root 后用文件管理器读

> TapTap OAuth 登录这条路（网页版「用 TapTap 登录」）在国服服务端 `POST /authapi/auth/login/exchange` 上**固定 504**，目前不可用。

## 导出成绩长图

成绩区那一排按钮里有「导出图片」，点一下把整页成绩（账号卡 + 最近成绩 + BEST 30 + RECENT 10）
拼成一张 **1080 × 1842** 的竖版 PNG，登录凭证和 CSV 输入框不会进图。

- **双列排版**：B30 十五行、R10 五行，比旧版单列（1080×3376）矮了 45%
- 每格：名次 + 曲绘 + `[定数] 歌名` / 难度 + 判定行 + 分数 + 潜力
- 判定行 `P{总Pure}+{Shine} · F{Far} · L{Lost}`，有 Lost 时标红
- 纯 Canvas 2D 手绘，不加载任何第三方库，也不联网
- 曲绘按 `jackets/<id>.webp` 取，离线也有图（命中 40/40）
- 文件名 `arcaea-<名字>.png`

### v2.7.6 修的问题

| 问题 | 原因 |
|---|---|
| 导出图里曲绘全是灰色空块 | `drawSongRow` 只画了底块，漏调 `drawJacket` |
| 整图下移 4px、底边被裁 | 起始 `y` 与高度公式起点不一致 |
| R10 十行不出曲绘 | `scoreRow` 调用漏传 `r.id` |
| 带逗号的歌名解析错位 | `splitCSVLine` 定义在调用之后，被 try/catch 静默吞掉 |

## 成绩 CSV

B30 / R10 需要一份历史成绩表。格式：

```csv
song,id,diff,const,score,shiny,pure,far,lost,clear,pot,date,set,designer
"Good bye, Merry-Go-Round.",goodbyemerry,Future,10,9825674,951,1056,18,10,Track Complete,11.086,2026-11-19,ongeki_append_1,絶滅
```

- 从游戏的 SQLite 库 `files/st3` 的 `scores` 表导出
- 必须有 `song,id,diff,const,score,date` 这几列
- 字段含逗号时**要用双引号包裹**（页面已支持）

粘贴进页面的文本框即可，内容存 `localStorage`，不会上传到任何地方。

## 定数说明

`songlist` 下发的 `rating` 字段是**取整**的（10、11），真实定数是小数（10.6、11.5）。

页面按 **+0.4** 修正平均偏差（实测能让算出的 rating 和官方差 0.001）。局限：单曲潜力误差约 ±0.2，但**排序正确**。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 前端页面（单文件，无构建） |
| `songmap.json` | 570 首歌的 id → 名称/定数 |
| `server.py` | 本地 Python 代理 |
| `worker.js` | Cloudflare Worker 代理 |
| `requirements.txt` | 空（无第三方依赖） |
| `jackets/<id>.webp` | 570 首曲绘，256px，共约 10 MB |
| `arcaea.ico` | 程序图标，10 种尺寸（16~256） |
| `icon_1024.png` | 图标母版，1024×1024 |
| `教程.md` | 图文操作教程（8 步 + 常见问题） |
| `ArcaeaScoreTool.md` | 提取器说明（下载 / 用法 / 排查） |

## 查分页显示的是哪一份数据

点「打开查分页」后，**登录凭证**和**成绩数据**框里是**这次刚提取的**那一份，不是上次缓存的。

exe 会把最新的 `a_t` 与 CSV 直接注入到网页（`window.__AUTOTOKEN__` / `window.__AUTOCSV__`），页面取值时注入优先级高于 `localStorage`。

| 现象 | 原因 | 处理 |
|---|---|---|
| 框里是上次的数据 | 没点提取就打开了查分页 | 回工具页点「一键同步并提取」 |
| 提取报错后打开 | 失败时不会更新最新数据 | 看工具页红色错误提示 |
| 仍然是旧的 | 浏览器缓存 | `Ctrl + F5` 强刷 |

**快速确认**：查分页里 `a_t` 框的内容应与工具页显示的一模一样。

## 免责声明

- 本项目**只读**，不修改游戏数据、不发请求以外的任何操作
- 使用的是游戏客户端自己的公开接口，属于**未授权调用**
- 官方从未提供查分 API，使用风险自负（包括但不限于封号）
- `a_t` 等同账号凭证，**不要发给任何人**
