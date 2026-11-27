# Arcaea 国服 · 成绩提取器 v2.4.1

> 国内下载走镜像更快：<https://ghfast.top/https://github.com/Lyuchen0720/Arcaea-CN-Scroll-Tool/releases/latest/download/ArcaeaScoreTool.exe>


> 🎬 视频教程：[【韵律源点】Arcaea国服查分系统已发布！](https://www.bilibili.com/video/BV1vGykzgEL1/)


一个本地小工具：从**模拟器里已登录的 Arcaea 国服**把成绩捞出来，导出 CSV，并显示 `a_t`。

## 下载

| 方式 | 地址 |
|---|---|
| **蓝奏云**（国内快） | https://wwbgn.lanzouw.com/b01i61li9g 密码 **3t5r** |
| **GitHub Releases** | https://github.com/Lyuchen0720/Arcaea-CN-Scroll-Tool/releases/latest |
| **介绍页**（截图 + 详细说明） | https://lyuchen0720.github.io/Arcaea-CN-Scroll-Tool/tool.html |

两种形态：

- **单文件版** `ArcaeaScoreTool.exe` —— 约 30 MB，双击即用
- **解压即用版** `ArcaeaScoreTool-portable.zip` —— 启动更快，解压后双击里面的 exe

> ⚠️ 单文件版请放在**可写目录**（桌面 / D 盘 / E 盘），**不要放 `C:\Program Files`**，否则会报 `Could not create temporary directory!`

## 用它做什么

- 一键导出全部成绩为 CSV（歌名 / 难度 / 定数 / 分数 / 判定数 / clear 类型）
- 直接看 B30 / R10 和最强单曲
- 拿到 `a_t`（登录凭证），粘到 https://lyuchen0720.github.io/Arcaea-CN-Scroll-Tool/ 在线查分
- 内置 570 张曲绘，导出长图时每首歌都带图

## 三步走

1. **装模拟器并登录一次**
   - 推荐 MuMu 12（工具会自动启动它）
   - 模拟器里装好 TapTap + Arcaea 国服，**登录并打完一次歌**（只需一次）
   - 模拟器需要能开 **root**（MuMu：设置 → 其他 → 开启 root 权限）

2. **双击 exe**
   - 会弹 UAC，点「是」（读模拟器私有数据需要管理员权限）
   - 托盘出现小图标，浏览器自动打开工具页

3. **点「一键同步并提取」**
   - 工具会自动：启动 MuMu → 等开机 → 打开游戏 → 等成绩同步 → 提取
   - 约 1~2 分钟，看到账号 / 成绩数 / B30 就成功了
   - 模拟器本来就开着的话，点下面那个「只提取」更快

最后复制 `a_t`，粘进查分页就能用了。

## 查分页的数据是哪一份

点「打开查分页」后，**登录凭证**和**成绩数据**两个框里显示的，是**这次刚提取的那一份**——不是上一次的缓存。

### 它是怎么塞进去的

exe 收到「打开查分页」请求时，把最新的 `a_t` 和 CSV **直接写进网页源码**：

```html
<script>
  window.__OFFLINE__ = 1;
  window.__AUTOTOKEN__ = "mehZ2U/d+YLFjdF/...";
  window.__AUTOCSV__   = "song,id,diff,...";
</script>
```

页面初始化时按优先级取值：

```javascript
$('#csv').value = (window.__AUTOCSV__ || savedCsv);
$('#tok').value = qt || (window.__AUTOTOKEN__ || savedTok);
```

| 优先级 | 来源 | 说明 |
|---|---|---|
| ① | `window.__AUTOCSV__` / `window.__AUTOTOKEN__` | **exe 刚注入的最新数据** |
| ② | `localStorage` | 上一次手动保存的缓存 |

注入的永远排在 localStorage 前面，所以**不会读到旧数据**。

### 什么情况下会看到旧数据

| 现象 | 原因 | 怎么处理 |
|---|---|---|
| 框里内容是上次的 | 没点「一键同步并提取」或「只提取」，直接开了查分页 | 回工具页点提取 |
| 提取报错后打开 | 提取失败时不会写进最新数据 | 看工具页红色错误提示 |
| 还是旧的 | 浏览器缓存 | `Ctrl + F5` 强刷一次 |

### 一眼确认的方法

打开查分页后，看 `a_t` 框里那串：

- **和工具页显示的一模一样** → 是这次刚提取的 ✅
- **不一样** → 没提取 / 提取失败，不是缓存问题

## 更新记录

| 版本 | 主要变化 |
|---|---|
| **v2.4.1** | 防呆修复：没登录时不再把旧数据当新的返回；a_t 为空 / 0 条成绩会标黄提示；多开 MuMu 自动挑已开机实例；曲绘加载加 6 秒超时 |
| v2.4.1 | 单实例 + 关页即退（关掉网页 15 秒后自动退出） |
| v2.4.1 | 模拟器检测增强（注册表 + 扫盘） |
| v2.4.1 | 数据目录归位到 `%LOCALAPPDATA%\ArcaeaScoreTool\` |
| v2.4.1 | 曲绘懒加载，体积 31 MB → 27 MB |

## 出问题了先看这里

| 现象 | 原因 / 办法 |
|---|---|
| `Could not create temporary directory!` | exe 放在了不可写目录，移到桌面或 D 盘 |
| 找不到 adb | 工具页顶部手动填 `adb.exe` 路径，通常在各模拟器安装目录里 |
| `没有已连接的设备` | 模拟器没开或 adb 端口不同，先手动打开模拟器再点「检查状态」 |
| 提取到 0 条成绩 | 模拟器里游戏没登录，或者还没同步过一次 |
| 提示 root 没生效 | MuMu 设置里开启 root 后要**重启模拟器** |
| 托盘图标不出现 | 没给管理员权限，重新双击并在 UAC 点「是」 |

日志在 exe 同目录的 `arcaea-tool.log`。

## 关于定数

国服下发的 `songlist` 里定数是**取整**的（10、11、9），真实定数是小数（10.6、11.5、9.7）。
本工具按 +0.4 做统一补偿，B30/R10 与官方 rating 的误差在 0.01 左右。

## 免责声明

本工具只做两件事：用 adb 读模拟器里的本地文件、调官方网页版的公开接口。
不修改游戏数据、不模拟对局、不上传任何数据到服务器。
但毕竟不是官方工具，使用风险自负。
