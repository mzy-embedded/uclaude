// _guard.js — Claude Code 便携版：访问密码 + API 凭据加密
// 子命令:
//   setpwd           设置/修改访问密码 (交互, 密码不回显)
//   setapi           修改 API BaseURL/Token/Model (交互)
//   show             查看当前配置 (Token 打码)
//   check            <stdin第一行=密码> 校验, 通过退出码0
//   dump             <stdin第一行=密码> 校验+解密, 输出 ENV 行 (VAR=value)
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const HASH_FILE = path.join(DIR, '.hash');
const STORE_FILE = path.join(DIR, '.cred');

/* ---------- 密码哈希 (scrypt) ---------- */
function hashPwd(pwd) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(pwd, salt, 32);
  fs.writeFileSync(HASH_FILE, `${salt.toString('hex')}$${dk.toString('hex')}`, 'utf8');
}
function checkPwd(pwd) {
  try {
    const [saltH, dkH] = fs.readFileSync(HASH_FILE, 'utf8').trim().split('$');
    const dk = crypto.scryptSync(pwd, Buffer.from(saltH, 'hex'), 32);
    return crypto.timingSafeEqual(Buffer.from(dkH, 'hex'), dk);
  } catch { return false; }
}

/* ---------- API 凭据加密 (AES-256-GCM) ---------- */
function encApi(pwd, api) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(pwd, salt, 32);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(api), 'utf8'), c.final()]);
  fs.writeFileSync(STORE_FILE,
    [salt.toString('base64'), iv.toString('base64'), c.getAuthTag().toString('base64'), ct.toString('base64')].join('$'), 'utf8');
}
function decApi(pwd) {
  if (!fs.existsSync(STORE_FILE)) return null;
  try {
    const [s, i, t, ct] = fs.readFileSync(STORE_FILE, 'utf8').trim().split('$');
    const key = crypto.scryptSync(pwd, Buffer.from(s, 'base64'), 32);
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(i, 'base64'));
    d.setAuthTag(Buffer.from(t, 'base64'));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]));
  } catch { return null; }
}

/* ---------- 输入辅助 ---------- */
function readStdinAll() {
  try { return fs.readFileSync(0, 'utf8').split(/\r?\n/); } catch { return []; }
}
let pipeLines = null;
function pipeLine() { // 非TTY: 一次性读入stdin, 逐行消费 (bat管道/测试)
  if (pipeLines === null) {
    let raw = '';
    try { raw = fs.readFileSync(0, 'utf8'); } catch { /* ignore */ }
    pipeLines = raw.split(/\r?\n/);
    while (pipeLines.length && pipeLines[pipeLines.length - 1] === '') pipeLines.pop();
  }
  return pipeLines.length ? pipeLines.shift() : '';
}
function prompt(q, def) { // TTY 明文输入(带默认值); 非TTY走管道
  if (!process.stdin.isTTY) {
    const v = pipeLine();
    return Promise.resolve(v === '' ? (def || '') : v);
  }
  process.stdout.write(q + (def ? ' [当前: ' + def + ']' : '') + ' ');
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', (a) => { rl.close(); resolve(a.trim() === '' ? (def || '') : a); });
  });
}
function promptHidden(q) { // TTY 隐藏输入(星号回显); 非TTY走管道
  if (!process.stdin.isTTY) return Promise.resolve(pipeLine());
  process.stdout.write(q + ' ');
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let buf = '';
    try { stdin.setRawMode(true); } catch { return prompt(q).then(resolve); }
    stdin.resume();
    const onData = (chunk) => {
      for (const b of chunk) {
        if (b === 3) { cleanup(); process.exit(130); }
        else if (b === 13 || b === 10) { process.stdout.write('\n'); cleanup(); resolve(buf); }
        else if (b === 8 || b === 127) {
          if (buf.length) { buf = buf.slice(0, -1); process.stdout.write('\b \b'); }
        }
        else { buf += String.fromCharCode(b); process.stdout.write('*'); }
      }
    };
    function cleanup() { stdin.off('data', onData); stdin.setRawMode(false); stdin.pause(); }
    stdin.on('data', onData);
  });
}

/* ---------- 子命令 ---------- */
async function cmdSetApi() {
  let pwd, old = null;
  if (fs.existsSync(HASH_FILE)) {
    pwd = await promptHidden('当前访问密码:');
    if (!checkPwd(pwd)) { console.log('✗ 密码错误'); process.exit(1); }
    old = decApi(pwd);
    console.log('');
    console.log('当前配置:');
    console.log('  Base URL : ' + ((old && old.base) || ''));
    console.log('  Token    : ' + (old && old.token ? mask(old.token) : ''));
    console.log('  Model    : ' + ((old && old.model) || ''));
    console.log('  (直接回车 = 保留原值)');
    console.log('');
  } else { // 首次: 引导创建密码
    const np1 = await promptHidden('新访问密码(此前未设置):');
    const np2 = await promptHidden('再次输入新密码  :');
    if (np1 !== np2 || np1.length === 0) { console.log('✗ 两次输入不一致或密码为空'); process.exit(1); }
    hashPwd(np1);
    pwd = np1;
  }
  const defToken = (old && old.token) ? mask(old.token) : '';
  const api = {
    base:  await prompt('API Base URL:', (old || {}).base || ''),
    token: await prompt('Token(回车保留):', defToken),
    model: await prompt('默认模型(可留空):', (old || {}).model || ''),
  };
  if (old && old.token && api.token === defToken) api.token = old.token; // 打码默认值→保留原值
  encApi(pwd, api);
  console.log('✓ API 配置已加密保存.');
}

async function cmdSetPwd() {
  if (!fs.existsSync(HASH_FILE) && fs.existsSync(STORE_FILE)) {
    console.log('✗ 无密码但存在旧凭据, 请用 install.bat 的重置功能或先重置 API 配置');
    process.exit(1);
  }
  let oldData = null;
  if (fs.existsSync(HASH_FILE)) {
    const old = await promptHidden('当前访问密码:');
    if (!checkPwd(old)) { console.log('✗ 密码错误'); process.exit(1); }
    if (fs.existsSync(STORE_FILE)) {
      oldData = decApi(old);
      if (!oldData) { console.log('✗ 凭据文件无法用当前密码解密'); process.exit(1); }
    }
  }
  const p1 = await promptHidden('新密码:');
  const p2 = await promptHidden('再次输入新密码:');
  if (p1 !== p2 || p1.length === 0) { console.log('✗ 两次输入不一致或密码为空'); process.exit(1); }
  hashPwd(p1);
  if (oldData) encApi(p1, oldData); // 用新密码重加密现有凭据
  console.log('✓ 访问密码已更新.');
}

function stdinPwd() {
  const all = readStdinAll();
  return (all[0] || '').trim();
}
function dumpEnv(api, pwd) {
  const out = [];
  if (api.base) out.push('ANTHROPIC_BASE_URL=' + api.base);
  if (api.token) out.push('ANTHROPIC_AUTH_TOKEN=' + api.token);
  if (api.model) {
    out.push('ANTHROPIC_MODEL=' + api.model);
    out.push('ANTHROPIC_DEFAULT_HAIKU_MODEL=' + api.model);
    out.push('ANTHROPIC_DEFAULT_SONNET_MODEL=' + api.model);
    out.push('ANTHROPIC_DEFAULT_OPUS_MODEL=' + api.model);
  }
  process.stdout.write(out.join('\n'));
}
function mask(t) {
  if (!t) return '(未设置)';
  if (t.length <= 12) return t[0] + '***' + t[t.length - 1];
  return t.slice(0, 10) + '...(长度' + t.length + ')...' + t.slice(-4);
}

(async () => {
  const cmd = process.argv[2];
  switch (cmd) {
    case 'setapi': await cmdSetApi(); break;
    case 'setpwd': await cmdSetPwd(); break;
    case 'reset': { // 出厂重置: 密码=123456, 删除API配置
      if (fs.existsSync(HASH_FILE)) fs.unlinkSync(HASH_FILE);
      if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
      hashPwd('123456');
      console.log('✓ 密码已重置为 123456');
      console.log('✓ API 配置已删除');
      break;
    }
    case 'show': {
      const pwd = stdinPwd();
      const api = decApi(pwd);
      if (!api) { console.log('✗ 密码错误或未配置'); process.exit(1); }
      console.log('Base URL : ' + api.base);
      console.log('Token    : ' + mask(api.token));
      console.log('Model    : ' + (api.model || '(未设置)'));
      break;
    }
    case 'check': {
      if (!fs.existsSync(HASH_FILE)) { console.log('✗ 尚未设置密码, 请运行 config.bat'); process.exit(2); }
      process.exit(checkPwd(stdinPwd()) ? 0 : 1);
      break;
    }
    case 'dump': {
      if (!fs.existsSync(HASH_FILE)) { console.log('✗ 尚未设置密码, 请运行 config.bat'); process.exit(2); }
      const pwd = stdinPwd();
      if (!checkPwd(pwd)) { console.log('✗ 密码错误'); process.exit(1); }
      const api = decApi(pwd);
      if (!api) { console.log('✗ 凭据解密失败'); process.exit(1); }
      if (api.token) dumpEnv(api, pwd);
      break;
    }
    default:
      console.log('用法: node _guard.js <setpwd|setapi|show|check|dump>');
      process.exit(1);
  }
})().catch((e) => { console.error('错误:', e.message); process.exit(1); });