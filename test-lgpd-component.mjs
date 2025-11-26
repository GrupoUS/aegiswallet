import puppeteer from "puppeteer";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLGPDComponent() {
  console.log("Iniciando testes do componente LGPD...");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  
  try {
    console.log("Navegando para página de teste...");
    await page.goto("http://localhost:8080/test-lgpd", { 
      waitUntil: "networkidle0",
      timeout: 15000 
    });
    
    await sleep(3000);
    
    // Verificar conteúdo
    const pageContent = await page.evaluate(() => {
      return document.body.textContent.length > 100;
    });
    
    console.log("Conteúdo renderizado:", pageContent);
    
    // Screenshot inicial
    await page.screenshot({ path: "lgpd-initial.png", fullPage: true });
    console.log("Screenshot inicial salvo");
    
    if (\!pageContent) {
      console.log("Conteúdo não carregou adequadamente");
      return false;
    }
    
    // Verificar texto
    const pageText = await page.evaluate(() => document.body.textContent);
    console.log("Tamanho do texto:", pageText.length);
    
    const hasAegisWallet = pageText.includes("AegisWallet");
    const hasLGPD = pageText.includes("LGPD");
    
    console.log("Contém AegisWallet:", hasAegisWallet);
    console.log("Contém LGPD:", hasLGPD);
    
    // Verificar elementos
    const checkboxes = await page.$$("input[type=checkbox]");
    const buttons = await page.$$("button");
    
    console.log("Checkboxes:", checkboxes.length);
    console.log("Botões:", buttons.length);
    
    // Testar responsividade
    await page.setViewport({ width: 375, height: 667 });
    await sleep(1000);
    await page.screenshot({ path: "lgpd-mobile.png", fullPage: true });
    console.log("Screenshot mobile salvo");
    
    await page.setViewport({ width: 1200, height: 800 });
    await sleep(1000);
    await page.screenshot({ path: "lgpd-desktop.png", fullPage: true });
    console.log("Screenshot desktop salvo");
    
    // Resultado
    const success = pageContent && (hasAegisWallet || hasLGPD);
    
    console.log("Testes finalizados. Sucesso:", success);
    return success;
    
  } catch (error) {
    console.error("Erro:", error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testLGPDComponent().then(success => {
  console.log("Resultado:", success ? "SUCESSO" : "FALHA");
  process.exit(success ? 0 : 1);
});
