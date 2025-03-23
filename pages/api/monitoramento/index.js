import fs from 'fs';
import path from 'path';
import si from 'systeminformation';

// Caminho do arquivo metrics.json
const filePath = path.join(process.cwd(), 'metrics.json');

// Função para coletar métricas do sistema
const updateMetrics = async () => {
  try {
    console.log('🔄 Coletando métricas do sistema...');

    // Coletando informações do sistema
    const cpu = await si.currentLoad();
    const memory = await si.mem();
    const network = await si.networkStats();

    // Garantindo que os dados foram coletados corretamente
    if (!cpu || !memory || !network || network.length === 0) {
      throw new Error('Falha na coleta de métricas.');
    }

    // Criando objeto com métricas formatadas
    const metricsData = {
      cpuUsage: { value: cpu.currentLoad.toFixed(2) },
      memoryUsage: { value: ((memory.active / memory.total) * 100).toFixed(2) },
      networkSpeed: { value: (network[0].rx_bytes + network[0].tx_bytes).toFixed(2) },
    };

    console.log('✅ Métricas coletadas:', metricsData);

    // Salvando no arquivo JSON
    fs.writeFileSync(filePath, JSON.stringify(metricsData, null, 2), 'utf-8');
    console.log('💾 Métricas salvas em metrics.json');

    return metricsData;
  } catch (error) {
    console.error('❌ Erro ao coletar métricas:', error);
    throw error;
  }
};

// API Handler para retornar as métricas
export default async function handler(req, res) {
  try {
    console.log('📡 Requisição recebida para /api/monitoramento');

    // Atualiza as métricas antes de responder
    const metrics = await updateMetrics();

    // Retorna as métricas atualizadas
    res.status(200).json(metrics);
  } catch (error) {
    console.error('🚨 Erro interno na API:', error);
    res.status(500).json({ error: 'Erro ao coletar métricas.' });
  }
}
