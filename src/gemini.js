const { GoogleGenerativeAI } = require("@google/generative-ai")
const { fileToGenerativePart } = require('./utils')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const chatSessions = {}

/**
 * Envia uma mensagem de texto para o modelo Gemini com histórico de chat.
 * @param {string} prompt O texto da mensagem do usuário.
 * @param {number} chatId O ID do chat para gerenciar a sessão.
 * @returns {Promise<string>} A resposta de texto do Gemini.
 */
async function askGemini(prompt, chatId) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    if (!chatSessions[chatId]) {
      // Inicia uma nova sessão de chat se não existir
      chatSessions[chatId] = model.startChat({
        history: [],
      })
    }

    const chat = chatSessions[chatId]
    const result = await chat.sendMessage(prompt)
    return result.response.text()

  } catch (error) {
    console.error("Erro ao chamar Gemini (SDK):", error)
    return "Erro ao consultar a IA."
  }
}

/**
 * Processa uma mensagem com arquivo (PDF ou imagem) usando o modelo Gemini.
 * Não usa histórico de chat, pois é uma requisição multimídia pontual.
 * @param {Buffer} buffer Conteúdo do arquivo em Buffer.
 * @param {string} mimeType Tipo MIME do arquivo (e.g., 'application/pdf', 'image/jpeg').
 * @param {string} prompt O prompt de texto para o Gemini.
 * @returns {Promise<string>} A resposta de texto do Gemini.
 */
async function processFileWithGemini(buffer, mimeType, prompt) {
  try {
    const filePart = fileToGenerativePart(buffer, mimeType)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent([prompt, filePart])
    return result.response.text()

  } catch (error) {
    console.error("Erro ao processar arquivo com Gemini:", error)
    return "Desculpe, ocorreu um erro ao processar o arquivo."
  }
}

/**
 * Remove a sessão de chat (histórico) para um determinado chatId.
 * @param {number} chatId O ID do chat.
 */
function deleteChatSession(chatId) {
  delete chatSessions[chatId]
}

module.exports = {
  askGemini,
  processFileWithGemini,
  deleteChatSession
}