# Arcaea 国服 · 成绩提取器 v2.2.2

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
