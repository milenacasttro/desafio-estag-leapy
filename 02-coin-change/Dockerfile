# Usa a imagem oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários
COPY package.json ./
COPY runner.yml ./
COPY solution.js ./

# Instala as dependências (se houver)
RUN npm install --production

# O comando padrão será sobrescrito pelo runner.yml
# Mas definimos aqui para garantir que o Node.js está disponível
CMD ["node", "solution.js"]

