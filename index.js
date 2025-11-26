import 'dotenv/config';
import { startBot } from './src/bot.js';
import { connectDatabase, disconnectDatabase } from './src/database.js';

await connectDatabase();

startBot();

console.log("Bot do Telegram rodando com o SDK do Gemini (Suporte a Imagem e pdf)");
console.log("Sistema de memória persistente com PostgreSQL ativado!");

process.on('SIGINT', async () => {
  console.log('\nEncerrando bot');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nEncerrando bot');
  await disconnectDatabase();
  process.exit(0);
});
