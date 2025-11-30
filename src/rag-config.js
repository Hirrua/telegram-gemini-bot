import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pg from 'pg';

const { Pool } = pg;

const EMBEDDING_DIMENSION = 768;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    modelName: "text-embedding-004",
  });
}

export async function getPgVectorStore() {
  const embeddings = getEmbeddingModel();

  const config = {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: 'Embedding',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
  };

  return await PGVectorStore.initialize(embeddings, config);
}

export function getDocumentSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 20,
  });
}

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    await client.query(`
      CREATE INDEX IF NOT EXISTS embedding_vector_idx
      ON "Embedding"
      USING hnsw (embedding vector_cosine_ops)
    `);

    console.log('Banco de dados RAG inicializado com sucesso.');
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
