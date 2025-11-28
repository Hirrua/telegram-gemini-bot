import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pg from 'pg';

const { Pool } = pg;

const EMBEDDING_DIMENSION = 768;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'medicoaqui',
  user: 'postgres',
  password: 'senha_docker',
});

export function getEmbeddingModel() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });
}

export async function getPgVectorStore() {
  const embeddings = getEmbeddingModel();

  const config = {
    postgresConnectionOptions: {
      host: 'localhost',
      port: 5433,
      database: 'medicoaqui',
      user: 'postgres',
      password: 'senha_docker',
    },
    tableName: 'embeddings',
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
      CREATE TABLE IF NOT EXISTS embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        metadata JSONB,
        embedding vector(${EMBEDDING_DIMENSION}),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_embedding_idx
      ON embeddings
      USING hnsw (embedding vector_cosine_ops)
    `);

    console.log('Database initialized successfully for RAG');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
