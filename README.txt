Claude Code 便携版（U盘随身带）
================================

【这是什么】
将 Claude Code（原生版 2.1.267）整装在 U 盘 F:\claude\ 下。
插到任何一台 Windows 电脑即可使用，无需安装 Node.js、无需管理员权限、
不改系统环境变量。API 凭据加密存储 + 启动密码门禁，U 盘丢失也不怕泄露。
自带 uclaude 一键启动命令：换电脑只需安装一次，此后用法与本地版一致。

【目录结构】
  claude\claude.bat             ★ 启动入口（需输入访问密码，勿删）
  claude\config.bat             ★ 配置工具：改 API / 改密码 / 查看配置
  claude\install.bat            换 U 盘后重建用（联网运行一次）
  claude\install-uclaude.cmd    ★ 换电脑时双击一次，给新电脑装 uclaude 命令
  claude\install-uclaude.ps1    上面脚本的真身（被 cmd 调用，勿单独删）
  claude\claude-code\           Claude Code 本体（内含原生二进制）
  claude\portable-node\         便携 Node（备用运行时）
  claude\.claude\               配置 / 会话历史（settings.json 不含明文 token）
  claude\core\                  安全核心（勿删）
     ├─ .hash            访问密码哈希（scrypt）
     ├─ .cred            API 凭据（BaseURL/Token/Model，AES-256-GCM 加密）
     └─ _guard.js        密码校验 / 凭据加解密引擎

【快速开始】
  1. 插入 U 盘
  2. 双击 U 盘里的 install-uclaude.cmd（每台电脑只做这一次）
  3. 在项目文件夹上右键 →「在终端中打开」，新开一个终端，输入:
       uclaude
  4. 输入访问密码，验证通过即启动 —— 工作区就是当前文件夹
  没装 uclaude 也一样能用：直接运行  X:\claude\claude.bat
  （X 换成 U 盘实际盘符，F: / E: 均可，会自动适应）

【日常使用】
  在任意项目文件夹打开终端，然后：
    uclaude                    启动，工作区 = 当前文件夹
    uclaude --continue         接续上次会话
    uclaude -p "你的问题"       一次性提问
  记住两点：
  * 工作区 = 你打开终端时所在的目录，不是 U 盘目录本身
  * 不要通过双击 claude.bat 启动（双击会把工作区变成 U 盘自身）

【换电脑 / 新电脑】
  1. U 盘插到新电脑
  2. 双击 U 盘里的 install-uclaude.cmd，看到「uclaude installed」即可
  3. 新开终端，输入 uclaude
  uclaude 会自动扫描盘符找到 U 盘上的 claude.bat，盘符从 F: 变成 E: 也无需改动。
  API 凭据与会话历史都随 U 盘走，密码不变即可解密。换电脑后到相同路径的
  项目目录里执行  uclaude --resume  还能接续之前的会话。

【配置工具 config.bat】
  运行 X:\claude\config.bat，菜单：
    1. 修改 API 配置 —— 换 token / 换地址 / 换模型；输密码后先显示当前配置，
                       回车 = 保留原值，只改想改的字段
    2. 修改访问密码 —— 需先输入当前密码
    3. 查看当前配置 —— Token 打码显示
  首次运行会引导创建访问密码。config.bat 的密码输入以星号(*)回显。

【跨电脑续会话】
  会话历史存在 U 盘的 .claude\projects\。换电脑后，在相同路径的项目目录里
  启动并执行 uclaude --resume 即可接续之前的会话。

【安全说明】
  * 凭据已加密(core\.cred)，无密码无法解密；密码哈希(scrypt)抗暴力破解，
    建议使用较长密码（8 位以上混合字符），并结合 U 盘与密码分开保管
  * 忘记密码：删除 core\.hash 和 core\.cred，重新运行 config.bat 配置即可
  * 密码校验在内存中瞬时完成，不写入任何文件；明文 Token 不落盘
  * U 盘建议 exFAT 或 NTFS、USB 3.0+（当前 FAT32 亦可工作）
  * 首次运行会联网下载少量组件缓存到电脑用户目录，之后无感
  已知限制：启动入口（claude.bat / uclaude）的密码输入为明文显示，防肩窥有限；
  修改密码、API 等敏感操作请在 config.bat 中进行（星号回显）。