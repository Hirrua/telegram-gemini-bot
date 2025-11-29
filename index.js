import 'dotenv/config';
import { startBot } from './src/bot.js';
import { connectDatabase, disconnectDatabase } from './src/database.js';
import { getMCPClient, disconnectMCP } from './src/mcp-client.js';

await connectDatabase();

try {
  await getMCPClient();
  console.log("MCP conectado com sucesso!");
} catch (error) {
  console.error("Falha ao conectar o MCP", error);
}

startBot();

console.log("Bot do Telegram rodando com o SDK do Gemini (Suporte a Imagem e pdf)");
console.log("Sistema de memória persistente com PostgreSQL ativado!");

process.on('SIGINT', async () => {
  console.log('\nEncerrando bot');
  await disconnectMCP();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nEncerrando bot');
  await disconnectMCP();
  await disconnectDatabase();
  process.exit(0);
});
