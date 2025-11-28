import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
// Você precisará exportar ou inicializar o pool/conexão do seu database.js
// ... (Configuração da conexão com o banco) ... 

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
});

let vectorStore;

export async function initializeVectorStore() {
  // Use as configurações do seu PostgreSQL
  const dbConfig = { 
    // ... seus dados de conexão ...
  }; 
  
  vectorStore = await PGVectorStore.fromExistingIndex(embeddings, {
    tableName: "langchain_vectors",
    // ... Configurações adicionais de conexão ...
  });
  console.log("Vector Store inicializado para RAG.");
}

/**
 * Busca documentos relevantes no Vector Store.
 * @param {string} query Texto de busca (pergunta do usuário ou texto extraído da receita).
 * @returns {Promise<string>} O texto consolidado do contexto relevante.
 */
export async function getContextFromRAG(query) {
  if (!vectorStore) {
    throw new Error("Vector Store não inicializado. Chame initializeVectorStore primeiro.");
  }
  
  // Busca 3 pedaços de texto (chunks) mais semelhantes à query
  const results = await vectorStore.similaritySearch(query, 3); 
  
  // Converte os resultados em uma única string
  const context = results.map(doc => doc.pageContent).join("\n---\n");
  
  return context;
}