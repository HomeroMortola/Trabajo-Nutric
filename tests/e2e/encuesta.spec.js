/**
 * Tests E2E con Playwright — opcion1.html
 *
 * Simulan a un usuario real llenando la encuesta de evaluación sensorial
 * de principio a fin dentro de un navegador Chromium real.
 */

const { test, expect } = require('@playwright/test');

test.describe('Encuesta de Evaluación Sensorial', () => {

  test.beforeEach(async ({ page }) => {
    //Navega a la página de la encuesta antes de cada test
    await page.goto('/opcion1.html');
  });

  test('La página carga correctamente y muestra el título', async ({ page }) => {
    await expect(page).toHaveTitle(/Evaluación Sensorial/);
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-title')).toHaveText('Nutrición con propósito');
  });

  test('La barra de progreso inicia en 0 de 12', async ({ page }) => {
    const label = page.locator('#progress-label');
    await expect(label).toHaveText('0 de 12 respondidas');
  });

  test('Seleccionar un año de nacimiento incrementa el progreso', async ({ page }) => {
    //Selecciona el año 2000
    await page.selectOption('#fecha-nac', '2000');
    //La barra debe avanzar
    await expect(page.locator('#progress-label')).toHaveText('1 de 12 respondidas');
  });

  test('Seleccionar un género incrementa el progreso', async ({ page }) => {
    await page.click('.rpill:has-text("Femenino")');
    await expect(page.locator('#progress-label')).toHaveText('1 de 12 respondidas');
  });

  test('Mover un slider incrementa el progreso', async ({ page }) => {
    //Mueve el slider de la pregunta 1 al valor 7
    const slider = page.locator('input[type="range"][data-q="1"]');
    await slider.fill('7');
    await slider.dispatchEvent('input');

    await expect(page.locator('#progress-label')).toHaveText('1 de 12 respondidas');
    //El badge de valor debe mostrar 7
    await expect(page.locator('#vb-1')).toHaveText('7');
  });

  test('Intentar enviar la encuesta incompleta muestra alerta de validación', async ({ page }) => {
    //Escucha el diálogo (alert) de validación antes de hacer click
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Faltan');
      await dialog.accept();
    });

    await page.click('.submit-btn');
  });

  test('Flujo completo: llenar toda la encuesta y enviar redirige a gracias.html', async ({ page }) => {
    //--- Datos generales ---
    await page.selectOption('#fecha-nac', '2000');
    await page.click('.rpill:has-text("Femenino")');

    //--- Sliders: preguntas 1, 2, 4, 6, 7, 8, 9, 10 ---
    const sliderQs = [1, 2, 4, 6, 7, 8, 9, 10];
    for (const q of sliderQs) {
      const slider = page.locator(`input[type="range"][data-q="${q}"]`);
      await slider.fill('7');
      await slider.dispatchEvent('input');
    }

    //--- Pills Sí/No: preguntas 3 y 5 ---
    await page.click('#pills-3 .rpill:has-text("Sí")');
    await page.click('#pills-5 .rpill:has-text("Sí")');

    //Verifica que la barra está completa antes de enviar
    await expect(page.locator('#progress-label')).toHaveText('12 de 12 respondidas');

    //Mockea la llamada a Supabase para no hacer petición real
    await page.route('**/rest/v1/encuestas**', route =>
      route.fulfill({ status: 201, body: '[]' })
    );

    //Envía y espera redirección (serve puede quitar la extensión .html)
    await page.click('.submit-btn');
    await page.waitForURL(/gracias/, { timeout: 10000 });
    await expect(page).toHaveURL(/gracias/);
  });

});
