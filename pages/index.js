import { useEffect, useState } from "react";

export default function Home() {
  const [statusData, setStatusData] = useState({ status: "inicializando" });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conexao");
  const [telefones, setTelefones] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [statusEnvio, setStatusEnvio] = useState(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const res = await fetch("/api/qrcode/123");
        if (!res.ok) throw new Error("Erro ao gerar QR Code");
        console.log("QR Code gerado com sucesso");
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status/123");
        const data = await res.json();
        setStatusData(data);
        setIsLoading(false);
        return data;
      } catch (err) {
        console.error("Erro ao buscar status:", err);
        setIsLoading(false);
        return null;
      }
    };

    generateQRCode();
    fetchStatus(); // Chamada inicial imediata
    
    const statusInterval = setInterval(async () => {
      const data = await fetchStatus();
      console.log("Status:", data?.status);
    }, 2000);

    return () => clearInterval(statusInterval);
  }, []);

  const enviarMensagem = async () => {
    const telefonesArray = telefones.split(/[,;]\s*/).filter(t => t.trim());
    const telefoneValido = telefonesArray.every(tel => /^\d{10,}$/.test(tel.trim()));
    
    if (!telefoneValido) {
      setStatusEnvio({ sucesso: false, mensagem: "Digite números de telefone válidos" });
      return;
    }

    if (!mensagem || mensagem.length > 140) {
      setStatusEnvio({ sucesso: false, mensagem: "A mensagem deve ter entre 1 e 140 caracteres" });
      return;
    }

    const payload = {
      mensagens: telefonesArray.map((telefone) => ({
        telefone: telefone.trim(),
        mensagem,
      })),
    };

    try {
      const res = await fetch("/api/mensagem/123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setStatusEnvio({
        sucesso: res.ok,
        mensagem: res.ok ? "Mensagens enviadas com sucesso!" : (data.error || "Erro ao enviar")
      });
    } catch (err) {
      setStatusEnvio({ sucesso: false, mensagem: "Erro ao conectar com o servidor" });
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const renderTabContent = () => {
    if (activeTab === "conexao") {
      if (isLoading) return <p>Carregando...</p>;
      if (!statusData) return <p>Erro ao carregar o status.</p>;

      return (
        <div>
          <h1>Status da Conexão</h1>
          <p><strong>Status:</strong> {statusData.status}</p>
          <p><strong>Mensagem:</strong> {statusData.mensagem}</p>
          {statusData.qrCode && statusData.status === "aguardando_autenticacao" && (
            <div>
              <p>Escaneie o QR Code para autenticar:</p>
              <img src={statusData.qrCode} alt="QR Code" />
            </div>
          )}
          {statusData.redirectUrl && (
            <p>
              <strong>Redirecionado para:</strong>{" "}
              <a href={statusData.redirectUrl} target="_blank" rel="noopener noreferrer">
                {statusData.redirectUrl}
              </a>
            </p>
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
              Mensagem ({mensagem.length}/140):
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                maxLength="140"
                placeholder="Digite sua mensagem"
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