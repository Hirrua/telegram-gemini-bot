import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cliente MCP
 */
class MCPClientManager {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.tools = new Map();
  }

  /**
   * Servidor MCP
   */
  async connect() {
    try {
      const serverPath = join(__dirname, 'mcp-server', 'index.js');

      console.log(`(MCP Client) Iniciando servidor MCP em: ${serverPath}`);

      this.transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
        env: process.env
      });

      this.client = new Client({
        name: 'telegram-medical-bot',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.client.connect(this.transport);

      const { tools } = await this.client.listTools(); // Tools disponíveis no MCP
      tools.forEach(tool => {
        this.tools.set(tool.name, tool);
      });

      this.isConnected = true;
      console.log('(MCP Client) Conectado. Tools disponíveis:', Array.from(this.tools.keys()));

    } catch (error) {
      console.error('(MCP Client) Falha ao conectar:', error);
      throw error;
    }
  }

  /**
   * Chamando uma tool
   */
  async callTool(toolName, args) {
    if (!this.isConnected) {
      throw new Error('MCP client não conectado');
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });

      return result;
    } catch (error) {
      console.error(`(MCP client) Erro ao chamar tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Converte tools MCP para formato LangChain
   */
  getToolsForLangChain() {
    const langchainTools = [];

    for (const [name, toolDef] of this.tools) {
      langchainTools.push({
        name: name,
        description: toolDef.description,
        schema: toolDef.inputSchema,
        func: async (args) => {
          const result = await this.callTool(name, args);
          if (result.content && result.content.length > 0) {
            return result.content[0].text;
          }
          return JSON.stringify(result);
        }
      });
    }

    return langchainTools;
  }

  /**
   * Desconecta do servidor
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.transport) {
        await this.transport.close();
      }
      this.isConnected = false;
      console.log('(MCP client) Desconectado');
    } catch (error) {
      console.error('(MCP client) Erro ao desconectar:', error);
    }
  }
}

let mcpClient = null;

export async function getMCPClient() {
  if (!mcpClient) {
    mcpClient = new MCPClientManager();
    await mcpClient.connect();
  }
  return mcpClient;
}

export async function disconnectMCP() {
  if (mcpClient) {
    await mcpClient.disconnect();
    mcpClient = null;
  }
}
