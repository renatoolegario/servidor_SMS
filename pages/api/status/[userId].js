import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Parâmetro userId é obrigatório" });
  }

  const statusPath = path.join(process.cwd(), `conexoes/json/${userId}/status.json`);

  try {
    const statusData = await fs.readFile(statusPath, "utf-8");
    res.status(200).json(JSON.parse(statusData));
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({ error: "Arquivo status.json não encontrado" });
    }
    res.status(500).json({ error: "Erro ao ler status.json", detalhes: error.message });
  }
}
