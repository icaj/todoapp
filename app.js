const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

const IMDS_BASE = 'http://169.254.169.254/latest';
const TOKEN_TTL = '21600';

let INSTANCE_ID = null;
let todos = [];

async function getImdsToken() {
  const response = await fetch(`${IMDS_BASE}/api/token`, {
    method: 'PUT',
    headers: {
      'X-aws-ec2-metadata-token-ttl-seconds': TOKEN_TTL
    },
    signal: AbortSignal.timeout(1000)
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter token IMDSv2: HTTP ${response.status}`);
  }

  return (await response.text()).trim();
}

async function getInstanceId() {
  try {
    const token = await getImdsToken();

    const res = await fetch(`${IMDS_BASE}/meta-data/instance-id`, {
      headers: {
        'X-aws-ec2-metadata-token': token
      },
      signal: AbortSignal.timeout(1000)
    });

    if (!res.ok) {
      throw new Error(`Falha ao obter instance-id: HTTP ${res.status}`);
    }

    return (await res.text()).trim();
  } catch (err) {
    console.warn(`Não foi possível obter o instance-id da EC2: ${err.message}`);
    return 'local-dev';
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const items = todos.map((t, i) => `
    <li class="todo-item">
      <span>${escapeHtml(t)}</span>
      <a href="/delete/${i}" class="delete-btn">✕</a>
    </li>
  `).join('');

  const instanceLabel = INSTANCE_ID || 'carregando...';

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>To-do List — FCN</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f0f4f8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 16px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
    }
    .card-header {
      background: #E8501A;
      padding: 24px 28px;
      color: white;
    }
    .card-header h1 { font-size: 1.5rem; font-weight: 700; }
    .instance-badge {
      margin-top: 8px;
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 0.75rem;
      font-family: monospace;
      letter-spacing: 0.03em;
    }
    .card-body { padding: 24px 28px; }
    .add-form { display: flex; gap: 8px; margin-bottom: 20px; }
    .add-form input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .add-form input:focus { border-color: #E8501A; }
    .add-form button {
      background: #E8501A;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .add-form button:hover { background: #c94316; }
    .todo-list { list-style: none; }
    .todo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f0f4f8;
      font-size: 0.95rem;
      color: #2d3748;
    }
    .todo-item:last-child { border-bottom: none; }
    .delete-btn {
      color: #cbd5e0;
      text-decoration: none;
      font-size: 0.85rem;
      padding: 4px 8px;
      border-radius: 4px;
      transition: color 0.2s, background 0.2s;
    }
    .delete-btn:hover { color: #e53e3e; background: #fff5f5; }
    .empty {
      color: #a0aec0;
      font-size: 0.9rem;
      text-align: center;
      padding: 20px 0;
    }
    .footer {
      margin-top: 24px;
      font-size: 0.75rem;
      color: #a0aec0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h1>📝 To-do List</h1>
      <span class="instance-badge">Instance: ${escapeHtml(instanceLabel)}</span>
    </div>
    <div class="card-body">
      <form class="add-form" method="POST" action="/add">
        <input type="text" name="task" placeholder="Nova tarefa..." required autofocus />
        <button type="submit">Adicionar</button>
      </form>
      <ul class="todo-list">
        ${items || '<li class="empty">Nenhuma tarefa ainda. Adicione uma acima!</li>'}
      </ul>
    </div>
  </div>
  <p class="footer">Fundamentos de Computação em Nuvem — CESAR School</p>
</body>
</html>`);
});

app.post('/add', (req, res) => {
  const task = (req.body.task || '').trim();
  if (task) {
    todos.push(task);
  }
  res.redirect('/');
});

app.get('/delete/:i', (req, res) => {
  const i = Number.parseInt(req.params.i, 10);
  if (!Number.isNaN(i) && i >= 0 && i < todos.length) {
    todos.splice(i, 1);
  }
  res.redirect('/');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    instance: INSTANCE_ID || 'carregando...'
  });
});

app.listen(PORT, () => {
  console.log(`To-do List rodando na porta ${PORT} | Instance: ${INSTANCE_ID || 'carregando...'}`);
});

getInstanceId()
  .then((id) => {
    INSTANCE_ID = id;
    console.log(`Instance ID resolvido: ${INSTANCE_ID}`);
  })
  .catch((err) => {
    console.warn(`Erro inesperado ao resolver instance-id: ${err.message}`);
    INSTANCE_ID = 'local-dev';
  });