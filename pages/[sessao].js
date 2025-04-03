// pages/status/[userId].jsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const StatusPage = () => {
  const router = useRouter();
  const { sessao } = router.query;
  console.log(sessao);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sessao) return;

    // da um sinal para gerar dados na pagina
    fetch(`/api/qrcode/${sessao}`);

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status/${sessao}`);
        const result = await res.json();
        console.log("uai",result);
        setData(result);
      } catch (error) {
        console.error('Erro ao buscar status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);

    return () => clearInterval(interval);
  }, [sessao]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {data ? (
        data.qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <Image
              src={data.qrCode}
              alt="QR Code"
              width={300}
              height={300}
            />
            <p>{data.mensagem}</p>
          </div>
        ) : (
          <p className="text-xl font-semibold">{data.mensagem}</p>
        )
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
};

export default StatusPage;