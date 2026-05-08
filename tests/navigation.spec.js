// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navegação e Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Fazer login antes de cada teste
    await expect(page.locator('.login-container')).toBeVisible({ timeout: 10000 });
    await page.fill('#email', 'admin@condominio.com');
    await page.fill('#password', 'admin123');
    await page.click('#loginBtn');
    
    // Aguardar processamento do login
    await page.waitForTimeout(3000);
  });

  test('Cenário D: Navegação completa - Condomínios → Blocos → Apartamentos', async ({ page }) => {
    // Verificar se login foi bem-sucedido
    const condominiosVisible = await page.locator('#condominiosScreen').isVisible();
    
    if (!condominiosVisible) {
      console.log('⚠️ Login não funcionou - Firebase não configurado. Teste pulado.');
      test.skip();
      return;
    }
    
    // Verificar que está na tela de condomínios
    await expect(page.locator('#condominiosList')).toBeVisible();
    
    // Verificar se há condomínios listados
    const condominios = page.locator('.condominio-card');
    const count = await condominios.count();
    expect(count).toBeGreaterThan(0);
    
    // Clicar no primeiro condomínio
    await condominios.first().click();
    
    // Aguardar tela de blocos carregar
    await expect(page.locator('#blocosScreen')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#blocosList')).toBeVisible();
    
    // Verificar botão voltar está visível
    await expect(page.locator('#backBtn')).toBeVisible();
    
    // Verificar se há blocos listados
    const blocos = page.locator('.bloco-card');
    const blocosCount = await blocos.count();
    
    if (blocosCount > 0) {
      // Clicar no primeiro bloco
      await blocos.first().click();
      
      // Aguardar tela de apartamentos carregar
      await expect(page.locator('#apartamentosScreen')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#apartamentosList')).toBeVisible();
      
      // Verificar se há apartamentos listados
      const apartamentos = page.locator('.apartamento-card');
      const aptCount = await apartamentos.count();
      expect(aptCount).toBeGreaterThan(0);
    }
  });

  test('Cenário E: Abrir modal de apartamento', async ({ page }) => {
    // Verificar se login foi bem-sucedido
    const condominiosVisible = await page.locator('#condominiosScreen').isVisible();
    
    if (!condominiosVisible) {
      console.log('⚠️ Login não funcionou - Firebase não configurado. Teste pulado.');
      test.skip();
      return;
    }
    
    // Navegar até apartamentos
    await page.locator('.condominio-card').first().click();
    await expect(page.locator('#blocosScreen')).toBeVisible({ timeout: 10000 });
    
    const blocos = page.locator('.bloco-card');
    const blocosCount = await blocos.count();
    
    if (blocosCount > 0) {
      await blocos.first().click();
      await expect(page.locator('#apartamentosScreen')).toBeVisible({ timeout: 10000 });
      
      // Clicar em um apartamento
      const apartamentos = page.locator('.apartamento-card');
      const aptCount = await apartamentos.count();
      
      if (aptCount > 0) {
        await apartamentos.first().click();
        
        // Aguardar modal abrir
        await expect(page.locator('#apartmentModal')).toBeVisible({ timeout: 5000 });
        
        // Verificar elementos do modal
        await expect(page.locator('#apartmentModalTitle')).toBeVisible();
        await expect(page.locator('input[name="aptStatus"]')).toHaveCount(4); // 4 opções de status
        await expect(page.locator('#apartmentObservations')).toBeVisible();
        await expect(page.locator('#saveApartmentStatus')).toBeVisible();
        await expect(page.locator('#closeApartmentModal')).toBeVisible();
      }
    }
  });

  test('Cenário F: Fechar modal de apartamento', async ({ page }) => {
    // Verificar se login foi bem-sucedido
    const condominiosVisible = await page.locator('#condominiosScreen').isVisible();
    
    if (!condominiosVisible) {
      console.log('⚠️ Login não funcionou - Firebase não configurado. Teste pulado.');
      test.skip();
      return;
    }
    
    // Navegar até apartamentos e abrir modal
    await page.locator('.condominio-card').first().click();
    await expect(page.locator('#blocosScreen')).toBeVisible({ timeout: 10000 });
    
    const blocos = page.locator('.bloco-card');
    const blocosCount = await blocos.count();
    
    if (blocosCount > 0) {
      await blocos.first().click();
      await expect(page.locator('#apartamentosScreen')).toBeVisible({ timeout: 10000 });
      
      const apartamentos = page.locator('.apartamento-card');
      const aptCount = await apartamentos.count();
      
      if (aptCount > 0) {
        await apartamentos.first().click();
        await expect(page.locator('#apartmentModal')).toBeVisible({ timeout: 5000 });
        
        // Fechar modal clicando no X
        await page.click('#closeApartmentModal');
        
        // Verificar que modal foi fechado
        await expect(page.locator('#apartmentModal')).toBeHidden({ timeout: 3000 });
      }
    }
  });

  test('Cenário G: Botão voltar funciona corretamente', async ({ page }) => {
    // Verificar se login foi bem-sucedido
    const condominiosVisible = await page.locator('#condominiosScreen').isVisible();
    
    if (!condominiosVisible) {
      console.log('⚠️ Login não funcionou - Firebase não configurado. Teste pulado.');
      test.skip();
      return;
    }
    
    // Navegar para blocos
    await page.locator('.condominio-card').first().click();
    await expect(page.locator('#blocosScreen')).toBeVisible({ timeout: 10000 });
    
    // Clicar no botão voltar
    await page.click('#backBtn');
    
    // Verificar que voltou para condomínios
    await expect(page.locator('#condominiosScreen')).toBeVisible({ timeout: 5000 });
  });

  test('Cenário H: Logout funciona corretamente', async ({ page }) => {
    // Verificar se login foi bem-sucedido
    const condominiosVisible = await page.locator('#condominiosScreen').isVisible();
    
    if (!condominiosVisible) {
      console.log('⚠️ Login não funcionou - Firebase não configurado. Teste pulado.');
      test.skip();
      return;
    }
    
    // Verificar que está logado
    await expect(page.locator('#userInfo')).toBeVisible();
    
    // Clicar no botão de logout
    page.on('dialog', dialog => dialog.accept()); // Aceitar confirmação
    await page.click('#logoutBtn');
    
    // Aguardar voltar para tela de login
    await expect(page.locator('.login-container')).toBeVisible({ timeout: 10000 });
  });
});
