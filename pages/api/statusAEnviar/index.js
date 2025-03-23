import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const mensagensDir = path.join(process.cwd(), 'mensagens/json');
    const conexoesDir = path.join(process.cwd(), 'conexoes/json');
    
    const users = fs.readdirSync(mensagensDir);
    
    const result = [];

    for (const userId of users) {


      const userPath = path.join(mensagensDir, userId);
      
      const mensagens = fs.readdirSync(userPath).length;
      
      let status = 'desconhecido';
      const statusPath = path.join(conexoesDir, userId, 'status.json');
      if (fs.existsSync(statusPath)) {
        const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        status = statusData.status || 'desconhecido';
      }

      console.log(userId, mensagens, status);

      result.push({ userId, pendingMessages: mensagens, status });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao processar mensagens:', error);
    res.status(500).json({ error: 'Erro ao processar mensagens.' });
  }
}
