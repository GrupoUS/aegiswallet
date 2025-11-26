const puppeteer = require('puppeteer');

async function test() {
  console.log('Iniciando teste...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8080/test-lgpd', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    // Esperar um pouco para a página carregar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fazer screenshot
    await page.screenshot({ path: 'lgpd-test.png', fullPage: true });
    console.log('Screenshot salvo: lgpd-test.png');
    
    // Verificar conteúdo
    const content = await page.evaluate(() => {
      return document.body.textContent;
    });
    
    console.log('Tamanho do conteúdo:', content.length);
    console.log('Contém AegisWallet:', content.includes('AegisWallet'));
    console.log('Contém LGPD:', content.includes('LGPD'));
    
    const success = content.length > 100;
    console.log('Teste finalizado. Sucesso:', success);
    
    await browser.close();
    return success;
    
  } catch (error) {
    console.error('Erro:', error.message);
    await browser.close();
    return false;
  }
}

test().then(success => {
  process.exit(success ? 0 : 1);
});
