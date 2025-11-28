import { getEmbeddingModel, pool } from './rag-config.js';

const MAX_RESULTS = 5;
const MIN_SCORE = 0.6;

export async function retrieveRelevantContext(query) {
  const embeddings = getEmbeddingModel();
  const client = await pool.connect();

  try {
    const queryEmbedding = await embeddings.embedQuery(query);

    const result = await client.query(
      `SELECT
        content,
        metadata,
        1 - (embedding <=> $1::vector) AS similarity
       FROM embeddings
       WHERE 1 - (embedding <=> $1::vector) >= $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [JSON.stringify(queryEmbedding), MIN_SCORE, MAX_RESULTS]
    );

    const contexts = result.rows.map(row => ({
      content: row.content,
      metadata: row.metadata,
      score: row.similarity,
    }));

    console.log(`=== Conteúdos recuperados para a query: "${query}" ===`);
    contexts.forEach((ctx, idx) => {
      console.log(`[${idx + 1}] Score: ${ctx.score.toFixed(3)} | Medicamento: ${ctx.metadata.medicamento}`);
      console.log(`    Conteúdo: ${ctx.content.substring(0, 100)}`);
    });

    return contexts;

  } catch (error) {
    console.error('Erro ao recuperar contexto:', error);
    return [];
  } finally {
    client.release();
  }
}

export function formatContextForPrompt(contexts) {
  if (!contexts || contexts.length === 0) {
    return '';
  }

  let formattedContext = '\n\nCONTEXTO DA BASE DE CONHECIMENTO (BULAS ANVISA):\n';
  formattedContext += '=' .repeat(60) + '\n';

  contexts.forEach((ctx, idx) => {
    formattedContext += `\n[Documento ${idx + 1}] - ${ctx.metadata.medicamento}\n`;
    formattedContext += `${ctx.content}\n`;
    formattedContext += '-'.repeat(60) + '\n';
  });

  return formattedContext;
}
