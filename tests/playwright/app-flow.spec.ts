import { test, expect } from "@playwright/test";

test.describe("Tests E2E Interface & RBAC Ticket Manager (Playwright)", () => {
  test("1. Affiche l'entête corporative Safir Consulting & le rôle HEAD par défaut", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Ticket Manager/i);

    // Vérifier l'entête Safir Consulting
    const header = page.locator("header");
    await expect(header).toContainText("Safir Consulting");
    await expect(header).toContainText("Ticket Manager");

    // Vérifier la session active par défaut (Aliko Getheme - HEAD)
    await expect(page.locator("body")).toContainText("Aliko Getheme");
    await expect(page.locator("body")).toContainText("HEAD");
  });

  test("2. Permet la navigation entre les onglets Direction (Dashboard, Tickets, Équipe, Outlook)", async ({ page }) => {
    await page.goto("/");

    // 1. Clic sur Tous les Tickets SAP
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();
    await expect(page.getByPlaceholder(/Rechercher par référence, titre/i)).toBeVisible();

    // 2. Clic sur Équipe & Capacité
    await page.getByRole("button", { name: /Équipe & Capacité/i }).click();
    await expect(page.locator("body")).toContainText("Anoop Pandimukkula");
    await expect(page.locator("body")).toContainText("Hassane Bocoum");
    await expect(page.locator("body")).toContainText("Moha Dicko");

    // 3. Clic sur Boîte Outlook M365
    await page.getByRole("button", { name: /Boîte Outlook M365/i }).click();
    await expect(page.locator("body")).toContainText("Outlook Microsoft 365");

    // 4. Retour sur Tableau de bord
    await page.getByRole("button", { name: /Tableau de bord/i }).click();
    await expect(page.locator("body")).toContainText("Capacité disponible");
  });

  test("3. Bascule de rôle RBAC vers DEVELOPER (Anoop Pandimukkula) & Espace Développeur Dédié", async ({ page }) => {
    await page.goto("/");

    // Ouvrir le menu utilisateur
    await page.locator("header button:has-text('Aliko Getheme')").click();

    // Choisir Anoop Pandimukkula (DEVELOPER)
    await page.getByRole("button", { name: /Anoop Pandimukkula/i }).click();

    // Vérifier que la session a bien basculé
    await expect(page.locator("body")).toContainText("Anoop Pandimukkula");
    await expect(page.locator("header")).toContainText("DEVELOPER");

    // Vérifier que les onglets confidentiels Direction (Outlook) sont masqués
    await expect(page.getByRole("button", { name: /Boîte Outlook M365/i })).not.toBeVisible();

    // Vérifier l'accès à l'Espace Développeur
    await expect(page.getByRole("button", { name: /Mon Espace Développeur/i })).toBeVisible();
    await expect(page.locator("body")).toContainText("Espace Développeur — Anoop Pandimukkula");
  });

  test("4. Bascule de rôle RBAC vers CONSULTANT (Mélissa Diakité) & Espace Demandes", async ({ page }) => {
    await page.goto("/");

    // Ouvrir le menu utilisateur
    await page.locator("header button:has-text('Aliko Getheme')").click();

    // Choisir Mélissa Diakité (CONSULTANT)
    await page.getByRole("button", { name: /Mélissa Diakité/i }).click();

    // Vérifier la session active
    await expect(page.locator("body")).toContainText("Mélissa Diakité");
    await expect(page.locator("header")).toContainText("CONSULTANT");

    // Vérifier l'onglet dédié Consultante
    await expect(page.getByRole("button", { name: /Mes Demandes Émises/i })).toBeVisible();
    await expect(page.locator("body")).toContainText("Espace Consulting SAP — Mélissa Diakité");
  });

  test("5. Teste la recherche et le filtrage des tickets SAP", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();

    const searchInput = page.getByPlaceholder(/Rechercher par référence, titre/i);
    await searchInput.fill("Factures");

    // Vérifier que les résultats contiennent la passerelle de factures
    await expect(page.locator("body")).toContainText("Passerelle Import Factures");

    // Réinitialiser la recherche
    await searchInput.fill("");
    await expect(page.locator("body")).toContainText("ADD-2026-0001");
  });

  test("6. Ouverture et affichage de la modale de création de ticket", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Nouveau ticket/i }).click();

    // Vérifier l'apparition de la modale
    await expect(page.getByText("Nouveau Ticket de Développement SAP")).toBeVisible();
    await expect(page.getByText("Titre de la demande *")).toBeVisible();
    await expect(page.getByText("Estimation (heures)")).toBeVisible();

    // Fermeture de la modale via Annuler
    await page.getByRole("button", { name: /Annuler/i }).click();
    await expect(page.getByText("Nouveau Ticket de Développement SAP")).not.toBeVisible();
  });

  test("7. Permet à Aliko (HEAD) d'ajouter un nouveau développeur à son équipe et rafraîchit l'effectif", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Équipe & Capacité/i }).click();

    // Vérifier présence du bouton Ajouter un Développeur
    const addDevBtn = page.getByRole("button", { name: /Ajouter un Développeur/i });
    await expect(addDevBtn).toBeVisible();
    await addDevBtn.click();

    // Vérifier l'apparition de la modale
    await expect(page.getByText("Intégrer un Développeur dans l'Équipe")).toBeVisible();

    // Remplir les informations
    await page.getByPlaceholder("ex : Amadou").fill("Amadou");
    await page.getByPlaceholder("ex : Coulibaly").fill("Coulibaly");
    await page.getByPlaceholder("amadou.coulibaly@safirconsulting.net").fill("amadou.coulibaly@safirconsulting.net");

    // Valider l'ajout
    await page.getByRole("button", { name: /Intégrer le Développeur/i }).click();

    // Vérifier la présence du nouveau développeur dans la grille
    await expect(page.locator("body")).toContainText("Amadou Coulibaly");
    await expect(page.locator("body")).toContainText("amadou.coulibaly@safirconsulting.net");
  });
});
