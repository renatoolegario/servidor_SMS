import { webkit } from 'playwright'; // ou use o navegador de sua escolha: chromium, firefox, etc.

async function aguardarElemento(page, selector, timeout = 30000) {
  try {
    const elemento = await page.locator(selector);
    await elemento.waitFor({ state: 'visible', timeout }); // Aguarda o elemento se tornar visível
    return elemento;
  } catch (error) {
    console.error(`Elemento não encontrado: ${selector}`, error);
    throw new Error(`Elemento ${selector} não encontrado após o tempo limite.`);
  }
}

// Função para simular a escrita no elemento
const simularEscrita = async (elemento, texto, delay = 100) => {
  for (let i = 0; i < texto.length; i++) {
    const key = texto[i];
    await elemento.type(key, { delay }); // Usando o método `type` para simular a escrita
  }
};

// Função principal para enviar a mensagem
const enviarMensagem = async (page, telefone, mensagem) => {
  let success = false;

  try {
    // Encontrar o botão de iniciar conversa
    const botaoIniciarChat = await aguardarElemento(page, '[href="/web/conversations/new"]');
    await botaoIniciarChat.click();

    // Aguarda o campo de telefone ficar visível
    const inputTelefone = await aguardarElemento(page, '.input-container input');
    await simularEscrita(inputTelefone, telefone);

    // Envia o evento de 'input' (opcional no Playwright)
    await inputTelefone.dispatchEvent('input');

    // Aguarda o contêiner de seleção
    const container = await aguardarElemento(page, '.selector-container');
    await container.click();

    // Aguarda o campo de mensagem
    const textareaMensagem = await aguardarElemento(page, 'textarea[data-e2e-message-input-box]');
    await simularEscrita(textareaMensagem, mensagem);

    // Aguarda o botão de envio e clica
    const sendButton = await aguardarElemento(page, 'mws-message-send-button');
    await sendButton.click();

    success = true; // Se tudo ocorrer bem, a mensagem foi enviada com sucesso

  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }

  return success;
};

export default enviarMensagem;
