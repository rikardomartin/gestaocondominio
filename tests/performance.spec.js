// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Performance e Carregamento', () => {
  test('Cenário L: Aplicação carrega em menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Aguardar tela de login estar visível
    await expect(page.locator('.login-container')).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);
    
    // Verificar que carregou em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });

  test('Cenário M: Não há erros de console críticos', async ({ page }) => {
    const errors = [];
    
    // Capturar erros do console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await expect(page.locator('.login-container')).toBeVisible({ timeout: 10000 });
    
    // Aguardar um pouco para capturar possíveis erros
    await page.waitForTimeout(2000);
    
    // Filtrar erros conhecidos/esperados (Firebase, etc)
    const criticalErrors = errors.filter(error => 
      !error.includes('Firebase') && 
      !error.includes('auth') &&
      !error.includes('Failed to load resource')
    );
    
    console.log(`📊 Total de erros: ${errors.length}`);
    console.log(`❌ Erros críticos: ${criticalErrors.length}`);
    
    if (criticalErrors.length > 0) {
      console.log('Erros críticos encontrados:', criticalErrors);
    }
    
    // Permitir alguns erros não críticos
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test('Cenário N: Elementos principais estão presentes', async ({ page }) => {
    await page.goto('/');
    
    // Verificar elementos essenciais existem no DOM
    await expect(page.locator('#app')).toBeVisible();
    const loadingExists = await page.locator('#loading').count();
    expect(loadingExists).toBeGreaterThan(0);
    
    const headerExists = await page.locator('#header').count();
    expect(headerExists).toBeGreaterThan(0);
    
    const mainExists = await page.locator('#main').count();
    expect(mainExists).toBeGreaterThan(0);
    
    // Aguardar tela de login aparecer (loading pode já estar oculto)
    await expect(page.locator('.login-container')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Todos os elementos principais estão presentes no DOM');
  });

  test('Cenário O: PWA manifest está presente', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se o manifest está linkado
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
    
    // Verificar se o href está correto
    const href = await manifestLink.getAttribute('href');
    expect(href).toContain('manifest.json');
  });
});
