import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleGetMedicationContext } from './tools/get-medication-context.js';
import { handleCheckInput, handleCheckOutput } from './tools/guardrails.js';
import { fileURLToPath } from 'url';

export class MCPMedicationServer {
  constructor() {
    this.server = new McpServer(
      {
        name: 'telegram-medical-bot-medication',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.registerTool(
      'get_medication_context',
      {
        description: 'Busca informações sobre medicamentos no banco de conhecimento ANVISA. Use esta ferramenta quando precisar de informações técnicas sobre medicamentos para responder o usuário.',
        inputSchema: z.object({
          query: z.string().describe('Pergunta ou termo de busca sobre medicamento/remédios')
        })
      },
      async (args) => {
        try {
          console.error(`(MCP) Tool chamada: get_medication_context`);
          console.error(`(MCP) Args: ${JSON.stringify(args, null, 2)}`);

          const result = await handleGetMedicationContext(args);

          console.error(`(MCP) Resultado: ${JSON.stringify(result, null, 2)}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          console.error(`(MCP) Erro ao chamar tool:`, error);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: error.message,
                  stack: error.stack
                })
              }
            ],
            isError: true
          };
        }
      }
    );
    this.server.registerTool(
      'check_input',
      {
        description: 'ANALISADOR DE SEGURANÇA (ENTRADA): Verifica intenção do usuário. Use no início.',
        inputSchema: z.object({
          userMessage: z.string().describe('A mensagem original enviada pelo usuário')
        })
      },
      async (args) => {
        console.error(`(MCP) Tool chamada: check_input`);
        const result = await handleCheckInput(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );
    this.server.registerTool(
      'check_output',
      {
        description: 'ANALISADOR DE SEGURANÇA (SAÍDA): Verifica a resposta final. Use antes de finalizar.',
        inputSchema: z.object({
          draftResponse: z.string().describe('A resposta candidata')
        })
      },
      async (args) => {
        console.error(`(MCP) Tool chamada: check_output`);
        const result = await handleCheckOutput(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('(MCP) Servidor remédios iniciado');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = new MCPMedicationServer();
  server.start().catch((err) => {
    console.error('Erro fatal no servidor MCP:', err);
    process.exit(1);
  });
}
