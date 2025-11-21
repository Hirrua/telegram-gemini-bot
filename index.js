require('dotenv').config()
const { startBot } = require('./src/bot')

startBot()

console.log("Bot do Telegram rodando com o SDK do Gemini (Suporte a Imagem e pdf)")