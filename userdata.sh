#!/bin/bash
# =============================================================
#  User Data Script — Cole este conteúdo no campo "User data"
#  ao criar a instância EC2 no Console AWS.
#  Compatível com Amazon Linux 2023.
# =============================================================

yum update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

mkdir -p /opt/todoapp
cat > /opt/todoapp/package.json << 'PKGJSON'
{
  "name": "fcn-todoapp",
  "version": "1.0.0",
  "dependencies": { "express": "^4.18.2" }
}
PKGJSON

cat > /opt/todoapp/app.js << 'APPJS'
const express = require('express');
const app = express();
const PORT = 80;

async function getInstanceId() {
  try {
    const res = await fetch('http://169.254.169.254/latest/meta-data/instance-id', {
      signal: AbortSignal.timeout(1000)
    });
    return await res.text();
  } catch { return 'unknown'; }
}

let INSTANCE_ID = 'carregando...';
getInstanceId().then(id => { INSTANCE_ID = id; });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let todos = [];

const escapeHtml = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

app.get('/', (req, res) => {
  const items = todos.map((t,i) => `<li style="padding:10px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between"><span>${escapeHtml(t)}</span><a href="/delete/${i}" style="color:#e53e3e;text-decoration:none">✕</a></li>`).join('');
  res.send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>To-do List</title>
  <style>body{font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:0 16px}
  h1{background:#E8501A;color:#fff;padding:20px;border-radius:8px 8px 0 0;margin:0}
  .badge{font-size:.75rem;font-family:monospace;background:rgba(255,255,255,.2);border-radius:20px;padding:3px 10px;display:inline-block;margin-top:6px}
  .body{background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:20px}
  form{display:flex;gap:8px;margin-bottom:16px}input{flex:1;padding:10px;border:2px solid #e2e8f0;border-radius:6px;font-size:.95rem}
  button{background:#E8501A;color:#fff;border:none;border-radius:6px;padding:10px 16px;cursor:pointer;font-weight:700}
  ul{list-style:none;padding:0;margin:0}</style></head>
  <body><h1>📝 To-do List<br><span class="badge">Instance: ${INSTANCE_ID}</span></h1>
  <div class="body"><form method="POST" action="/add"><input name="task" placeholder="Nova tarefa..." required/><button>Adicionar</button></form>
  <ul>${items || '<li style="color:#aaa;text-align:center;padding:16px">Nenhuma tarefa ainda.</li>'}</ul></div></body></html>`);
});
app.post('/add', (req,res) => { const t=(req.body.task||'').trim(); if(t) todos.push(t); res.redirect('/'); });
app.get('/delete/:i', (req,res) => { const i=parseInt(req.params.i); if(i>=0&&i<todos.length) todos.splice(i,1); res.redirect('/'); });
app.get('/health', (req,res) => res.status(200).json({status:'ok',instance:INSTANCE_ID}));
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
APPJS

cd /opt/todoapp && npm install --omit=dev
nohup node app.js > /var/log/todoapp.log 2>&1 &
