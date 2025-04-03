# Use a imagem oficial do Playwright com Ubuntu Focal
FROM mcr.microsoft.com/playwright:v1.41.0-focal

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package.json package-lock.json* ./

# Instala as dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Garante que os navegadores e dependências do Playwright estejam instalados
RUN npx playwright install && npx playwright install-deps

# Exponha a porta 3000 (a porta padrão do Next.js)
EXPOSE 3000

# Comando para iniciar em produção
CMD ["npm", "run", "dev"]

