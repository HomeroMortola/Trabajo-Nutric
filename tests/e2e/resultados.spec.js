/**
 * Tests E2E con Playwright — Login oculto + resultados.html
 *
 * [TC-R01 a TC-R10] Verifican el acceso al panel de estadísticas mediante
 * el login secreto ubicado en la versión de la página, y validan que la página de resultados
 * cargue y funcione correctamente.
 *
 * Flujo de acceso:
 *  1. Hacer clic en "Formulario Nutricion v1.2.4" en la versión de la página
 *  2. Ingresar la contraseña en el campo que aparece
 *  3. Presionar Enter → redirige a resultados.html
 */

const { test, expect } = require('@playwright/test');

//Datos de encuestas de prueba para mockear la API de Supabase
const MOCK_ENCUESTAS = [
  {
    id: 1, created_at: '2026-06-01T10:00:00Z',
    edad: 22, genero: 'Femenino',
    q1_apariencia_general: 8, q2_intensidad_color: 7, q3_distincion_ingredientes: 'Sí',
    q4_intensidad_olor: 6, q5_olor_verduras: 'No',
    q6_temperatura: 9, q7_crocancia: 8,
    q8_integracion_sabores: 7,
    q9_sabor_general: 8, q10_permanencia_sabor: 5,
    comentario: 'Muy rica'
  },
  {
    id: 2, created_at: '2026-06-02T11:00:00Z',
    edad: 35, genero: 'Masculino',
    q1_apariencia_general: 6, q2_intensidad_color: 5, q3_distincion_ingredientes: 'No',
    q4_intensidad_olor: 7, q5_olor_verduras: 'Sí',
    q6_temperatura: 7, q7_crocancia: 6,
    q8_integracion_sabores: 8,
    q9_sabor_general: 7, q10_permanencia_sabor: 6,
    comentario: null
  }
];

//Mockea el endpoint de Supabase antes de navegar
async function mockSupabase(page) {
  await page.route('**/rest/v1/encuestas**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ENCUESTAS)
    })
  );
}

//Accede al panel de resultados mediante el login oculto
async function accederPorLoginOculto(page, password = 'nutriform2026') {
  await page.goto('/index.html');
  const trigger = page.locator('#footer-trigger');
  await trigger.click();
  await page.locator('#secret-input').fill(password);
  await page.locator('#secret-input').press('Enter');
}


//Login oculto

test.describe('Login Oculto en el Footer', () => {

  test('[TC-R01] El trigger del footer es visible en el DOM pero visualmente discreto', async ({ page }) => {
    await page.goto('/index.html');
    const trigger = page.locator('#footer-trigger');
    //El elemento existe en el DOM
    await expect(trigger).toBeAttached();
    //Muestra el texto de versión
    await expect(trigger).toHaveText('Formulario Nutricion v1.2.4');
  });

  test('[TC-R02] Hacer clic en el trigger muestra el campo de contraseña', async ({ page }) => {
    await page.goto('/index.html');
    const secretBox = page.locator('#secret-box');

    //El campo está oculto por defecto
    await expect(secretBox).toBeHidden();

    await page.locator('#footer-trigger').click();

    //Después del clic debe mostrarse
    await expect(secretBox).toBeVisible();
    await expect(page.locator('#secret-input')).toBeFocused();
  });

  test('[TC-R03] Hacer clic de nuevo en el trigger oculta el campo', async ({ page }) => {
    await page.goto('/index.html');
    const trigger = page.locator('#footer-trigger');
    const secretBox = page.locator('#secret-box');

    //Abre
    await trigger.click();
    await expect(secretBox).toBeVisible();

    //Cierra
    await trigger.click();
    await expect(secretBox).toBeHidden();
  });

  test('[TC-R04] Ingresar una contraseña incorrecta muestra mensaje de error', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#footer-trigger').click();
    await page.locator('#secret-input').fill('clave_incorrecta');
    await page.locator('#secret-input').press('Enter');

    const errorMsg = page.locator('#secret-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Clave incorrecta');

    //El campo de contraseña se limpia automáticamente
    await expect(page.locator('#secret-input')).toHaveValue('');
  });

  test('[TC-R05] El mensaje de error desaparece automáticamente después de ~2 segundos', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#footer-trigger').click();
    await page.locator('#secret-input').fill('wrong');
    await page.locator('#secret-input').press('Enter');

    const errorMsg = page.locator('#secret-error');
    await expect(errorMsg).toBeVisible();

    //Espera que desaparezca (timeout de 3s para dar margen)
    await expect(errorMsg).toBeHidden({ timeout: 3000 });
  });

  test('[TC-R06] Ingresar la contraseña correcta redirige a la página de resultados', async ({ page }) => {
    await mockSupabase(page);
    await accederPorLoginOculto(page, 'nutriform2026');

    await page.waitForURL(/resultados/, { timeout: 8000 });
    await expect(page).toHaveURL(/resultados/);
  });

  test('[TC-R07] El login oculto también funciona desde opcion1.html', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/opcion1.html');
    await page.locator('#footer-trigger').click();
    await page.locator('#secret-input').fill('nutriform2026');
    await page.locator('#secret-input').press('Enter');

    await page.waitForURL(/resultados/, { timeout: 8000 });
    await expect(page).toHaveURL(/resultados/);
  });

});


//Página de Resultados (resultados.html)

test.describe('Página de Resultados y Estadísticas', () => {

  test.beforeEach(async ({ page }) => {
    //Mockea la API de Supabase y accede por login oculto antes de cada test
    await mockSupabase(page);
    await accederPorLoginOculto(page);
    await page.waitForURL(/resultados/, { timeout: 8000 });
  });

  test('[TC-R08] La página de resultados carga y muestra el contador de respuestas', async ({ page }) => {
    await expect(page).toHaveTitle(/Resultados/);
    //Con el mock hay 2 respuestas
    await expect(page.locator('#total')).toHaveText('2 respuestas', { timeout: 5000 });
  });

  test('[TC-R09] Los 4 gráficos (canvas) están presentes en el DOM', async ({ page }) => {
    await expect(page.locator('#grafico-barras')).toBeAttached();
    await expect(page.locator('#grafico-radar')).toBeAttached();
    await expect(page.locator('#grafico-edad')).toBeAttached();
    await expect(page.locator('#grafico-genero')).toBeAttached();
  });

  test('[TC-R10] La tabla de últimas respuestas muestra los datos mockeados', async ({ page }) => {
    const tbody = page.locator('#tabla-respuestas tbody');
    //Espera que la tabla tenga filas con datos
    await expect(tbody.locator('tr')).toHaveCount(2, { timeout: 5000 });
  });

  test('[TC-R11] Los filtros de género están presentes y activos por defecto', async ({ page }) => {
    const filtros = page.locator('.filtro-genero');
    await expect(filtros).toHaveCount(3); //Masculino, Femenino, Otro
    //Todos deben estar chequeados por defecto
    for (const filtro of await filtros.all()) {
      await expect(filtro).toBeChecked();
    }
  });

  test('[TC-R12] Desmarcar un filtro de género actualiza el conteo de respuestas', async ({ page }) => {
    //Desmarca "Masculino" por lo que solo queda la respuesta Femenino (1)
    await page.locator('.filtro-genero[value="Masculino"]').uncheck();
    await expect(page.locator('#total')).toHaveText('1 respuesta', { timeout: 5000 });
  });

  test('[TC-R13] El botón "Actualizar" recarga los datos desde la API', async ({ page }) => {
    const btnActualizar = page.locator('.btn-actualizar');
    await expect(btnActualizar).toBeVisible();
    //Hacer clic no debe causar errores ni recargar la página completa
    await btnActualizar.click();
    await expect(page.locator('#total')).toHaveText('2 respuestas', { timeout: 5000 });
  });

});
