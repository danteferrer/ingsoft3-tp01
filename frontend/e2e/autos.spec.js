import { test, expect } from '@playwright/test'

function patenteUnica() {
  const ms = String(Date.now() % 1000).padStart(3, '0')
  return `YY${ms}YY`
}

async function registrarAuto(page, patente) {
  await page.getByLabel('Marca', { exact: true }).selectOption({ label: 'MarcaTestQA' })
  await page.getByLabel('Modelo').fill('E2E')
  await page.getByLabel('Año').fill('2020')
  await page.getByLabel('Patente').fill(patente)
  await page.getByLabel('Color').fill('Negro')
  await page.getByLabel('Kilometraje').fill('1000')
  await page.getByRole('button', { name: 'Registrar' }).click()
}

test.describe('AutoColección (QA real, con navegador)', () => {
  test('creación: el auto aparece en la lista y se puede borrar', async ({ page }) => {
    const patente = patenteUnica()
    await page.goto('/')

    await registrarAuto(page, patente)

    const fila = page.locator('tr', { hasText: patente })
    await expect(fila).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await fila.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.locator('tr', { hasText: patente })).toHaveCount(0)
  })

  test('caso de error: patente inválida no se registra', async ({ page }) => {
    await page.goto('/')

    await registrarAuto(page, '123')

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.locator('tr', { hasText: '123' })).toHaveCount(0)
  })

  test('persistencia: el auto sigue ahí después de recargar la página', async ({ page }) => {
    const patente = patenteUnica()
    await page.goto('/')

    await registrarAuto(page, patente)
    await expect(page.locator('tr', { hasText: patente })).toBeVisible()

    await page.reload()
    const fila = page.locator('tr', { hasText: patente })
    await expect(fila).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await fila.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.locator('tr', { hasText: patente })).toHaveCount(0)
  })
})
