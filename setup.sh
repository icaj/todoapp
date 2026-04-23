#!/bin/bash
# =============================================================
#  Script de instalação — To-do List FCN
#  Execute como root em uma instância Amazon Linux 2023 / Ubuntu
# =============================================================

set -e

echo ">>> Atualizando pacotes..."
if command -v dnf &>/dev/null; then
  dnf update -y
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
elif command -v apt-get &>/dev/null; then
  apt-get update -y
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo ">>> Node.js $(node -v) instalado"

APP_DIR="/opt/todoapp"
echo ">>> Copiando aplicação para $APP_DIR..."
mkdir -p "$APP_DIR"
cp app.js package.json "$APP_DIR/"
cd "$APP_DIR"

echo ">>> Instalando dependências..."
npm install --omit=dev

echo ">>> Iniciando aplicação..."
nohup node app.js > /var/log/todoapp.log 2>&1 &

echo ">>> Aplicação iniciada! Acesse http://<IP-DA-INSTANCIA>"
