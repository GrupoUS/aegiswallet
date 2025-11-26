const puppeteer = require("puppeteer");

async function test() {
  console.log("Testando componente LGPD...");
  const browser = await puppeteer.launch({headless: true, args: ["--no-sandbox"]});
  const page = await browser.newPage();
  
  try {
    await page.goto("http://localhost:8080/test-lgpd", {waitUntil: "networkidle0", timeout: 15000});
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({path: "lgpd-test.png", fullPage: true});
    console.log("Screenshot salvo: lgpd-test.png");
    
    const content = await page.evaluate(() => ({
      text: document.body.textContent,
      title: document.title
    }));
    
    console.log("Tamanho:", content.text.length);
    console.log("AegisWallet:", content.text.includes("AegisWallet"));
    console.log("LGPD:", content.text.includes("LGPD"));
    
    const elements = await page.evaluate(() => ({
      checkboxes: document.querySelectorAll("input[type=checkbox]").length,
      buttons: document.querySelectorAll("button").length
    }));
    
    console.log("Checkboxes:", elements.checkboxes);
    console.log("Botões:", elements.buttons);
    
    await browser.close();
    return content.text.length > 100 && (elements.checkboxes > 0 || elements.buttons > 0);
    
  } catch (error) {
    console.error("Erro:", error.message);
    await browser.close();
    return false;
  }
}

test().then(success => {
  console.log("Resultado:", success ? "SUCESSO" : "FALHA");
  process.exit(success ? 0 : 1);
});
