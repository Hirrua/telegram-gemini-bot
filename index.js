import 'dotenv/config'
import { chatModel } from "./config/langchainConfig.js"
import TelegramBot from 'node-telegram-bot-api'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4 
    }
  }
})

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message)
})

bot.on('error', (error) => {
  console.error('Bot error:', error)
})

const chatSessions = {}

async function askGemini(prompt, chatId) {
  try {
    const result = await chatModel.invoke([
      new SystemMessage("Você é um assistente chamado MédicoAqui útil especializado em responder dúvidas sobre receituários médicos."),
      new HumanMessage(prompt)
    ])

    return result.content

  } catch (error) {
    return "Erro ao consultar a IA. Tente novamente mais tarde."
  }
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const userText = msg.text

  if (!userText) return

  await bot.sendChatAction(chatId, 'typing')

  try {
    const resposta = await askGemini(userText, chatId)
    
    if (!resposta || resposta.trim() === "") {
      bot.sendMessage(chatId, "Não foi gerada uma resposta.")
      return
    }

    await bot.sendMessage(chatId, resposta)
      .catch((err) => {
        bot.sendMessage(chatId, "Erro ao enviar resposta.")
      })

  } catch (error) {
    bot.sendMessage(chatId, "Erro interno no bot.")
  }
})