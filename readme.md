<h1 align="center">ChatBot AI Prescriptions</h1>

> ChatBot de ajuda com receitas medicas.

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

## :books: Funcionalidades

* <b>Chat Boot com telegram com recurso de IA</b>

## :wrench: Tecnologias utilizadas

* Node;
* Docker;
* PostgreSQL;
* LangChain;
* MCP;
* RAG;
* API Telegram;
* API Gemini;

## Dependências

- [Node](https://nodejs.org/pt) - 18+


## Instalação de projeto:

### Clonando e preparando repositório
1. Clone o repositório:
    ```sh
    $ git clone https://github.com/Hirrua/telegram-gemini-bot.git
    ```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui

# Google Gemini
GEMINI_API_KEY=sua_api_key_aqui

# Database
DATABASE_URL=postgresql://telegram_bot:telegram_bot_password@postgres:5432/telegram_bot
```

### :whale: Instalação por Docker (recomendada):

1. Instalar [docker](https://docs.docker.com/get-docker/) e o [docker-compose](https://docs.docker.com/compose/install/) no seu sistema.


2. Executando docker:
    ```sh
    $ docker-compose up -d
    ```

#### Executando comandos com docker:
Caso você precise executar alguma coisa e esteja utilizando docker, você precisará entrar no container:
```sh
$ docker exec -it telegram-bot-postgres bash
```

### Criar os Embeddings (IMPORTANTE)

**Após subir os containers, você precisa executar o processo de ingest para criar os embeddings dos documentos.**

Este comando deve ser executado **dentro do container** da aplicação:

```bash
docker exec -it telegram-bot-app npm run ingest:docker
```

**O que este comando faz:**
- Processa os PDFs da pasta `anvisa/`
- Cria chunks dos documentos usando RecursiveCharacterTextSplitter do LangChain
- Gera embeddings utilizando o modelo `text-embedding-004` do Google Gemini
- Armazena os vetores no PostgreSQL com pgvector
- Permite que o bot faça buscas semânticas nos documentos

**Quando executar:**
- Na primeira vez que subir o projeto
- Sempre que adicionar novos PDFs na pasta `anvisa/`
- Sempre que atualizar documentos existentes

### 4. Verificar se está funcionando

Verifique os logs do container:

```bash
docker logs -f telegram-bot-app
```

## Scripts Disponíveis

### Para uso com Docker:

```bash
# Subir os containers
docker-compose up -d

# Ver logs
docker logs -f telegram-bot-app

# Executar ingest dentro do container
docker exec -it telegram-bot-app npm run ingest:docker

# Parar os containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Para desenvolvimento local:

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar ingest local
npm run ingest

# Iniciar normalmente
npm start
```

## Acesso ao Banco de Dados

### Adminer (Interface Web)
- URL: http://localhost:8080
- Sistema: PostgreSQL
- Servidor: postgres
- Usuário: telegram_bot
- Senha: telegram_bot_password
- Base de dados: telegram_bot

### Conexão direta
- Host: localhost
- Porta: 5433
- Usuário: telegram_bot
- Senha: telegram_bot_password
- Database: telegram_bot
