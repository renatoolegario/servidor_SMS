import { useEffect, useState } from 'react';
const memoriaPerBrowser = 1; // %


const Monitoramento = () => {
  const [activeTab, setActiveTab] = useState('monitoramento');
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState(null);
  const [servidoresPossiveis, setServidoresPossiveis] = useState(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoramento');
      if (!response.ok) {
        throw new Error(`Erro ao obter métricas: ${response.statusText}`);
      }
      const data = await response.json();
      
      setServidoresPossiveis(Math.floor((100 - data.memoryUsage.value) / memoriaPerBrowser));
      setMetrics(data);
      setLoadingMetrics(false);
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      setErrorMetrics(error.message);
      setLoadingMetrics(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch('/api/statusAEnviar');
      if (!response.ok) {
        throw new Error(`Erro ao obter mensagens: ${response.statusText}`);
      }
      const data = await response.json();
      setMessages(data);
      setLoadingMessages(false);
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      setErrorMessages(error.message);
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeTab === 'mensagens') {
      fetchMessages();
    }
  }, [activeTab]);

  return (
    <div className="p-6 font-sans">
      <div className="mb-6 flex space-x-4">
        <button className={`px-4 py-2 rounded ${activeTab === 'monitoramento' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`} onClick={() => setActiveTab('monitoramento')}>Monitoramento</button>
        <button className={`px-4 py-2 rounded ${activeTab === 'mensagens' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`} onClick={() => setActiveTab('mensagens')}>Mensagens</button>
      </div>
      {activeTab === 'monitoramento' ? (
        loadingMetrics ? (
          <div className="text-gray-500 text-xl">Carregando métricas...</div>
        ) : errorMetrics ? (
          <div className="text-red-500 text-xl">{errorMetrics}</div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Monitoramento do Servidor</h1>
            <div className="mb-4"><h2 className="text-xl font-semibold text-gray-700">Uso da CPU</h2><p className="text-lg text-gray-600">{metrics.cpuUsage.value}%</p></div>
            <div className="mb-4"><h2 className="text-xl font-semibold text-gray-700">Uso de Memória</h2><p className="text-lg text-gray-600">{metrics.memoryUsage.value}%</p></div>
            <div className="mb-4"><h2 className="text-xl font-semibold text-gray-700">Velocidade da Rede</h2><p className="text-lg text-gray-600">{metrics.networkSpeed.value} bytes/s</p></div>
            <div> Servidores Possíveis: {servidoresPossiveis}</div>
          </div>
        )
      ) : (
        loadingMessages ? (
          <div className="text-gray-500 text-xl">Carregando mensagens...</div>
        ) : errorMessages ? (
          <div className="text-red-500 text-xl">{errorMessages}</div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Mensagens Pendentes</h1>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">User ID</th>
                  <th className="border p-2">Mensagens Pendentes</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="border p-2 text-center text-gray-600">Nenhuma mensagem pendente</td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg.userId} className="border">
                      <td className="border p-2">{msg.userId}</td>
                      <td className="border p-2">{msg.pendingMessages}</td>
                      <td className={`border p-2 ${msg.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>{msg.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default Monitoramento;