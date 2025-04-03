import { webkit } from 'playwright'; // Ou use o browser de sua preferência: chromium, firefox, etc.
import fs from 'fs/promises';
import path from 'path';
import { handleRememberModal } from "../../components/handleRememberModal";

async function aguardarElemento(page, selector, timeout = 30000) {
  try {
    console.log(`Aguardando elemento: ${selector}`);
    const elemento = await page.locator(selector);
    await elemento.waitFor({ state: 'visible', timeout }); // Aguarda o elemento se tornar visível
    console.log(`Elemento encontrado: ${selector}`);
    return elemento;
  } catch (error) {
    console.error(`Elemento não encontrado: ${selector}`, error);
    throw new Error(`Elemento ${selector} não encontrado após o tempo limite.`);
  }
}

// Função para simular a escrita no elemento
const simularEscrita = async (elemento, texto, delay = 1) => {
  console.log(`Iniciando simulação de escrita: "${texto}"`);
  for (let i = 0; i < texto.length; i++) {
    const key = texto[i];
    await elemento.type(key, { delay }); // Simula a digitação caractere por caractere
  }
  console.log(`Texto digitado: "${texto}"`);
};

const deletarArquivo = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Arquivo ${filePath} deletado com sucesso.`);
  } catch (error) {
    console.error(`Erro ao deletar o arquivo ${filePath}:`, error.message);
  }
};

export default async function handler(req, res) {
  const { userId, limite } = req.query;

  if (!userId) {
    console.error("UserId não fornecido.");
    return res.status(400).json({ error: 'UserId é necessário.' });
  }

  const userStorageDir = path.join(process.cwd(), `conexoes/json/${userId}`);
  const storagePath = path.join(userStorageDir, 'storage.json');
  const statusPath = path.join(userStorageDir, 'status.json');
  const mensagemPatch = path.join(process.cwd(), `mensagens/json/${userId}`);

  let browser;
  let page;

  // Função para salvar status da conexão
  async function saveStatus(status, mensagem, redirectUrl = null) {
    const statusData = {
      timestamp: new Date().toISOString(),
      status,
      mensagem,
      redirectUrl,
    };

    try {
      await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2));
      console.log(`Status atualizado: ${mensagem}`);
    } catch (error) {
      console.error('Erro ao salvar status:', error.message);
    }
  }

  try {
    console.log(`Iniciando Playwright para o usuário: ${userId}`);

    // Cria diretório caso não exista
    await fs.mkdir(userStorageDir, { recursive: true });
    console.log(`Diretório ${userStorageDir} criado ou já existente.`);

    // Lança o navegador em modo headless
    browser = await webkit.launch({
      headless: true, // Defina como false para visualizar o navegador
      // args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log('Navegador lançado.');

    let context;
    let savedState = { cookies: [], origins: [], sessionStorage: {} };
    let hasSavedState = false;

    // Lê o estado anterior de login, se existir
    try {
      const savedData = await fs.readFile(storagePath, "utf-8");
      savedState = JSON.parse(savedData);
      hasSavedState = true;
      console.log("Estado anterior encontrado:", JSON.stringify(savedState, null, 2));
    } catch (error) {
      console.log("Nenhum estado anterior encontrado:", error.message);
    }

    // Cria o contexto do navegador
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
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
    console.log("Contexto criado.");

    page = await context.newPage();
    console.log("Nova página criada.");
    await page.goto("https://messages.google.com/web/conversations/new", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    console.log("Página do Google Messages carregada.");

    console.log("Aguardando modal de lembrar...");
    await handleRememberModal(page, context, storagePath);
    console.log("Modal tratado e página pronta para uso.");

    // Lê a pasta de mensagens
    const mensagemFiles = await fs.readdir(mensagemPatch);
    console.log(`Arquivos de mensagens encontrados: ${mensagemFiles.length}`);

    let i = 0;  // Inicializa o contador

    for (const file of mensagemFiles) {
      const filePath = path.join(mensagemPatch, file);
      console.log(`Processando arquivo: ${filePath}`);

      try {
        // Lê o arquivo da mensagem
        const fileData = await fs.readFile(filePath, 'utf-8');
        const mensagemData = JSON.parse(fileData);
        console.log(`Conteúdo do arquivo ${file}:`, mensagemData);

        if (!mensagemData.telefone || !mensagemData.mensagem) {
          console.error(`Dados inválidos no arquivo ${file}. Ignorando.`);
          continue;
        }

        console.log(`Iniciando nova conversa para o telefone: ${mensagemData.telefone}`);
        const botaoIniciarChat = await aguardarElemento(page, '[href="/web/conversations/new"]');
        await botaoIniciarChat.click();
        console.log("Botão de iniciar chat clicado.");
        
        const inputTelefone = await aguardarElemento(page, '.input-container input');
        await inputTelefone.click();
        console.log("Input de telefone clicado.");
        await simularEscrita(inputTelefone, mensagemData.telefone);
        
        const contatoButton = await page.locator('mw-contact-selector-button button.mdc-button');
        console.log("Botão de contato localizado.");
        await contatoButton.click();
        console.log("Botão de contato clicado.");

        const textareaMensagem = await aguardarElemento(page, 'textarea[data-e2e-message-input-box]');
        await simularEscrita(textareaMensagem, mensagemData.mensagem);
        console.log("Mensagem digitada no textarea.");

        await textareaMensagem.press('Enter'); // Envia a mensagem
        console.log("Enter pressionado para enviar a mensagem.");

        await deletarArquivo(filePath);
        console.log(`Arquivo ${filePath} processado e deletado com sucesso.`);

        i++; // Incrementa o contador

        if (limite && i >= limite) {
          console.log(`Limite de ${limite} mensagens atingido. Encerrando o processamento.`);
          break;
        }
      } catch (error) {
        console.error(`Erro ao processar o arquivo ${file}: ${error.message}`);
      }
    }

    // Encerra o navegador
    await browser.close();
    console.log("Navegador encerrado.");

    return res.status(200).json({ success: 'Mensagens processadas com sucesso!' });
  } catch (error) {
    console.error('Erro ao iniciar o Playwright:', error);
    await saveStatus('erro', 'Erro ao processar mensagens.');

    if (browser) {
      await browser.close();
      console.log("Navegador encerrado devido a erro.");
    }

    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
