# To-do List — Exercício 02 FCN

Aplicação de exemplo para o exercício de **Amazon Elastic Load Balancer** da disciplina Fundamentos de Computação em Nuvem (CESAR School).

## Conteúdo do pacote

| Arquivo | Descrição |
|---|---|
| `app.js` | Código-fonte da aplicação (Node.js + Express) |
| `package.json` | Dependências e metadados do projeto |
| `setup.sh` | Script de instalação manual em EC2 |
| `userdata.sh` | Script pronto para colar no campo **User Data** ao criar a instância EC2 |

## Como usar

### Opção 1 — User Data (recomendado)

Ao criar a instância EC2 no Console AWS:

1. Expanda **Advanced Details**
2. Cole o conteúdo de `userdata.sh` no campo **User data**
3. A aplicação sobe automaticamente na porta 80

### Opção 2 — Instalação manual via SSH

```bash
# Faça upload dos arquivos para a instância e execute:
chmod +x setup.sh
sudo ./setup.sh
```

### Opção 3 — Ambiente local (para testes)

```bash
npm install
npm run dev       # Roda na porta 3000
# Acesse: http://localhost:3000
```

## Endpoints

| Rota | Descrição |
|---|---|
| `GET /` | Interface da aplicação |
| `POST /add` | Adiciona uma tarefa |
| `GET /delete/:i` | Remove a tarefa de índice `i` |
| `GET /health` | Health check (usado pelo ALB) |

## Como verificar o balanceamento

A página exibe o **Instance ID** da instância EC2 que respondeu à requisição.
Ao acessar o DNS do ALB e recarregar a página várias vezes, o Instance ID deve alternar entre as duas instâncias — confirmando que o balanceamento está funcionando.

---
CESAR School — Fundamentos de Computação em Nuvem
