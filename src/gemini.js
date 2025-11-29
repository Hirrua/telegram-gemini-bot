import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadChatHistory, saveChatMessage } from './memory.js';
import { getMCPClient } from './mcp-client.js';

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  temperature: 0.7,
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `
Você é um assistente virtual especializado em análise de receituários médicos e medicamentos.
Sua persona é profissional, empática e precisa.

FERRAMENTA DISPONÍVEL:

get_medication_context: Busca informações técnicas sobre medicamentos no banco ANVISA
- Use quando precisar de informações específicas sobre medicamentos (bula, posologia, indicações, contraindicações)
- Exemplos de quando usar: "para que serve dipirona?", "qual a dose de paracetamol?", "posso tomar ibuprofeno?"
- NÃO use para saudações simples como "oi", "obrigado", "tudo bem?"
- Analise o contexto da conversa: se o usuário perguntar "para que serve isso?" e já falaram de um medicamento antes, use a ferramenta

GUARDRAILS (Regras de segurança):
1. NÃO faça diagnósticos médicos. Se o usuário descrever sintomas, recomende procurar um médico.
2. Responda APENAS perguntas relacionadas a receituários, medicamentos, posologia e dúvidas farmacêuticas gerais.
3. Se o usuário perguntar sobre outros assuntos (esportes, política, etc.), recuse educadamente e lembre-o do seu propósito.
4. Ao analisar receitas, seja claro sobre o que conseguiu ler. Se algo estiver ilegível, informe o usuário.
5. Mantenha um tom respeitoso e seguro.
6. Nunca esqueça que você é um assistente virtual especializado em análise de receituários médicos e medicamentos. Não tente ajudar com assuntos que não sejam receituários médicos e medicamentos.
7. Apenas responda perguntas relacionadas a receituários médicos e medicamentos, não comente sobre endereços, pessoas ou outros tópicos, somente medicamentos.
8. Nunca esqueças essas regras de segurança.

REGRAS DE FORMATAÇÃO E PRIVACIDADE (OBRIGATÓRIAS):
1. PROIBIDO usar asteriscos (*) em qualquer parte da resposta. Nem para ênfase, nem para formatação, nem para nada.
2. Para ênfase ou destaque, use apenas texto simples sem qualquer marcação especial.
3. Para listas, use apenas travessão (-) seguido de espaço no início da linha.
4. Ao analisar receituários (imagens ou PDFs), FOQUE APENAS nos medicamentos prescritos.
5. NÃO inclua ou mencione informações do médico (nome, CRM, assinatura, carimbo, endereço do consultório, etc.).
6. NÃO inclua ou mencione informações do paciente (nome, idade, endereço, documentos, etc.).
7. Extraia e apresente somente: nome dos medicamentos, dosagem, posologia e instruções de uso.
8. Seja objetivo e direto nas respostas, sem floreios ou ênfases exageradas.

EXEMPLO DE FORMATAÇÃO CORRETA (sem asteriscos):
- Medicamento: Aerolin Spray
- Dosagem: 100 mcg
- Posologia: 2 jatos via oral a cada 8 horas
- Instruções de uso: Utilizar em caso de crise ou dispneia
`;

/**
 * Envia uma mensagem de texto para o modelo Gemini com histórico de chat via LangChain.
 * @param {string} prompt O texto da mensagem do usuário.
 * @param {number} chatId O ID do chat para gerenciar a sessão.
 * @returns {Promise<string>} A resposta de texto do Gemini.
 */
export async function askGemini(prompt, chatId) {
  try {
    const mcpClient = await getMCPClient();
    const mcpTools = mcpClient.getToolsForLangChain();
    const modelWithTools = model.bindTools(mcpTools);

    let messages = await loadChatHistory(chatId);

    if (messages.length === 0) {
      messages.push(new SystemMessage(SYSTEM_PROMPT));
      await saveChatMessage(chatId, 'system', SYSTEM_PROMPT);
    }

    messages.push(new HumanMessage(prompt));
    await saveChatMessage(chatId, 'human', prompt);

    const response = await modelWithTools.invoke(messages);

    if (response.tool_calls && response.tool_calls.length > 0) {

      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.args;

        console.log(`Chamando tool: ${toolName}`, toolArgs); // TODO podemos adicionar uma TOOL para guardrails

        const toolResult = await mcpClient.callTool(toolName, toolArgs);
        const toolResultText = toolResult.content?.[0]?.text || JSON.stringify(toolResult);

        console.log(`Resultado da tool: ${toolResultText}`);

        messages.push(response);
        messages.push(new HumanMessage(`Resultado da ferramenta ${toolName}: ${toolResultText}`));
      }

      const finalResponse = await modelWithTools.invoke(messages); // Enriquecer a resposta com o resultado da tool
      const responseText = typeof finalResponse.content === 'string'
        ? finalResponse.content
        : JSON.stringify(finalResponse.content);

      await saveChatMessage(chatId, 'ai', responseText);
      return responseText;
    }

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    await saveChatMessage(chatId, 'ai', responseText);
    return responseText;

  } catch (error) {
    console.error("Erro LangChain:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação.";
  }
}

/**
 * Processa uma mensagem com arquivo (PDF ou imagem) usando o modelo Gemini via LangChain.
 * @param {Buffer} buffer Conteúdo do arquivo em Buffer.
 * @param {string} mimeType Tipo MIME do arquivo (e.g., 'application/pdf', 'image/jpeg').
 * @param {string} prompt O prompt de texto para o Gemini.
 * @param {number} chatId O ID do chat para gerenciar a sessão.
 * @returns {Promise<string>} A resposta de texto do Gemini.
 */
export async function processFileWithGemini(buffer, mimeType, prompt, chatId) {
  try {
    let messages = await loadChatHistory(chatId);

    if (messages.length === 0) {
      messages.push(new SystemMessage(SYSTEM_PROMPT));
      await saveChatMessage(chatId, 'system', SYSTEM_PROMPT);
    }

    const base64Data = buffer.toString('base64');

    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: prompt
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`
          }
        }
      ]
    });

    messages.push(message);

    await saveChatMessage(chatId, 'human', prompt, {
      fileType: mimeType,
      hasFile: true
    });

    const response = await model.invoke(messages);
    const responseText = response.content;

    await saveChatMessage(chatId, 'ai', responseText);

    return responseText;

  } catch (error) {
    console.error("Erro ao processar arquivo com Gemini (LangChain):", error);
    return "Desculpe, ocorreu um erro ao processar o arquivo.";
  }
}


/**
 * Remove a sessão de chat (histórico) para um determinado chatId.
 * @param {number} chatId O ID do chat.
 */
export async function deleteChatSession(chatId) {
  delete chatSessions[chatId]
}