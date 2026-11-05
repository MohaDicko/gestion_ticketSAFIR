import "dotenv/config";
import { test, expect } from "@playwright/test";

test.describe("Test Playwright — Onboarding Consultant, 1ère connexion & création de ticket", () => {
  test("création consultant par Admin, changement mot de passe 1ère connexion et création de ticket", async ({ page, request }) => {
    test.setTimeout(90000);

    const stamp = Date.now();
    const consultantEmail = `playwright.cons${stamp}@safirconsulting.net`;
    const initialPassword = "Safir2026!Consultant";
    const newPassword = "Playwright2026!Cons";

    // 0. Connexion Admin API pour créer le consultant temporaire
    const adminLogin = await request.post("/api/v1/auth/login", {
      data: { email: "aliko.getheme@safirconsulting.net", password: process.env.INITIAL_ADMIN_PASSWORD || "Ev@ngel10n" },
    });
    expect(adminLogin.status()).toBe(201);
    const adminPayload = await adminLogin.json();
    const csrfToken = adminPayload.csrfToken || "";

    const createConsRes = await request.post("/api/v1/consultants", {
      headers: { "x-csrf-token": csrfToken },
      data: {
        firstName: "Playwright",
        lastName: "Consultant",
        email: consultantEmail,
        organization: "Safir Consulting",
      },
    });
    expect(createConsRes.status()).toBe(201);
    const createdCons = await createConsRes.json();
    let createdTicketId: string | undefined;

    try {
      // 1. Accès au portail et connexion initiale + changement de mot de passe obligatoire via API
      const firstLoginRes = await request.post("/api/v1/auth/login", {
        data: { email: consultantEmail, password: initialPassword },
      });
      expect(firstLoginRes.status()).toBe(201);
      const firstLoginData = await firstLoginRes.json();
      expect(firstLoginData.user?.mustChangePassword).toBe(true);

      const changePwdRes = await request.post("/api/v1/auth/change-password", {
        headers: { "x-csrf-token": firstLoginData.csrfToken || "" },
        data: { currentPassword: initialPassword, newPassword },
      });
      expect([200, 201]).toContain(changePwdRes.status());

      await request.post("/api/v1/auth/logout");

      // 2. Connexion UI du consultant avec son nouveau mot de passe définitif
      await page.goto("/");
      await expect(page).toHaveTitle(/Tandem/i);

      await page.locator('input[type="email"]').first().fill(consultantEmail);
      await page.locator('input[type="password"]').first().fill(newPassword);

      const loginResponsePromise = page.waitForResponse((r) => r.url().includes("/api/v1/auth/login"));
      await page.getByRole("button", { name: /Se connecter à mon portail/i }).click();

      const loginRes = await loginResponsePromise;
      expect([200, 201]).toContain(loginRes.status());

      // 3. Attendre l'affichage de l'espace demandeur
      await expect(page.locator("body")).toContainText("Demandeur");
      await expect(page.locator("body")).toContainText("Playwright Consultant");

      // 4. Cliquer sur "Soumettre un nouveau besoin SAP"
      const submitNeedBtn = page.getByRole("button", { name: /Soumettre un nouveau besoin SAP/i });
      await expect(submitNeedBtn).toBeVisible();
      await submitNeedBtn.click();

      // 5. Remplir le formulaire de ticket
      const ticketTitle = `Demande Playwright Test ${stamp}`;
      await page.locator('input[placeholder*="Addon validation"]').fill(ticketTitle);
      await page.locator('textarea[placeholder*="Décrivez précisément"]').fill("Besoin d'intégration spécifique pour flux commercial SAP B1.");

      // 6. Enregistrer le ticket et intercepter la réponse POST
      const ticketPostPromise = page.waitForResponse(
        (r) => r.url().includes("/api/v1/tickets") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: /Enregistrer le ticket/i }).click();

      const ticketRes = await ticketPostPromise;
      const ticketData = await ticketRes.json().catch(() => null);

      expect(ticketRes.status()).toBe(201);
      expect(ticketData.reference).toBeDefined();
      createdTicketId = ticketData.id;

      // 7. Vérifier que le ticket apparaît bien dans la liste "Mes Demandes Émises"
      await expect(page.locator("body")).toContainText(ticketTitle);
    } finally {
      // Nettoyage automatique du ticket et du consultant de test
      const cleanupLogin = await request.post("/api/v1/auth/login", {
        data: { email: "aliko.getheme@safirconsulting.net", password: process.env.INITIAL_ADMIN_PASSWORD || "Ev@ngel10n" },
      });
      const cleanupData = await cleanupLogin.json().catch(() => ({}));
      const adminCsrf = cleanupData.csrfToken || "";
      if (createdTicketId) {
        await request.delete(`/api/v1/tickets/${createdTicketId}`, {
          headers: { "x-csrf-token": adminCsrf },
        });
      }
      if (createdCons?.id) {
        await request.delete(`/api/v1/consultants/${createdCons.id}`, {
          headers: { "x-csrf-token": adminCsrf },
        });
      }
    }
  });
});
