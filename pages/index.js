import { useEffect, useState } from "react";

export default function Home() {
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conexao");
  const [telefones, setTelefones] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [statusEnvio, setStatusEnvio] = useState(null);

  useEffect(() => {
    // Função para gerar o QR Code
    const generateQRCode = async () => {
      try {
        const res = await fetch("/api/qrcode/123");
        if (!res.ok) {
          throw new Error("Erro ao gerar QR Code");
        }
        console.log("QR Code gerado com sucesso");
      } catch (err) {
        console.error("Erro ao iniciar API para gerar QR Code:", err);
      }
    };

    // Função para buscar o status
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status/123");
        const data = await res.json();
        console.log("Status atualizado:", data);

        setStatusData(data);
        setIsLoading(false);

        // Para de monitorar se já está autenticado ou se houve erro
        if (data.status === "autenticado" || data.status === "erro") {
          clearInterval(statusInterval);
        }
      } catch (err) {
        console.error("Erro ao buscar status:", err);
        setIsLoading(false); // Para o carregamento em caso de erro
      }
    };

    // Chama a geração do QR Code
    generateQRCode();

    // Verifica status a cada 2 segundos
    const statusInterval = setInterval(fetchStatus, 2000);

    // Cleanup: Para o intervalo ao desmontar o componente
    return () => clearInterval(statusInterval);
  }, []);

  // Função para enviar a nova mensagem
  const enviarMensagem = async () => {
    const telefonesArray = telefones.split(/[,;]\s*/); // Divide os telefones por vírgula ou ponto e vírgula
    if (!mensagem || mensagem.length > 140) {
      alert("A mensagem deve ter no máximo 140 caracteres.");
      return;
    }

    const payload = {     
      mensagens: telefonesArray.map((telefone) => ({
        telefone: telefone.trim(),
        mensagem: mensagem,
      })),
    };

    try {
      const res = await fetch("/api/mensagem/123", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusEnvio({ sucesso: true, mensagem: "Mensagens enviadas com sucesso!" });
      } else {
        setStatusEnvio({ sucesso: false, mensagem: data.error || "Erro ao enviar as mensagens." });
      }
    } catch (err) {
      setStatusEnvio({ sucesso: false, mensagem: "Erro ao conectar com o servidor." });
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  // Exibe o conteúdo de "Conexão" ou "Nova Mensagem" dependendo da aba ativa
  const renderTabContent = () => {
    if (activeTab === "conexao") {
      if (isLoading) {
        return <p>Carregando...</p>;
      }

      if (!statusData) {
        return <p>Erro ao carregar o status.</p>;
      }

      return (
        <div>
          <h1>Status da Conexão</h1>
          <p><strong>Status:</strong> {statusData.status}</p>
          <p><strong>Mensagem:</strong> {statusData.mensagem}</p>
          {statusData.redirectUrl && (
            <p><strong>Redirecionado para:</strong> <a href={statusData.redirectUrl} target="_blank" rel="noopener noreferrer">{statusData.redirectUrl}</a></p>
          )}
        </div>
      );
    } else if (activeTab === "novaMensagem") {
      return (
        <div>
          <h1>Nova Mensagem</h1>
          <div>
            <label>
              Telefones (separados por vírgula ou ponto e vírgula):
              <input
                type="text"
                value={telefones}
                onChange={(e) => setTelefones(e.target.value)}
                placeholder="Exemplo: 553492399036, 559887654321"
              />
            </label>
          </div>
          <div>
            <label>
              Mensagem:
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                maxLength="140"
                placeholder="Digite sua mensagem (máximo 140 caracteres)"
              />
            </label>
          </div>
          <button onClick={enviarMensagem}>Enviar</button>
          {statusEnvio && (
            <div style={{ color: statusEnvio.sucesso ? "green" : "red" }}>
              {statusEnvio.mensagem}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => setActiveTab("conexao")}>Conexão</button>
        <button onClick={() => setActiveTab("novaMensagem")}>Nova Mensagem</button>
      </div>
      {renderTabContent()}
    </div>
  );
}
