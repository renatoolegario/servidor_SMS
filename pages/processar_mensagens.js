
import { useState, useEffect } from 'react';

const memoriaPerBrowser = 1; // % de memória por servidor
const limiteEnvio = 10; // Quantidade de mensagens por requisição

const ProcessarMensagens = () => {
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState(null);
  const [servidoresPossiveis, setServidoresPossiveis] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);

  
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoramento');
      if (!response.ok) {
        throw new Error(`Erro ao obter métricas: ${response.statusText}`);
      }
      const data = await response.json();
      setServidoresPossiveis(Math.floor((100 - data.memoryUsage.value) / memoriaPerBrowser));
      setMetrics(data);

      console.log(data);
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
      let users = data;

      console.log(data);
      users = users.filter((u) => u.pendingMessages > 0 && u.status === 'autenticado');
     
      const usuariosMaiorParaMenor = [...users].sort((a, b) => b.pendingMessages - a.pendingMessages);
      const usuariosMenorParaMaior = [...users].sort((a, b) => a.pendingMessages - b.pendingMessages);
     

      const metadeServidores = Math.ceil(servidoresPossiveis / 2);
      const grupoA = usuariosMaiorParaMenor.slice(0, metadeServidores);
      const grupoB = usuariosMenorParaMaior.slice(0, metadeServidores);

      const idsGrupoA = new Set(grupoA.map((u) => u.userId));
      const grupoBLimpo = grupoB.filter((u) => !idsGrupoA.has(u.userId));

      const usuariosFinal = [...grupoA, ...grupoBLimpo];
      console.log(`Usuários selecionados: ${usuariosFinal.length}`);
      console.log(usuariosFinal);

      await Promise.all(
        usuariosFinal.map(async (user) => {
          const url = `/api/sender/${user.userId}?limite=${limiteEnvio}`;
          try {
            const response = await fetch(url, { method: 'POST' });
            if (!response.ok) {
              throw new Error(`Erro na API: ${response.status}`);
            }
            console.log(`Chamado: ${url} - Status: ${response.status}`);
          } catch (error) {
            console.error(`Erro ao chamar API para ${user.userId}:`, error);
          }
        })
      );


      setLoadingMessages(false);
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      setErrorMessages(error.message);
      setLoadingMessages(false);
    }
  };

  // Carrega métricas e mensagens ao montar o componente
  useEffect(() => {
    fetchMetrics();
    fetchMessages();
  }, []);

  

  // UI básica
  return (
    <div>
      <h1>Processamento de Mensagens</h1>
    </div>
  );
}


export default ProcessarMensagens;