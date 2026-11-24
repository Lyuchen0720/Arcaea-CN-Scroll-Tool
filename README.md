# Arcaea 国服查分站

一个纯前端的 Arcaea（国服，`com.xd.arcaea.tapcn`）成绩查询页面，附带 Cloudflare Worker 代理脚本，可自托管或部署成在线站。

- 账号卡：名称 / user code / 官方 rating
- 最近成绩
- **B30 / R10**：粘贴成绩 CSV 后在**浏览器本地**计算
- **曲绘**：仓库内置全部 570 首封面（WebP，12 MB），B30 列表自动显示，无需额外操作
- 支持 GitHub Pages 静态托管 + Worker 代理

## 一键提取工具（推荐先用这个）

模拟器 + 游戏内登录一次，就能一键导出 `a_t` 和成绩 CSV：

**[下载 ArcaeaScoreTool 最新版](https://github.com/Lyuchen0720/arcaea-web/releases/latest)**

- 需要模拟器（MuMu 已验证）里装好国服 Arcaea 并登录过
- 首次启动会弹 UAC，点「是」（托盘图标需要管理员权限）
- 托盘右键可「打开页面 / 重启服务 / 退出」
- 导出 CSV 后粘进下面的网页即可看 B30 / R10
- v1.2.0 起支持「导出封面」：一键把成绩涉及的曲绘打成 zip

> **端口修复提醒**：v1.2.0 修复了 Windows 上 `SO_REUSEADDR` 导致两个进程
> 同时绑定同一端口的问题（旧版重复启动会出现「网页打开但按钮没反应」）。

在线版：https://lyuchen0720.github.io/arcaea-web/

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
3. 等一两分钟，访问 `https://<你的用户名>.github.io/arcaea-web/`

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

## 免责声明

- 本项目**只读**，不修改游戏数据、不发请求以外的任何操作
- 使用的是游戏客户端自己的公开接口，属于**未授权调用**
- 官方从未提供查分 API，使用风险自负（包括但不限于封号）
- `a_t` 等同账号凭证，**不要发给任何人**
