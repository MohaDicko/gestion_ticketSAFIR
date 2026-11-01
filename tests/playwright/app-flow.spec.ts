import "dotenv/config";
import { test, expect } from "@playwright/test";

const adminEmail = process.env.ALIKO_EMAIL || "aliko.getheme@safirconsulting.net";
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

async function loginAsAliko(page: import("@playwright/test").Page) {
  test.skip(!adminPassword, "INITIAL_ADMIN_PASSWORD is required for real login tests");

  await page.goto("/");
  await page.locator('input[type="email"]').first().fill(adminEmail);
  await page.locator('input[type="password"]').first().fill(adminPassword as string);
  await page.getByRole("button", { name: /Se connecter à mon portail/i }).click();
  await expect(page.locator("header")).toContainText(/Aliko|Getheme/i);
  await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();
}

test.describe("Tests E2E réels — authentification et production", () => {
  test("affiche le portail de connexion sans accès rapide", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Tandem/i);
    await expect(page.locator("body")).toContainText("Safir Consulting");
    await expect(page.getByRole("button", { name: /Se connecter à mon portail/i })).toBeVisible();
    await expect(page.getByText(/Connexion instantanée|Instant sign-in/i)).not.toBeVisible();
    await expect(page.getByTestId("quick-login-superadmin-btn")).not.toBeVisible();
  });

  test("rejette un mot de passe incorrect", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="email"]').first().fill(adminEmail);
    await page.locator('input[type="password"]').first().fill("mot-de-passe-invalide");
    await page.getByRole("button", { name: /Se connecter à mon portail/i }).click();

    await expect(page.locator("body")).toContainText(/Identifiants invalides|échec|incorrect/i, { timeout: 15000 });
    await expect(page.getByRole("button", { name: /Se connecter à mon portail/i })).toBeVisible();
  });

  test("connecte Aliko par le formulaire réel", async ({ page }) => {
    await loginAsAliko(page);

    await expect(page.locator("header")).toContainText("HEAD");
    await expect(page.getByRole("button", { name: /Tous les Tickets SAP/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Équipe & Capacité/i })).toBeVisible();
  });

  test("expose la santé de l’API et de PostgreSQL", async ({ request }) => {
    const response = await request.get("/api/v1/health");
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.status).toBe("ok");
    expect(health.database).toBe("up");
  });

  test("protège les données métier sans session", async ({ request }) => {
    const response = await request.get("/api/v1/tickets", {
      headers: { "Cache-Control": "no-cache" },
    });
    expect(response.status()).toBe(401);
  });

  test("autorise Aliko à consulter les tickets après authentification", async ({ page, context }) => {
    await loginAsAliko(page);

    const response = await context.request.get("/api/v1/tickets", {
      headers: { "Cache-Control": "no-cache" },
    });
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual([]);
  });

  test("affiche une base métier prête à l’emploi", async ({ page }) => {
    await loginAsAliko(page);
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();

    await expect(page.getByPlaceholder(/Rechercher par référence, titre/i)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("ADD-2026-0001");
    await expect(page.locator("body")).not.toContainText("Passerelle Import Factures");
  });

  test("déconnecte Aliko et revient au formulaire", async ({ page }) => {
    await loginAsAliko(page);
    await page.getByRole("button", { name: /Déconnexion|Se déconnecter/i }).click();

    await expect(page.getByRole("button", { name: /Se connecter à mon portail/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).not.toBeVisible();
  });
});
