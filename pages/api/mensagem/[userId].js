import fs from "fs/promises";
import path from "path";

// Função para criar arquivos JSON para cada mensagem
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { userId } = req.query; // Captura o userId via query
  const { mensagens } = req.body;

  if (!userId || !Array.isArray(mensagens)) {
    return res.status(400).json({ error: "Parâmetro userId e mensagens são obrigatórios e mensagens deve ser um array." });
  }

  const userMessagesPath = path.join(process.cwd(), `mensagens/json/${userId}`);

  try {
    // Cria o diretório para armazenar os arquivos JSON, se não existir
    await fs.mkdir(userMessagesPath, { recursive: true });

    let invalidMessages = 0; // Para contar mensagens inválidas

    // Processa cada mensagem
    for (const mensagem of mensagens) {
      const { telefone, mensagem: textoMensagem } = mensagem;

      if (!telefone || !textoMensagem) {
        invalidMessages++;
        continue; // Pula mensagens com dados inválidos
      }

      const filePath = path.join(userMessagesPath, `${telefone}.json`);

      const messageData = {
        telefone,
        mensagem: textoMensagem,
      };

      // Cria o arquivo JSON para cada telefone
      await fs.writeFile(filePath, JSON.stringify(messageData, null, 2));
    }

    // Se houver mensagens inválidas, retorna um alerta
    if (invalidMessages > 0) {
      return res.status(400).json({
        success: true,
        message: `${invalidMessages} mensagem(s) ignorada(s) devido a dados inválidos.`,
      });
    }

    return res.status(200).json({ success: true, message: "Mensagens processadas com sucesso." });
  } catch (error) {
    console.error("Erro ao processar as mensagens:", error);
    return res.status(500).json({ error: "Erro ao processar as mensagens", detalhes: error.message });
  }
}
