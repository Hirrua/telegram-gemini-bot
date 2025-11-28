<h1 align="center">ChatBot AI Prescriptions</h1>

# :memo: ChatBot de ajuda com receitas medicas.

# :heavy_check_mark: Badges

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

## :books: Funcionalidades

* <b>Chat Boot com telegram com recurso de IA</b>

## :wrench: Tecnologias utilizadas

* Node;
* Docker;
* PostgreSQL;

## Dependências

- [Node](https://nodejs.org/pt) - 18+


## Instalação de projeto:

### Clonando e preparando repositório
1. Clone o repositório:
    ```sh
    $ git clone https://github.com/Hirrua/telegram-gemini-bot.git projectname
    ```

2. Criando arquivo `.env`:
Você pode fazer uma cópia a partir do `.env.example` e preencher as chaves

### :whale: Instalação por Docker (recomendada):

1. Instalar [docker](https://docs.docker.com/get-docker/) e o [docker-compose](https://docs.docker.com/compose/install/) no seu sistema.


2. Executando docker:
    ```sh
    $ docker-compose -f docker-compose.yml up
    ```

#### Executando comandos com docker:
Caso você precise executar alguma coisa e esteja utilizando docker, você precisará entrar no container:
```sh
$ docker exec -it telegram-bot-postgres bash
```

### :rocket: Instalação alternativa:
1. Instalar dependências e criando ambiente:

    ```sh
    $ cd projectname
    $ npm i # cria ambiente node_modules
    ```

3. Executando a aplicação:

    ```sh
    $ node index.js /# executa o projeto com as envs configuradas
    ```

### Observação sobre Docker Compose
Ao executar o projeto com `docker-compose -f docker-compose.yml up`, ele será exeutado.

## :on: Formatação de código

### Ferramentas utilizadas:
Usamos algumas ferramentas para manter um certo padrão de código entre os desenvolvedores, sendo elas:
- eslit: Formatação de código

## 💪 Como contribuir para o projeto
 
1. Crie uma nova branch a partir da `main` com as suas alterações:
   1. `git checkout main`
   2. `git pull origin main`
   3. `git checkout -b {release_name}`
2. Salve as alterações e crie uma mensagem de commit contando o que você fez: `git commit -m "feature: My new feature"`
3. Envie as suas alterações: `git push origin {release_name}`
