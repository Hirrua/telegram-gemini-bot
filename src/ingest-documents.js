import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { getEmbeddingModel, getDocumentSplitter, pool, initializeDatabase } from './rag-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANVISA_FOLDER = path.join(__dirname, '..', 'anvisa');

async function calculateFileHash(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function isDocumentAlreadyIngested(medicamento, contentHash) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT COUNT(*) FROM "Embedding"
       WHERE metadata->>'medicamento' = $1
       AND metadata->>'content_hash' = $2`,
      [medicamento, contentHash]
    );
    return parseInt(result.rows[0].count) > 0;
  } finally {
    client.release();
  }
}

async function ingestDocument(filePath, medicamento) {
  try {
    const contentHash = await calculateFileHash(filePath);

    if (await isDocumentAlreadyIngested(medicamento, contentHash)) {
      console.log(`Documento já ingerido: ${medicamento}/${path.basename(filePath)}`);
      return;
    }

    console.log(`Processando: ${medicamento}/${path.basename(filePath)}`);

    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    const splitter = getDocumentSplitter();
    const splitDocs = await splitter.splitDocuments(docs);

    const embeddings = getEmbeddingModel();
    const client = await pool.connect();

    try {
      for (const doc of splitDocs) {
        const embedding = await embeddings.embedQuery(doc.pageContent);

        const metadata = {
          medicamento: medicamento,
          file_name: path.basename(filePath),
          content_hash: contentHash,
          page: doc.metadata.loc?.pageNumber || 0,
        };

        await client.query(
          `INSERT INTO "Embedding" (id, content, metadata, embedding)
           VALUES ($1, $2, $3, $4)`,
          [randomUUID(), doc.pageContent, JSON.stringify(metadata), JSON.stringify(embedding)]
        );
      }

      console.log(`Documento ingerido com sucesso: ${medicamento}/${path.basename(filePath)} (${splitDocs.length} chunks)`);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
  }
}

async function ingestAllDocuments() {
  try {
    await initializeDatabase();

    const medicamentos = await fs.readdir(ANVISA_FOLDER);

    for (const medicamento of medicamentos) {
      const medicamentoPath = path.join(ANVISA_FOLDER, medicamento);
      const stat = await fs.stat(medicamentoPath);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(medicamentoPath);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

      for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(medicamentoPath, pdfFile);
        await ingestDocument(pdfPath, medicamento);
      }
    }

    console.log('Ingestão completa!');
  } catch (error) {
    console.error('Erro durante a ingestão:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestAllDocuments()
    .then(() => {
      console.log('Processo finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

export { ingestAllDocuments, ingestDocument };
