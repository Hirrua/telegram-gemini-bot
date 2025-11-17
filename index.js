require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')

const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

const chatSessions = {}

async function askGemini(prompt, chatId) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    if (!chatSessions[chatId]) {
      chatSessions[chatId] = model.startChat({
        history: [],
      })
    }

    const chat = chatSessions[chatId]
    const result = await chat.sendMessage(prompt)
    const response = await result.response
    return response.text()

  } catch (error) {
    console.error("Erro ao chamar Gemini (SDK):", error)
    return "Erro ao consultar a IA."
  }
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const userText = msg.text

  if (userText.startsWith("/new")) {
    delete chatSessions[chatId]
    bot.sendMessage(chatId, "Olá estou aqui para auxiliar em suas dúvidas em relação ao seu receituário!")
    return
  }

  await bot.sendChatAction(chatId, 'typing')

  const resposta = await askGemini(userText, chatId)

  bot.sendMessage(chatId, resposta)
})

console.log("Bot do Telegram rodando com o SDK do Gemini")