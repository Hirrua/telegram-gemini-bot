import TelegramBot from 'node-telegram-bot-api';
import { askGemini, processFileWithGemini } from './gemini.js';

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4 
    }
  }
})

/**
 * Processa mensagens com arquivos PDF.
 */
async function processPdfMessage(msg) {
  const chatId = msg.chat.id
  const document = msg.document

  try {
    await bot.sendChatAction(chatId, 'typing')

    const fileId = document.file_id

    const prompt = `Este arquivo é um receituário em PDF.
                    Extraia somente os medicamentos usando OCR, descreva os itens da prescrição e pergunte ao usuário o que deseja saber sobre a receita.
                    Não inclua informações sobre o paciente ou o médico, foque apenas nos medicamentos prescritos.
                    Mantenha a resposta focada no tema de receituários.`

    const fileLink = await bot.getFileLink(fileId)
    const buffer = await downloadFileWithRetry(fileLink, 3, 60000) // 60s timeout para PDFs maiores

    const resposta = await processFileWithGemini(buffer, "application/pdf", prompt, chatId)
    return bot.sendMessage(chatId, resposta)

  } catch (error) {
    console.error("Erro ao processar PDF:", error)
    return bot.sendMessage(chatId, "Desculpe, ocorreu um erro ao processar o PDF.")
  }
}

async function downloadFileWithRetry(fileLink, maxRetries = 3, timeout = 30000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(fileLink, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TelegramBot/1.0'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)

    } catch (error) {
      console.error(`Tentativa ${attempt} falhou:`, error.message)

      if (attempt === maxRetries) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

async function processPhotoMessage(msg) {
  const chatId = msg.chat.id

  try {
    const photo = msg.photo[msg.photo.length - 1]
    const fileId = photo.file_id
    const caption = msg.caption || "Qual é o conteúdo desta imagem?"

    const fileLink = await bot.getFileLink(fileId)
    const buffer = await downloadFileWithRetry(fileLink)

    let mimeType = 'image/jpeg'
    if (photo.mime_type) {
      mimeType = photo.mime_type
    } else if (photo.width < 1000) {
      mimeType = 'image/png'
    }

    const prompt = `Analise esta imagem, que é um receituário. Responda à pergunta: "${caption}". Se a pergunta for genérica, descreva o que você conseguiu ler da receita (use OCR) e pergunte o que o usuário deseja saber. Mantenha a resposta focada no tema de receituários.`

    const resposta = await processFileWithGemini(buffer, mimeType, prompt, chatId)
    return bot.sendMessage(chatId, resposta)

  } catch (error) {
    console.error("Erro ao processar imagem:", error)
    return bot.sendMessage(chatId, "Ocorreu um erro ao tentar processar a imagem. Tente novamente.")
  }
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const userText = msg.text

  if (!userText && !msg.photo && !msg.document) {
    if (msg.sticker || msg.video || msg.animation || msg.document?.mime_type !== "application/pdf") {
      return bot.sendMessage(chatId, "Desculpe, só consigo processar texto, imagens e pdf de receituário.")
    }
    return
  }

  if (userText && userText.startsWith("/new")) {
    deleteChatSession(chatId)
    bot.sendMessage(chatId, "Olá! Novo chat iniciado. Estou aqui para auxiliar em suas dúvidas em relação ao seu receituário!")
    return
  }

  await bot.sendChatAction(chatId, 'typing')

  let resposta = ""

  if (msg.document && msg.document.mime_type === "application/pdf") {
    return processPdfMessage(msg)
  }
  else if (msg.photo) {
    return processPhotoMessage(msg)
  }
  else if (userText) {
    resposta = await askGemini(userText, chatId)
  }

  if (resposta.trim().length > 0) {
    bot.sendMessage(chatId, resposta)
  }
})

export function startBot() {
}