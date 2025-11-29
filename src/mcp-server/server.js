import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  getMedicationContextTool,
  handleGetMedicationContext
} from './tools/get-medication-context.js';

export class MCPMedicationServer {
  constructor() {
    this.server = new Server(
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

    this.setupHandlers();
  }

  setupHandlers() {

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [getMedicationContextTool]
      };
    });


    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        if (name === 'get_medication_context') {
          result = await handleGetMedicationContext(args);
        } else {
          throw new Error(`Tool desconhecida: ${name}`);
        }

        console.error(`(MCP) Tool chamada: ${name}`);
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
        console.error(`(MCP) Erro ao chamar tool ${name}:`, error);

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
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('(MCP) Servidor remédios iniciado');
  }
}
