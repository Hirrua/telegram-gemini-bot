import { getPrisma } from './database.js';
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

export async function loadChatHistory(chatId) {
  try {
    const prisma = getPrisma();

    let chatSession = await prisma.chatSession.findUnique({
      where: { chatId: String(chatId) },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chatSession) { // se não existir, cria uma nova sessão
      chatSession = await prisma.chatSession.create({
        data: {
          chatId: String(chatId)
        },
        include: {
          messages: true
        }
      });
    }

    const messages = chatSession.messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'human':
          return new HumanMessage(msg.content);
        case 'ai':
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });

    return messages;

  } catch (error) {
    console.error('Erro ao carregar histórico do chat:', error);
    return [];
  }
}

/**
 * Salva uma mensagem no banco de dados.
 * @param {string} chatId - ID do chat do Telegram
 * @param {string} role - Papel da mensagem: 'system', 'human' ou 'ai'
 * @param {string} content - Conteúdo da mensagem
 * @param {object} metadata - Metadados opcionais (tipo de arquivo, etc)
 */
export async function saveChatMessage(chatId, role, content, metadata = null) {
  try {
    const prisma = getPrisma();

    let chatSession = await prisma.chatSession.findUnique({
      where: { chatId: String(chatId) }
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: { chatId: String(chatId) }
      });
    }

    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        role,
        content,
        metadata
      }
    });

  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
}
