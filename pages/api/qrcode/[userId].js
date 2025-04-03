import { webkit } from "playwright";
import fs from "fs/promises";
import path from "path";
import { handleRememberModal } from "../../components/handleRememberModal";

export default async function handler(req, res) {
  const { userId } = req.query;
  let page;
  let browser;

  const userStorageDir = path.join(process.cwd(), `conexoes/json/${userId}`);
  const storagePath = path.join(userStorageDir, "storage.json");
  const statusPath = path.join(userStorageDir, "status.json");

  async function saveStatus(status, mensagem, redirectUrl = null, qrCode = null) {
    const statusData = {
      timestamp: new Date().toISOString(),
      status,
      mensagem,
      redirectUrl,
      qrCode,
    };

    try {
      await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2));
      console.log(`Status atualizado: ${mensagem}`);
    } catch (error) {
      console.error("Erro ao salvar status:", error.message);
    }
  }

  try {
    console.log(`Iniciando Playwright para o usuário: ${userId}`);
    await fs.mkdir(userStorageDir, { recursive: true });

    browser = await webkit.launch({
      headless: true,
      // args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    let context;
    let savedState = { cookies: [], origins: [], sessionStorage: {} };
    let hasSavedState = false;

    try {
      const savedData = await fs.readFile(storagePath, "utf-8");
      savedState = JSON.parse(savedData);
      hasSavedState = true;
      console.log("Estado anterior encontrado:", JSON.stringify(savedState, null, 2));
    } catch (error) {
      console.log("Nenhum estado anterior encontrado:", error.message);
    }

    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: {
        "Accept-Language": "pt-BR,pt;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      storageState: hasSavedState ? savedState : undefined,
    });

    page = await context.newPage();

    console.log("Acessando página de autenticação...");
    await page.goto("https://messages.google.com/web/authentication", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    let isAuthenticated = false;
    const maxMonitoringTime = 120000; // 2 minutos
    const startTime = Date.now();
    let lastQrCode = null; // Para rastrear alterações no QR code

    while (Date.now() - startTime < maxMonitoringTime && !isAuthenticated) {
      const currentUrl = page.url();
      console.log(`Monitorando URL atual: ${currentUrl}`);

      if (currentUrl.includes("/conversations")) {
        console.log("Usuário autenticado, verificando modal...");
        isAuthenticated = true;
        await handleRememberModal(page, context, storagePath);
        await saveStatus("autenticado", "Usuário autenticado com sucesso", currentUrl);
        await browser.close();
        break;
      }

      if (currentUrl.includes("/authentication")) {
        let qrCodeBase64 = null;
        try {
          // Aguarda o elemento do QR code aparecer
          await page.waitForSelector("mw-qr-code img[src*='data:image']", { timeout: 10000 });
          const qrElement = await page.$("mw-qr-code img[src*='data:image']");
          if (qrElement) {
            qrCodeBase64 = await qrElement.getAttribute("src"); // Pega o base64 diretamente do atributo src
            if (qrCodeBase64 !== lastQrCode) {
              // Só atualiza se o QR code mudou
              lastQrCode = qrCodeBase64;
              await saveStatus(
                "aguardando_autenticacao",
                "QR Code detectado ou atualizado",
                null,
                qrCodeBase64
              );
              console.log("Novo QR Code salvo em status.json");
            }
          }
        } catch (error) {
          console.log("QR Code não encontrado ou expirado:", error.message);
          await saveStatus("aguardando_autenticacao", "Aguardando QR Code...", null, null);
        }
      }

      await page.waitForTimeout(15000); // Verifica a cada 10 segundos
    }

    if (!isAuthenticated) {
      await saveStatus("timeout", "Tempo de monitoramento esgotado", null, lastQrCode);
    }

    if (!res.headersSent) {
      res.status(200).json({
        userId,
        status: isAuthenticated ? "autenticado" : "timeout",
        mensagem: isAuthenticated ? "Usuário autenticado" : "Tempo de monitoramento esgotado",
        redirectUrl: isAuthenticated ? page.url() : null,
        qrCode: lastQrCode,
      });
    }
  } catch (error) {
    console.error("Erro geral:", error.message);
    await saveStatus("erro", `Falha no processo: ${error.message}`);

    if (!res.headersSent) {
      res.status(500).json({ erro: "Falha no processo", detalhes: error.message });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}