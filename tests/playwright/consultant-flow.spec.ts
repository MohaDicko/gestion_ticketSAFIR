import "dotenv/config";
import { test, expect } from "@playwright/test";

const consultantEmail = "test.test@safirconsulting.net";
const consultantPassword = "Safir2026!Consultant";

test.describe("Test Playwright — Connexion et création ticket consultant test.test", () => {
  test("login consultant test.test et création réussie de ticket", async ({ page }) => {
    test.setTimeout(90000);

    // 1. Accès au portail
    await page.goto("/");
    await expect(page).toHaveTitle(/Tandem/i);

    // 2. Remplir le formulaire de connexion
    await page.locator('input[type="email"]').first().fill(consultantEmail);
    await page.locator('input[type="password"]').first().fill(consultantPassword);

    const loginResponsePromise = page.waitForResponse((r) => r.url().includes("/api/v1/auth/login"));
    await page.getByRole("button", { name: /Se connecter à mon portail/i }).click();

    const loginRes = await loginResponsePromise;
    console.log("Login HTTP Status:", loginRes.status());
    expect([200, 201]).toContain(loginRes.status());

    // 3. Attendre l'affichage de l'espace demandeur
    await page.waitForTimeout(2000);

    // Vérifier l'en-tête de bienvenue du demandeur
    await expect(page.locator("body")).toContainText("Demandeur");
    await expect(page.locator("body")).toContainText("test test");

    // 4. Cliquer sur "Soumettre un nouveau besoin SAP"
    const submitNeedBtn = page.getByRole("button", { name: /Soumettre un nouveau besoin SAP/i });
    await expect(submitNeedBtn).toBeVisible();
    await submitNeedBtn.click();

    // 5. Remplir le formulaire de ticket
    const ticketTitle = `Demande Playwright Test ${Date.now()}`;
    await page.locator('input[placeholder*="Addon validation"]').fill(ticketTitle);
    await page.locator('textarea[placeholder*="Décrivez précisément"]').fill("Besoin d'intégration spécifique pour flux commercial SAP B1.");

    // 6. Enregistrer le ticket et intercepter la réponse POST
    const ticketPostPromise = page.waitForResponse(
      (r) => r.url().includes("/api/v1/tickets") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Enregistrer le ticket/i }).click();

    const ticketRes = await ticketPostPromise;
    console.log("Ticket Creation HTTP Status:", ticketRes.status());
    const ticketData = await ticketRes.json().catch(() => null);
    console.log("Ticket Creation Data:", JSON.stringify(ticketData, null, 2));

    expect(ticketRes.status()).toBe(201);
    expect(ticketData.reference).toBeDefined();

    // 7. Vérifier que le ticket apparaît bien dans la liste "Mes Demandes Émises"
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).toContainText(ticketTitle);
    console.log(`✅ Succès : Le ticket ${ticketData.reference} a été créé et s'affiche sur le portail du consultant !`);
  });
});
