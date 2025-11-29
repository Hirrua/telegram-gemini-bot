import { retrieveRelevantContext, formatContextForPrompt } from '../../rag-retriever.js';

export const getMedicationContextTool = {
  name: 'get_medication_context',
  description: `Busca informações sobre medicamentos no banco de conhecimento ANVISA. 
  Use esta ferramenta quando precisar de informações técnicas sobre medicamentos para responder o usuário.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Pergunta ou termo de busca sobre medicamento/remédios'
      }
    },
    required: ['query']
  }
};

export async function handleGetMedicationContext(args) {
  const { query } = args;

  try {
    const relevantDocs = await retrieveRelevantContext(query);
    const formattedContext = formatContextForPrompt(relevantDocs);

    if (!formattedContext) {
      return {
        tem_contexto: false,
        contexto: '',
        justificativa: 'Nenhuma informação relevante encontrada no banco ANVISA'
      };
    }

    return {
      tem_contexto: true,
      contexto: formattedContext,
      justificativa: `Encontrados ${relevantDocs.length} documento(s) relevante(s) da base ANVISA`
    };
  } catch (error) {
    console.error('(get_medication_context) Error:', error);
    return {
      tem_contexto: false,
      contexto: '',
      justificativa: `Erro ao recuperar contexto: ${error.message}`
    };
  }
}
