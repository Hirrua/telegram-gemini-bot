/**
 * Converte um buffer de arquivo e seu MIME type em um objeto Part
 * para a API Gemini (inlineData).
 * @param {Buffer} buffer Conteúdo do arquivo.
 * @param {string} mimeType Tipo MIME do arquivo.
 * @returns {{ inlineData: { data: string, mimeType: string } }} Objeto Part para a API Gemini.
 */
export function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}