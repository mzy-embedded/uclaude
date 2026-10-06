# uclaude —— Claude Code 便携版启动器

把 Claude Code 整装进 U 盘，插到任何一台 Windows 电脑即可使用：**无需安装 Node.js、无需管理员权限、不改系统环境变量**。

API 凭据以 AES-256-GCM 加密落盘，启动时需通过密码门禁（scrypt 哈希），U 盘丢失也不至于泄露凭据。

> 本仓库只包含**启动器源码**（不到 20KB）。Claude Code 本体、便携 Node 运行时、会话历史均不入库——运行一次 `install.bat` 即可自动重建完整便携版。

---

## 目录结构

```
claude\
  claude.bat            ★ 启动入口（需输入访问密码）
  config.bat            ★ 配置工具：改 API / 改密码 / 查看配置
  install.bat           构建脚本：下载 Node + Claude Code，初始化便携环境
  install-uclaude.cmd   ★ 换电脑时双击一次，给本机装 uclaude 命令
  install-uclaude.ps1   上面脚本的真身（被 cmd 调用）
  core\
    _guard.js           密码校验 / 凭据加解密引擎
    .hash               ← 访问密码哈希（scrypt，不入库）
    .cred               ← 加密的 API 凭据（不入库）
  claude-code\          ← Claude Code 本体（install.bat 生成，不入库）
  portable-node\        ← 便携 Node（install.bat 生成，不入库）
  .claude\              ← 会话历史与配置（不入库）
```

## 使用步骤

**1. 构建便携环境**（需一台有 Node.js 的联网电脑，仅首次）

```bat
git clone https://github.com/mzy-embedded/uclaude.git X:\claude
cd /d X:\claude
install.bat
```

脚本会自动下载便携 Node v24.15.0 与 `@anthropic-ai/claude-code`，完成后默认密码为 `123456`。

**2. 配置 API 与密码**

```bat
config.bat
```

菜单：`1` 改 API 配置 · `2` 改访问密码 · `3` 查看当前配置（Token 打码）。
首次运行会引导创建访问密码。

**3. 给当前电脑装 `uclaude` 命令**

双击 `install-uclaude.cmd`，看到 `uclaude installed` 即可。它会向 PowerShell 配置文件写入一个函数，自动扫描盘符定位 `claude.bat`，**盘符从 F: 变 E: 也无需改动**。

**4. 日常使用**

在任意项目文件夹打开终端：

```powershell
uclaude                 # 启动，工作区 = 当前文件夹
uclaude --continue      # 接续上次会话
uclaude -p "你的问题"    # 一次性提问
```

> 注意：工作区 = 打开终端时所在的目录。**不要双击 `claude.bat` 启动**，否则工作区会变成 U 盘自身。

## 跨电脑续会话

会话历史随 U 盘走（`.claude\projects\`）。换电脑后，在**相同路径**的项目目录里 `uclaude --resume` 即可接续。

## 安全说明

- 凭据加密存储于 `core\.cred`，无密码无法解密；密码哈希为 scrypt，抗暴力破解
- 密码校验全程在内存中完成，不写任何文件；明文 Token 不落盘
- **忘记密码**：删除 `core\.hash` 与 `core\.cred`，重新运行 `config.bat` 配置
- 建议使用 8 位以上混合字符密码，并与 U 盘分开保管
- 已知限制：启动入口（`claude.bat` / `uclaude`）的密码输入为明文显示，防肩窥有限；修改密码、API 等敏感操作请在 `config.bat` 中进行（星号回显）

## 说明

Claude Code 是 Anthropic 的专有软件，本仓库不包含其任何二进制文件或源码，仅提供自动化安装与加密启动的封装脚本。使用时请遵守 [Anthropic 服务条款](https://www.anthropic.com/legal/consumer-terms)。
