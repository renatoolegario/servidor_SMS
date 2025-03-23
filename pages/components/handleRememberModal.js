import fs from "fs/promises";

/**
 * Lida com o modal 'Lembrar deste computador?' em uma página Playwright.
 * 
 * @param {object} page - Instância da página do Playwright.
 * @param {object} context - Contexto do navegador Playwright.
 * @param {string} storagePath - Caminho do arquivo de estado da sessão.
 * @returns {Promise<boolean>} - Retorna `true` se o modal foi tratado, caso contrário, `false`.
 */
export async function handleRememberModal(page, context, storagePath) {
  const checkboxSelector = 'input[type="checkbox"]#mat-mdc-checkbox-0-input';
  const yesButtonSelector = 'button[data-e2e-remember-this-computer-confirm]';
  const modalSelector = '.mdc-dialog'; // Ajuste o seletor conforme necessário

  try {
    console.log("Verificando modal 'Lembrar deste computador?'...");

    const checkboxExists = await page.waitForSelector(checkboxSelector, { timeout: 3000 }).catch(() => null);
    if (checkboxExists) {
      const isChecked = await page.evaluate((selector) => {
        const checkbox = document.querySelector(selector);
        return checkbox?.checked;
      }, checkboxSelector);

      if (!isChecked) {
        await page.click(checkboxSelector);
        console.log("Checkbox 'Não mostrar novamente' marcado");
        await page.waitForTimeout(500);
      } else {
        console.log("Checkbox já estava marcado");
      }
    }

    const yesButtonExists = await page.waitForSelector(yesButtonSelector, { timeout: 3000 }).catch(() => null);
    if (yesButtonExists) {
      await page.click(yesButtonSelector);
      console.log("Botão 'Sim' clicado");

      await page.waitForSelector(modalSelector, { state: "hidden", timeout: 5000 }).catch(() => {
        console.log("Aviso: Modal não foi fechado ou demorou para fechar");
      });

      // Captura o estado atualizado
      const storageState = await context.storageState();
      const sessionStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          data[key] = sessionStorage.getItem(key);
        }
        return data;
      });
      storageState.sessionStorage = sessionStorage;

      await fs.writeFile(storagePath, JSON.stringify(storageState, null, 2));
      console.log(`Estado salvo em: ${storagePath}`);

      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro ao lidar com o modal:", error.message);
    return false;
  }
}
