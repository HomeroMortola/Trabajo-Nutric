// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  //Directorio donde están los tests E2E
  testDir: './tests/e2e',

  //Cada test tiene 30 segundos como máximo
  timeout: 30_000,

  //Si un test falla, no reintenta automáticamente
  retries: 0,

  //Muestra el resultado detallado en consola
  reporter: 'list',

  use: {
    //URL base del servidor local
    baseURL: 'http://localhost:3000',

    //Graba un video en caso de fallo
    video: 'retain-on-failure',

    //Toma una captura de pantalla al fallar
    screenshot: 'only-on-failure',
  },

  //Levanta un servidor estático antes de correr los tests
  webServer: {
    command: 'npx serve . --listen 3000 --no-clipboard',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
