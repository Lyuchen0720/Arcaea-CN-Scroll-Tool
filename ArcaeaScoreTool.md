# Arcaea 国服 · 成绩提取器

一个本地小工具：从**模拟器里已登录的 Arcaea 国服**把成绩捞出来，导出 CSV，并显示 `a_t`。

## 下载

- **单文件版**：https://github.com/Lyuchen0720/arcaea-web/releases/latest/download/ArcaeaScoreTool.exe
- **解压即用版**：https://github.com/Lyuchen0720/arcaea-web/releases/latest/download/ArcaeaScoreTool-portable.zip

## 用它做什么

- 导出全部成绩为 CSV（歌名 / 难度 / 定数 / 分数 / 判定数 / clear 类型）
- 直接看 B30 / R10 和最强单曲
- 拿到 `a_t`（登录凭证），拿去 https://lyuchen0720.github.io/arcaea-web/ 在线查分

## 三步走

1. **装模拟器**：MuMu 12 / 雷电 / 夜神 / BlueStacks / 逍遥都行，要能开 **root**
   - MuMu：设置 → 其他 → 开启 root 权限，重启模拟器
2. **装游戏并登录**：在模拟器里装 Arcaea 国服（`com.xd.arcaea.tapcn`），登录你的账号
3. **跑本工具**：双击 `ArcaeaScoreTool.exe`，浏览器会自动打开界面
   - 它会自动找 adb、自动连模拟器（7555/5555/16384 等常用端口）
   - 点「检查状态」→ 点「开始提取」

## 两个版本

| 文件 | 说明 |
|---|---|
| `ArcaeaScoreTool.exe` | 单文件版，双击即用（推荐）。运行时会**在自己旁边**建一个 `_MEIxxxx` 临时文件夹，退出后自动删除 |
| `ArcaeaScoreTool-portable.zip` | 解压后跑里面的 exe，不解压临时文件。放在只读目录（如 Program Files）时用它 |

> 单文件版请放在**可写目录**（桌面、下载、D 盘都行）。扔进 `C:\Program Files` 会因为建不了临时文件夹而报 `Could not create temporary directory!`

## 拿不到数据？按顺序排查

- **提示没找到 adb**：手动把 adb 路径填进去（MuMu 的在 `MuMu安装目录\nx_main\adb.exe`）
- **提示没设备**：先启动模拟器，等它完全开机，再点「检查状态」
- **提示没 root**：模拟器设置里打开 root，重启后重试；工具会 `adb root` 并检查 `id` 是否为 `uid=0`
- **游戏里没登录**：先在游戏里登录一次，`shared_prefs` 里才会有 `a_t`
- **双击没反应**：看 exe 同目录的 `arcaea-tool.log`

## 说明

- 定数用的是游戏内下发的**整数**，本工具统一 **+0.4** 补偿到真实定数（实测与官方 rating 误差 0.001）
- 成绩只从本地 SQLite `files/st3` 读，不上传任何地方
- 仅供个人查分，别拿去搞批量/商业用途
