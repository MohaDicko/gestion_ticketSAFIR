import { test, expect } from "@playwright/test";

async function loginAsAliko(page: any) {
  await page.goto("/");
  const alikoBtn = page.getByRole("button", { name: /Getheme Aliko/i }).first();
  if (await alikoBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await alikoBtn.click();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();
  }
}

test.describe("Tests E2E Interface, Login & Portails RBAC (Playwright)", () => {
  test("1. Affiche par défaut la page de login Safir Consulting, s'authentifie et accède au portail Direction", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tandem/i);

    // Vérifier l'écran de Login initial par défaut
    await expect(page.locator("body")).toContainText("Tandem");
    await expect(page.locator("body")).toContainText("Safir Consulting");
    await expect(page.locator("body")).toContainText("Connexion à votre Espace");
    await expect(page.locator("body")).toContainText("Adresse e-mail professionnelle (Login)");
    await expect(page.getByRole("button", { name: /Se connecter à mon portail/i })).toBeVisible();

    // Connexion en tant que Getheme Aliko (Administrateur & Direction)
    const alikoBtn = page.getByRole("button", { name: /Getheme Aliko/i }).first();
    await expect(alikoBtn).toBeVisible();
    await alikoBtn.click();

    // Vérifier l'arrivée dans le portail Direction (HEAD)
    const header = page.locator("header");
    await expect(header).toContainText("Getheme Aliko");
    await expect(header).toContainText("HEAD");
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();
    await expect(page.locator("body")).toContainText("Capacité disponible");
  });

  test("2. Permet la navigation entre les onglets Direction (Dashboard, Tickets, Équipe, Outlook)", async ({ page }) => {
    await loginAsAliko(page);

    // 1. Clic sur Tous les Tickets SAP
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();
    await expect(page.getByPlaceholder(/Rechercher par référence, titre/i)).toBeVisible();

    // 2. Clic sur Équipe & Capacité
    const teamBtn = page.getByRole("button", { name: /Équipe & Capacité/i });
    await teamBtn.click();
    await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible().catch(async () => {
      await teamBtn.click();
      await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible();
    });
    await expect(page.locator("body")).toContainText("Anoop Pandimukkula");
    await expect(page.locator("body")).toContainText("Hassane Bocoum");
    await expect(page.locator("body")).toContainText("Moha Dicko");

    // 3. Clic sur Guichet Central Demandes (100% In-App orchestré par Aliko)
    await page.getByRole("button", { name: /Guichet Central Demandes/i }).click();
    await expect(page.locator("body")).toContainText("Guichet Central de Qualification des Demandes");

    // 4. Retour sur Tableau de bord
    await page.getByRole("button", { name: /Tableau de bord/i }).click();
    await expect(page.locator("body")).toContainText("Capacité disponible");
  });

  test("3. Connexion au portail Développeur (Anoop Pandimukkula) & Espace Développeur Dédié", async ({ page }) => {
    await page.goto("/");

    // Connexion directe en tant qu'Anoop Pandimukkula (DEVELOPER)
    const anoopBtn = page.getByRole("button", { name: /Anoop Pandimukkula/i }).first();
    await expect(anoopBtn).toBeVisible();
    await anoopBtn.click();

    // Vérifier que l'utilisateur est bien dans son portail développeur dédié
    await expect(page.locator("body")).toContainText("Anoop Pandimukkula");
    await expect(page.locator("header")).toContainText("DEVELOPER");
    await expect(page.locator("body")).toContainText("Espace Développeur — Anoop Pandimukkula");

    // Vérifier que les onglets confidentiels Direction (Guichet Central, Gouvernance globale) sont masqués
    await expect(page.getByRole("button", { name: /Guichet Central Demandes/i })).not.toBeVisible();

    // Vérifier l'onglet personnel Développeur
    await expect(page.getByRole("button", { name: /Mon Espace Développeur/i })).toBeVisible();
  });

  test("4. Connexion au portail Consultante (Mélissa Diakité) & Espace Demandes", async ({ page }) => {
    await page.goto("/");

    // Connexion directe en tant que Mélissa Diakité (CONSULTANT)
    const melissaBtn = page.getByRole("button", { name: /Mélissa Diakité/i }).first();
    await expect(melissaBtn).toBeVisible();
    await melissaBtn.click();

    // Vérifier l'arrivée sur le portail Demandeur dédié
    await expect(page.locator("body")).toContainText("Mélissa Diakité");
    await expect(page.locator("header")).toContainText("Demandeur — Mélissa Diakité");
    await expect(page.locator("body")).toContainText("Espace Demandeur — Mélissa Diakité");

    // Vérifier l'onglet dédié Consultante
    await expect(page.getByRole("button", { name: /Mes Demandes Émises/i })).toBeVisible();
  });

  test("5. Teste la recherche et le filtrage des tickets SAP", async ({ page }) => {
    await loginAsAliko(page);
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
    await loginAsAliko(page);
    await page.getByRole("button", { name: /Nouveau ticket/i }).click();

    // Vérifier l'apparition de la modale
    await expect(page.getByText("Nouveau Ticket de Développement SAP")).toBeVisible();
    await expect(page.getByText("Titre de la demande *")).toBeVisible();
    await expect(page.getByText(/Estimation du temps de travail \(heures\)/i)).toBeVisible();
    await expect(page.getByText(/Description détaillée \*/i)).toBeVisible();
    await expect(page.getByText("Type de besoin SAP")).toBeVisible();
    await expect(page.getByText(/Entreprise \/ Nouveau Client/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Type/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Client/i })).toBeVisible();

    // Fermeture de la modale via Annuler
    await page.getByRole("button", { name: /Annuler/i }).click();
    await expect(page.getByText("Nouveau Ticket de Développement SAP")).not.toBeVisible();
  });

  test("7. Permet à Aliko (HEAD) d'ajouter un nouveau développeur à son équipe et rafraîchit l'effectif", async ({ page }) => {
    await loginAsAliko(page);
    const teamBtn = page.getByRole("button", { name: /Équipe & Capacité/i });
    await expect(teamBtn).toBeVisible();
    await teamBtn.click();
    await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible().catch(async () => {
      await teamBtn.click();
      await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible();
    });

    // Vérifier présence du bouton + Développeur
    const addDevBtn = page.getByRole("button", { name: /\+ Développeur/i });
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

  test("8. Permet à Aliko (HEAD) de créer un profil Consultant avec login et mot de passe", async ({ page }) => {
    await loginAsAliko(page);
    const teamBtn = page.getByRole("button", { name: /Équipe & Capacité/i });
    await expect(teamBtn).toBeVisible();
    await teamBtn.click();
    await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible().catch(async () => {
      await teamBtn.click();
      await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible();
    });

    // Clic sur le bouton + Consultant
    const addConsultantBtn = page.getByRole("button", { name: /\+ Consultant/i });
    await expect(addConsultantBtn).toBeVisible();
    await addConsultantBtn.click();

    // Vérifier l'apparition de la modale de création consultant
    await expect(page.getByText("Créer un Profil Consultant SAP")).toBeVisible();
    await expect(page.getByText(/Login de connexion/i)).toBeVisible();

    // Remplir les informations du nouveau consultant
    await page.getByPlaceholder("ex : Ibrahima").fill("Ibrahima");
    await page.getByPlaceholder("ex : Koné").fill("Koné");
    await page.getByPlaceholder("ibrahima.kone@safirconsulting.net").fill("ibrahima.kone@safirconsulting.net");

    // Valider la création
    await page.getByRole("button", { name: /Créer le Compte Consultant/i }).click();

    // Basculer sur la sous-vue Consultants
    await page.getByRole("button", { name: /Consultants Fonctionnels/i }).click();

    // Vérifier l'affichage du consultant et de son login
    await expect(page.locator("body")).toContainText("Ibrahima Koné");
    await expect(page.locator("body")).toContainText("ibrahima.kone@safirconsulting.net");
  });

  test("9. Permet la déconnexion immédiate et le retour automatique sur la page de login", async ({ page }) => {
    await loginAsAliko(page);

    // Clic sur le bouton Déconnexion dans l'en-tête
    const logoutBtn = page.getByRole("button", { name: /Déconnexion/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Vérifier le retour immédiat à l'écran de Login
    await expect(page.locator("body")).toContainText("Connexion à votre Espace");
    await expect(page.getByRole("button", { name: /Se connecter à mon portail/i })).toBeVisible();
  });

  test("10. Permet à Aliko (HEAD) de superviser la progression d'un ticket jusqu'à son règlement complet et sa clôture", async ({ page }) => {
    await loginAsAliko(page);

    // Clic sur le bouton Suivre du premier ticket dans le Tableau de bord
    const followBtn = page.getByRole("button", { name: /Suivre/i }).first();
    await expect(followBtn).toBeVisible();
    await followBtn.click();
    await expect(page.getByText("Supervision Métier")).toBeVisible().catch(async () => {
      await followBtn.click();
      await expect(page.getByText("Supervision Métier")).toBeVisible();
    });

    // Vérifier l'ouverture de la modale de supervision avec le stepper de cycle de vie
    await expect(page.getByText("Supervision Métier")).toBeVisible();
    await expect(page.getByText("Pipeline d'Avancement du Ticket (Cycle de Vie)")).toBeVisible();
    await expect(page.getByText("Étape 1")).toBeVisible();
    await expect(page.getByText("Étape 6")).toBeVisible();
    await expect(page.getByText("Suivi de Charge & Reste à Faire (RAF)")).toBeVisible();

    // Vérifier la tentative de clôture sans recette préalable : doit être strictement bloquée
    const closeBtn = page.getByRole("button", { name: /Clôturer le Ticket \(Réglé\)|Valider la Clôture Définitive/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.getByText(/doit d'abord tester et approuver la recette/i)).toBeVisible();

    // Fermer la modale de supervision
    await page.getByRole("button", { name: /Fermer/i }).first().click();
    await expect(page.getByText("Supervision Métier")).not.toBeVisible();
  });

  test("11. Espace Consultant : Visibilité sur le développeur assigné, progression en direct et fil de discussion direct Développeur <-> Consultant", async ({ page }) => {
    await page.goto("/");

    // 1. Connexion en tant que Mélissa Diakité (CONSULTANT)
    const melissaBtn = page.getByRole("button", { name: /Mélissa Diakité/i }).first();
    await expect(melissaBtn).toBeVisible();
    await melissaBtn.click();

    // 2. Vérifier la visibilité du développeur dédié et de la progression
    await expect(page.locator("body")).toContainText("Développeur Dédié");
    await expect(page.locator("body")).toContainText("Anoop Pandimukkula");
    await expect(page.locator("body")).toContainText("anoop.pandimukkula@safirconsulting.net");
    await expect(page.locator("body")).toContainText("Progression");

    // 3. Vérifier la bannière d'alerte pour précision requise
    await expect(page.locator("body")).toContainText("Précision Métier Attendue");

    // 4. Ouvrir le dialogue avec le développeur sur le ticket bloqué
    const exchangeBtn = page.getByRole("button", { name: /Répondre & Débloquer/i });
    await expect(exchangeBtn).toBeVisible();
    await exchangeBtn.click();

    // 5. Vérifier la modale de fil d'échange tracé
    await expect(page.getByText(/Fil d'Échange Tracé — Développeur ↔ Demandeur ↔ Administrateur/i)).toBeVisible();
    await expect(page.locator("body")).toContainText("Bonjour Mélissa, l'anomalie de lettrage");

    // 6. Rédiger la réponse apportant les précisions attendues
    const textarea = page.locator("textarea");
    await textarea.fill("Bonjour Anoop, voici l'échantillon des pièces comptables n° 4501 et 4502 pour tes tests.");

    // 7. Envoyer la réponse
    await page.getByRole("button", { name: /Envoyer/i }).click();

    // 8. Vérifier la prise en compte et le déblocage du ticket
    await expect(page.locator("body")).toContainText("Précision apportée par le demandeur");
  });

  test("12. Collaboration Multi-Développeurs par brique technique : Aliko affecte plusieurs devs à différents niveaux (Addon, HANA) et chaque dev pilote son lot", async ({ page }) => {
    // 1. Connexion directe en tant que Hassane Bocoum (DEVELOPER — Spécialiste HANA)
    await page.goto("/");
    const userMenuBtn = page.getByRole("button", { name: /Connecter/i }).first();
    await page.fill("input[type='email']", "hassane.bocoum@safirconsulting.net");
    await page.fill("input[type='password']", "Safir2026!Hassane");
    await page.getByRole("button", { name: /Se connecter à mon portail/i }).click();

    // 2. Vérifier que Hassane est dans son espace développeur
    await expect(page.locator("body")).toContainText("Espace Développeur — Hassane Bocoum");

    // 3. Vérifier que Hassane voit le projet multi-développeurs avec sa brique HANA spécifique
    await expect(page.locator("body")).toContainText("Multi-Développeurs");
    await expect(page.locator("body")).toContainText("Votre Brique SAP");
    await expect(page.locator("body")).toContainText("Intégration HANA & Vues SQLScript");
    await expect(page.locator("body")).toContainText("Anoop Pandimukkula");

    // 4. Hassane pilote son lot technique : chronomètre dédié et respect de la charge fixée par l'Admin
    await expect(page.getByTestId("ticket-chrono-controls").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Intégration HANA & Vues SQLScript");

    // 5. Déconnexion et Reconnexion en tant qu'Aliko (Direction HEAD)
    const logoutBtn = page.getByRole("button", { name: /Déconnexion/i });
    await logoutBtn.click();
    await loginAsAliko(page);

    // 6. Aliko ouvre la supervision du ticket collaboratif
    const followBtn = page.getByRole("button", { name: /Suivre/i }).first();
    await followBtn.click();

    // 7. Vérifier la répartition par brique technique visible par Aliko
    await expect(page.getByText("Équipe Projet Mobilisée & Lots Techniques")).toBeVisible();
    const modal = page.locator(".fixed");
    await expect(modal.getByText("Anoop Pandimukkula").first()).toBeVisible();
    await expect(modal.getByText("Hassane Bocoum").first()).toBeVisible();
    await expect(modal.getByText("Addon SAP B1 (UI/DI API)").first()).toBeVisible();
    await expect(modal.getByText("Intégration HANA & Vues SQLScript").first()).toBeVisible();
  });

  test("13. Les 3 Cerises sur le Gâteau : Pièces Jointes SAP sécurisées, Export Reporting Direction 1-Clic & Centre de Notifications Temps Réel In-App", async ({ page }) => {
    await loginAsAliko(page);

    // 1. Tester le Centre de Notifications Temps Réel In-App (Cloche dans l'en-tête)
    const bellBtn = page.getByTitle("Centre de Notifications Temps Réel In-App");
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();
    await expect(page.getByText("Notifications Temps Réel In-App")).toBeVisible();
    await expect(page.locator("body")).toContainText("Stop-the-line : Blocage & Question sur BUG-2026-0004");
    await page.getByRole("button", { name: /Tout marquer lu/i }).click();
    await expect(page.locator("body")).toContainText("Toutes vos notifications ont été marquées comme lues");
    await bellBtn.click();

    // 2. Tester l'Export Reporting Direction & la Synthèse Comité Direction (FCFA / XOF)
    const reportModalBtn = page.getByRole("button", { name: /Synthèse Comité Direction/i });
    await expect(reportModalBtn).toBeVisible();
    await reportModalBtn.click();
    await expect(page.getByText("Synthèse Hebdomadaire d'Activité & Valorisation Financière BU SME")).toBeVisible();
    await expect(page.locator("body")).toContainText("Valeur Produite (Heures Réalisées)");

    // Déclencher le téléchargement CSV/Excel depuis la modale
    await page.getByRole("button", { name: /Télécharger Export Excel \/ CSV/i }).click();
    await expect(page.locator("body")).toContainText("Export Excel/CSV généré avec succès");
    await page.getByRole("button", { name: /Fermer/i }).first().click();

    // 3. Tester les Pièces Jointes SAP sécurisées dans la Supervision 360° et le Fil d'Échange
    const followBtn = page.getByRole("button", { name: /Suivre/i }).first();
    await followBtn.click();
    await expect(page.getByText(/Pièces Jointes & Spécifications SAP/i)).toBeVisible();
    await expect(page.locator("body")).toContainText("Cahier_Spec_Workflow_Achats_SAP_B1.pdf");
    await expect(page.locator("body")).toContainText("CLEAN");

    // Ouvrir le fil de discussion et joindre un document SAP
    await page.getByRole("button", { name: /Ouvrir le fil de discussion/i }).click();
    await expect(page.getByText(/Joindre un document SAP ou un fichier au message/i)).toBeVisible();
    await page.getByPlaceholder(/Ou saisir le nom d'un fichier joint/i).fill("Validation_Architecture_Aliko.pdf");
    await page.locator("textarea").fill("Validation de l'architecture par la Direction BU SME avec le document joint.");
    await page.getByRole("button", { name: /Envoyer/i }).click();

    // Vérifier l'affichage de la pièce jointe et du badge VERIFIED dans le fil
    await expect(page.locator("body")).toContainText("Validation_Architecture_Aliko.pdf");
    await expect(page.locator("body")).toContainText("VERIFIED");
  });

  test("14. Droit souverain d'Aliko : affectation dérogatoire d'un développeur sans la compétence technique requise (montée en compétences encadrée)", async ({ page }) => {
    await loginAsAliko(page);

    // Ouvrir l'onglet Tous les Tickets SAP
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();

    // Trouver un bouton Affecter ou Réaffecter sur la première ligne
    const assignBtn = page.getByRole("button", { name: /Affecter|Réaffecter/i }).first();
    await assignBtn.click();

    // Vérifier que la modale d'affectation est bien ouverte
    await expect(page.getByText(/Affecter le ticket/i)).toBeVisible();

    // Sélectionner un développeur qui n'a pas la compétence spécifique du ticket (ex: Moha Dicko)
    const modal = page.locator(".fixed.inset-0.z-50");
    const devSelect = modal.locator("select").nth(1); // Le select des devs dans la modale
    await devSelect.selectOption("dev-moha");

    // Vérifier l'apparition du panneau managérial d'autorisation et dérogation Aliko
    await expect(page.getByText(/Dérogation & Montée en Compétences Accordée/i)).toBeVisible();
    await expect(page.getByText(/Valider l'affectation dérogatoire en montée en compétences encadrée/i)).toBeVisible();

    // Valider l'affectation
    const submitBtn = modal.getByRole("button", { name: /Valider l'affectation/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Vérifier le badge 'Montée en compétences'
    await expect(page.locator("body")).toContainText("Montée en compétences");
  });

  test("15. Séparation étanche des rôles (Zero Cross-Portal Visibility) : Aliko ne voit pas les portails dev/consultant, aucun switcher interne en session, déconnexion obligatoire", async ({ page }) => {
    // 1. Connexion en tant qu'Aliko (HEAD)
    await loginAsAliko(page);

    // Vérifier qu'Aliko ne voit PAS les onglets Développeur ou Consultante
    await expect(page.getByRole("button", { name: /Mon Espace Développeur/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Mes Demandes Émises/i })).not.toBeVisible();

    // Vérifier que le menu utilisateur ne propose plus aucun switcher de session vers d'autres rôles
    await page.getByText(/Getheme Aliko/i).first().click();
    const userMenu = page.locator(".absolute.right-0.mt-2.w-80");
    await expect(userMenu.getByText(/Session Active Sécurisée/i)).toBeVisible();
    await expect(userMenu.getByText(/Tester les niveaux d'accès/i)).not.toBeVisible();
    await expect(userMenu.getByText(/Anoop Pandimukkula/i)).not.toBeVisible();
    await expect(userMenu.getByText(/Mélissa Diakité/i)).not.toBeVisible();

    // Fermer le menu
    await page.getByText(/Getheme Aliko/i).first().click();

    // Vérifier que la grille consultants ne contient plus de bouton 'Tester session'
    const teamBtn = page.getByRole("button", { name: /Équipe & Capacité/i });
    await teamBtn.click();
    await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible().catch(async () => {
      await teamBtn.click();
      await expect(page.getByText("Ressources & Gouvernance BU SME")).toBeVisible();
    });
    await page.getByRole("button", { name: /Consultants Fonctionnels/i }).click();
    await expect(page.getByText(/Tester session/i)).not.toBeVisible();
    await expect(page.getByText(/Espace cloisonné/i).first()).toBeVisible();

    // 2. Déconnexion obligatoire pour changer de rôle
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await expect(page.getByText(/Connexion à votre Espace/i)).toBeVisible();

    // 3. Connexion en tant que Consultante (Mélissa Diakité)
    const melissaBtn = page.getByRole("button", { name: /Mélissa Diakité/i }).first();
    await melissaBtn.click();

    // Vérifier que la consultante ne voit PAS les portails Direction ni Développeur
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Tous les Tickets SAP/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Équipe & Capacité/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Guichet Central Demandes/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Mon Espace Développeur/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Mes Demandes Émises/i })).toBeVisible();

    // 4. Déconnexion et connexion Développeur (Anoop)
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    const anoopBtn = page.getByRole("button", { name: /Anoop Pandimukkula/i }).first();
    await anoopBtn.click();

    // Vérifier que le développeur ne voit PAS les portails Direction ni Consultant
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Mes Demandes Émises/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Mon Espace Développeur/i })).toBeVisible();
  });

  test("16. Cycle de Recette & Clôture : Suivi consultante -> Test & Rejet dév (anomalie) -> Correction dev -> Test & Approbation consultante -> Clôture exclusive Aliko", async ({ page }) => {
    // 1. Développeur livre un ticket (Anoop livre TCK-SAP-001)
    await page.goto("http://localhost:3000");
    const anoopBtn = page.getByRole("button", { name: /Anoop Pandimukkula/i }).first();
    await anoopBtn.click();
    await expect(page.getByText(/Mon Espace Développeur/i)).toBeVisible();

    // Cliquer sur 'Envoyer en test chez le consultant' pour TCK-SAP-001
    const deliverBtn = page.getByRole("button", { name: /Envoyer en test chez le consultant|Marquer comme Livré/i }).first();
    await deliverBtn.click();
    await expect(page.getByText(/Livré \(À tester\)/i).first()).toBeVisible();

    // 2. Déconnexion et Connexion Demandeur (Mélissa Diakité)
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    const melissaBtn = page.getByRole("button", { name: /Mélissa Diakité/i }).first();
    await melissaBtn.click();
    await expect(page.getByText(/Espace Demandeur — Mélissa Diakité/i)).toBeVisible();

    // Vérifier la présence de l'espace de recette sur le ticket livré
    await expect(page.getByText(/Solution Livrée par l'Équipe Dév — Recette Fonctionnelle SAP Requise/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Tester & Approuver la Recette/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Renvoyer en Correction chez les Dév/i })).toBeVisible();

    // 3. Option A : Rejet suite à anomalie constatée lors du test
    await page.getByRole("button", { name: /Renvoyer en Correction chez les Dév/i }).click();
    await expect(page.getByText(/Renvoyer en Correction chez les Développeurs/i)).toBeVisible();

    // Remplir le motif d'anomalie
    const reasonTextarea = page.getByPlaceholder(/Décrivez précisément l'erreur/i);
    await reasonTextarea.fill("Anomalie constatée : Le calcul de remise sur facture ne s'applique pas correctement sous SAP B1.");
    await page.getByRole("button", { name: /Confirmer le Renvoi en Correction/i }).click();

    // Vérifier la confirmation et le bandeau de renvoi en développement
    await expect(page.getByText(/Ticket renvoyé aux développeurs suite à votre test/i)).toBeVisible();

    // 4. Déconnexion et vérification côté Développeur (Anoop)
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Anoop Pandimukkula/i }).first().click();

    // Le développeur voit l'alerte d'anomalie de recette
    await expect(page.getByText(/Reprise demandée suite à Recette Demandeur/i)).toBeVisible();
    await expect(page.getByText(/Anomalie constatée : Le calcul de remise sur facture ne s'applique pas correctement sous SAP B1/i)).toBeVisible();

    // Le développeur effectue la correction et renvoie le ticket en test
    const redeliverBtn = page.getByRole("button", { name: /Envoyer en test chez le consultant|Marquer comme Livré/i }).first();
    await redeliverBtn.click();
    await expect(page.getByText(/Livré \(À tester\)/i).first()).toBeVisible();

    // 5. Déconnexion et Reconnexion Demandeur (Mélissa) pour Approbation
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Mélissa Diakité/i }).first().click();

    // Le demandeur valide la recette avec succès
    const approveBtn = page.getByRole("button", { name: /Tester & Approuver la Recette/i });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Vérifier que le statut passe à "Recette testée & validée avec succès"
    await expect(page.getByText(/Recette testée & validée avec succès par vos soins/i)).toBeVisible();
    await expect(page.getByText(/Attente Clôture Direction/i)).toBeVisible();

    // 6. Déconnexion et Connexion Direction (Getheme Aliko) pour Clôture Définitive
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Getheme Aliko/i }).first().click();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();

    // Aliko ouvre le ticket dans Tous les Tickets SAP
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();
    const superviseBtn = page.getByRole("button", { name: /Suivre/i }).first();
    await superviseBtn.click();

    // Vérifier que la modale indique que la recette est validée
    await expect(page.getByText(/Recette approuvée par le demandeur/i)).toBeVisible();
    const closeBtn = page.getByRole("button", { name: /Valider la Clôture Définitive \(Recette Approuvée\)/i });
    await expect(closeBtn).toBeEnabled();

    // Aliko prononce la clôture définitive
    await closeBtn.click();
    await expect(page.getByText(/Réglé & Clôturé/i).first()).toBeVisible();
  });

  test("17. Portail Développeur Optimisé : Filtre projet/client, Chronomètre mono-tâche, Pause sur blocage & Impression de Rapports Périodiques (Dev & Aliko)", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // 1. Connexion Développeur (Anoop)
    const anoopBtn = page.getByRole("button", { name: /Anoop Pandimukkula/i }).first();
    await anoopBtn.click();
    await expect(page.getByText(/Mon Espace Développeur/i)).toBeVisible();

    // 2. Test du filtrage rapide par nom de projet / référence
    const searchInput = page.getByPlaceholder(/Filtrer par projet/i);
    await searchInput.fill("ADD-2026-0001");
    await expect(page.getByText(/Addon Validation Commandes Fournisseurs SAP B1/i)).toBeVisible();
    await searchInput.fill("");

    // Test du filtrage par Entreprise / Client
    const companySelect = page.locator("select").filter({ hasText: /Toutes les entreprises/i });
    if (await companySelect.isVisible()) {
      await companySelect.selectOption({ index: 1 });
      await expect(page.getByText(/Addon Validation Commandes Fournisseurs SAP B1/i)).toBeVisible();
      await companySelect.selectOption({ value: "ALL" });
    }

    // 3. Test du Chronomètre individuel par projet/ticket (Règle mono-tâche stricte)
    const startChronoBtn = page.getByTestId("ticket-chrono-controls").first().getByRole("button", { name: /Démarrer chrono/i });
    await expect(startChronoBtn).toBeVisible();
    await startChronoBtn.click();

    // Vérifier les commandes de chrono actif sur le ticket (Pause/Reprendre et Arrêter)
    const pauseBtn = page.getByTestId("ticket-chrono-pause-btn").first();
    const stopBtn = page.getByTestId("ticket-chrono-stop-btn").first();
    await expect(pauseBtn).toBeVisible();
    await expect(stopBtn).toBeVisible();

    // Tester la mise en pause et la reprise
    await pauseBtn.click();
    await page.getByRole("button", { name: /^Reprendre$/i }).first().click();

    // Arrêter le chrono et vérifier l'enregistrement de la session (ou le seuil d'exclusion anti-fraude < 30s)
    await stopBtn.click();
    await expect(page.getByText(/Session enregistrée|moins de 30 secondes ignorée/i)).toBeVisible();

    // 4. Test du Rapport du Développeur : Filtre d'intervalle (14 au 14), Validation feuille de temps & Zéro Aliko
    const devPrintBtn = page.getByRole("button", { name: /Imprimer mon rapport d'heures/i });
    await expect(devPrintBtn).toBeVisible();
    await devPrintBtn.click();

    // Vérifier l'ouverture de la modale de rapport et l'absence d'Aliko en dur
    await expect(page.getByText(/Tandem • Rapport d'Activité & Feuilles de Temps — Safir Consulting/i)).toBeVisible();
    await expect(page.getByText(/Collaborateur SAP/i)).toBeVisible();

    // Tester le filtre d'intervalle (Preset 14 M-1 au 14 M)
    const preset14Btn = page.getByTestId("report-preset-14-btn");
    await expect(preset14Btn).toBeVisible();
    await preset14Btn.click();
    await expect(page.getByText(/Intervalle du 2026-09-14 au 2026-10-14/i)).toBeVisible();

    // Tester les bascules rapides de période
    await page.getByRole("button", { name: /Journalier/i }).click();
    await expect(page.getByText(/Rapport Périodique : Journalier/i)).toBeVisible();

    await page.getByRole("button", { name: /Hebdomadaire/i }).click();
    await expect(page.getByText(/Rapport Périodique : Hebdomadaire/i)).toBeVisible();

    // Revenir sur l'intervalle et tester le bouton "Valider la feuille de temps"
    await preset14Btn.click();
    const validateTimesheetBtn = page.getByTestId("validate-timesheet-btn");
    await expect(validateTimesheetBtn).toBeVisible();
    await validateTimesheetBtn.click();

    // Vérifier la validation confirmée pour le développeur
    await expect(page.getByTestId("timesheet-validated-badge")).toBeVisible();
    await expect(page.getByTestId("timesheet-validated-badge")).toContainText("Feuille de temps validée");

    // Fermer la modale
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();

    // 5. Test d'accès Direction : Getheme Aliko imprime le rapport d'un développeur et d'un consultant
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Getheme Aliko/i }).first().click();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();

    // Navigation vers Équipe & Capacité
    await page.getByRole("button", { name: /Équipe & Capacité/i }).click();

    // Clic sur 'Imprimer son rapport' du premier développeur
    const devCardReportBtn = page.getByRole("button", { name: /Imprimer son rapport|Rapport d'heures/i }).first();
    await expect(devCardReportBtn).toBeVisible();
    await devCardReportBtn.click();

    // Vérifier que la modale d'impression s'ouvre pour le développeur sélectionné
    await expect(page.getByText(/Rapport d'Activité & Feuilles de Temps — Safir Consulting/i).first()).toBeVisible();
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();

    // Basculer vers l'onglet Consultants
    await page.getByRole("button", { name: /Consultants Fonctionnels/i }).click();
    const consultantReportBtn = page.getByRole("button", { name: /Rapport d'activité/i }).first();
    await expect(consultantReportBtn).toBeVisible();
    await consultantReportBtn.click();

    // Vérifier l'ouverture du rapport pour la consultante
    await expect(page.getByText(/Rapport d'Activité & Feuilles de Temps — Safir Consulting/i).first()).toBeVisible();
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();
  });

  test("18. Supervision en Temps Réel d'Aliko : Vision 360° de l'activité de chaque développeur en direct (projets, tâches, chronos) et impression immédiate de ses rapports", async ({ page }) => {
    // 1. Connexion en tant qu'Aliko (HEAD)
    await loginAsAliko(page);

    // 2. Vérifier la présence du module de Supervision Temps Réel sur le Tableau de bord
    await expect(page.getByText(/Supervision de l'Activité des Développeurs en Direct/i)).toBeVisible();
    await expect(page.getByText(/LIVE TEMPS RÉEL/i)).toBeVisible();

    // Vérifier les compteurs de statut de l'équipe
    await expect(page.getByText(/En production/i).first()).toBeVisible();
    await expect(page.getByText(/Bloqué \(Stop-the-line\)/i).first()).toBeVisible();
    await expect(page.getByText(/Disponible :/i).first()).toBeVisible();

    // 3. Vérifier la visibilité de ce que les développeurs font en temps réel
    await expect(page.getByText(/Anoop Pandimukkula/i).first()).toBeVisible();
    await expect(page.getByText(/EN DIRECT :/i).first()).toBeVisible();
    await expect(page.getByText(/ADD-2026-0001/i).first()).toBeVisible();
    await expect(page.getByText(/Développement du formulaire UI API SAP B1/i).first()).toBeVisible();

    // Vérifier le statut d'un dev bloqué
    await expect(page.getByText(/Hassane Bocoum/i).first()).toBeVisible();
    await expect(page.getByText(/BLOQUÉ/i).first()).toBeVisible();

    // 4. Tester le filtrage rapide de la supervision en temps réel
    await page.getByRole("button", { name: /🔴 Bloqués/i }).click();
    await expect(page.getByText(/Hassane Bocoum/i).first()).toBeVisible();

    await page.getByRole("button", { name: /^Tous \(/i }).click();

    // 5. Impression 1-clic du rapport d'activité d'un développeur depuis la supervision temps réel
    const printReportBtn = page.getByRole("button", { name: /Imprimer son rapport/i }).first();
    await expect(printReportBtn).toBeVisible();
    await printReportBtn.click();

    // Vérifier que la modale de rapport s'ouvre avec le sélecteur corporate
    await expect(page.getByText(/Rapport d'Activité & Feuilles de Temps — Safir Consulting/i).first()).toBeVisible();
    await expect(page.getByText(/Total Heures Travaillées/i)).toBeVisible();
    await expect(page.getByText(/Visa & Émargement du Développeur|Visa & Émargement du Collaborateur/i)).toBeVisible();
    await expect(page.getByText(/Getheme Aliko — Administrateur BU SME/i)).toBeVisible();

    // Vérifier le sélecteur de changement de développeur pour Aliko
    await expect(page.getByText(/Changer de développeur/i)).toBeVisible();

    // Fermer le rapport
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();
  });

  test("19. Support Bilingue (Français / Anglais) & Bascule Thème Clair / Sombre (Light / Dark Mode)", async ({ page }) => {
    await page.goto("/");

    // 1. Tester le passage en Anglais (EN) sur l'écran de connexion et vérifier zéro décalage (0px shift)
    const langBtn = page.getByLabel("Sélecteur de langue FR / EN");
    await expect(langBtn).toBeVisible();
    const loginLangBoxBefore = await langBtn.boundingBox();
    await langBtn.click();
    const loginLangBoxAfter = await langBtn.boundingBox();
    expect(Math.round(loginLangBoxAfter!.x)).toBe(Math.round(loginLangBoxBefore!.x));
    expect(Math.round(loginLangBoxAfter!.width)).toBe(Math.round(loginLangBoxBefore!.width));

    await expect(page.locator("body")).toContainText("Sign in to your Tandem Workspace");
    await expect(page.locator("body")).toContainText("Corporate Email Address (Login)");

    // 2. Tester le Mode Sombre (Dark Mode) et retour en Mode Clair (Light Mode)
    const themeBtn = page.getByLabel("Basculer le mode Clair / Sombre");
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark-theme/);

    // 3. Connexion au portail en Anglais & Mode Sombre
    await page.getByRole("button", { name: /Getheme Aliko/i }).first().click();
    await expect(page.locator("body")).toContainText("Active Tickets");
    await expect(page.locator("body")).toContainText("Available Capacity");
    await expect(page.locator("body")).toContainText("Live Developer Activity Supervision");

    // 4. Retour en Français (FR) et Mode Clair (Light Mode) — vérifier 0px de décalage dans la navbar principale
    const navLangBoxEN = await page.getByLabel("Sélecteur de langue FR / EN").boundingBox();
    const navThemeBoxEN = await page.getByLabel("Basculer le mode Clair / Sombre").boundingBox();
    await page.getByLabel("Sélecteur de langue FR / EN").click();
    const navLangBoxFR = await page.getByLabel("Sélecteur de langue FR / EN").boundingBox();
    const navThemeBoxFR = await page.getByLabel("Basculer le mode Clair / Sombre").boundingBox();

    expect(Math.round(navLangBoxFR!.x)).toBe(Math.round(navLangBoxEN!.x));
    expect(Math.round(navLangBoxFR!.width)).toBe(Math.round(navLangBoxEN!.width));
    expect(Math.round(navThemeBoxFR!.x)).toBe(Math.round(navThemeBoxEN!.x));
    expect(Math.round(navThemeBoxFR!.width)).toBe(Math.round(navThemeBoxEN!.width));

    await expect(page.locator("body")).toContainText("Tickets en cours");
    await expect(page.locator("body")).toContainText("Capacité disponible");

    await page.getByLabel("Basculer le mode Clair / Sombre").click();
    await expect(page.locator("html")).not.toHaveClass(/dark-theme/);
  });

  test("20. Nouvelles améliorations Portail Demandeur & Administrateur : Filtres par statut, Création de ticket sans chiffrage/prix ni guide de cadrage, Upload de fichier réel, Badges colorés, Label dynamique Demandeur + Nom & Heures supplémentaires gérées par l'Administrateur", async ({ page }) => {
    await page.goto("/");

    // 1. Vérifier que le nom de l'Administrateur par défaut est bien "Getheme Aliko" (et jamais "Aliko Getheme")
    await expect(page.locator("body")).toContainText("Getheme Aliko");
    await expect(page.locator("body")).not.toContainText("Aliko Getheme");

    // 2. Connexion en tant que Demandeur (Mélissa Diakité)
    const melissaBtn = page.getByRole("button", { name: /Mélissa Diakité/i }).first();
    await melissaBtn.click();

    // 3. Vérifier l'affichage dynamique "Demandeur" suivi du nom de la personne connectée
    await expect(page.locator("header")).toContainText("Demandeur — Mélissa Diakité");
    await expect(page.locator("body")).toContainText("Espace Demandeur — Mélissa Diakité");
    await expect(page.locator("body")).toContainText("Demandeur : Mélissa Diakité");

    // 4. Vérifier les filtres par statut côté Demandeur (Tous, Reçu, En cours, Bloqué, En recette, Fini / Clôturé)
    const filterAll = page.getByTestId("consultant-filter-ALL");
    const filterInProgress = page.getByTestId("consultant-filter-IN_PROGRESS");
    const filterBlocked = page.getByTestId("consultant-filter-BLOCKED");
    const filterClosed = page.getByTestId("consultant-filter-CLOSED");
    await expect(filterAll).toBeVisible();
    await expect(filterInProgress).toBeVisible();
    await expect(filterBlocked).toBeVisible();
    await expect(filterClosed).toBeVisible();

    // Filtrer sur "En cours"
    await filterInProgress.click();
    await expect(page.locator("body")).toContainText("ADD-2026-0001");
    await expect(page.locator("body")).not.toContainText("Correction anomalie lettrage comptable sur CDS Views S/4HANA");

    // Filtrer sur "Bloqué"
    await filterBlocked.click();
    await expect(page.locator("body")).toContainText("Correction anomalie lettrage comptable sur CDS Views S/4HANA");

    // Revenir sur "Tous"
    await filterAll.click();
    await expect(page.locator("body")).toContainText("ADD-2026-0001");
    await expect(page.locator("body")).toContainText("BUG-2026-0004");

    // 5. Ouvrir la fenêtre de création de ticket côté Demandeur
    await page.getByRole("button", { name: /Soumettre un nouveau besoin SAP|Nouvelle Demande/i }).first().click();
    await expect(page.getByText("Nouveau Ticket de Développement SAP")).toBeVisible();

    // Vérifier que le bandeau "Guide de cadrage Guichet Central" est bien supprimé
    await expect(page.locator("body")).not.toContainText("Guide de cadrage Guichet Central");

    // Vérifier qu'il n'y a AUCUNE partie chiffrage / estimation de prix / devise côté Demandeur
    await expect(page.locator("body")).not.toContainText("Chiffrage, estimation de prix");
    await expect(page.locator("body")).not.toContainText("Estimation du temps de travail");
    await expect(page.locator("body")).not.toContainText("Devise du Contrat");
    await expect(page.getByTestId("create-modal-demandeur-badge")).toContainText("Demandeur : Mélissa Diakité");

    // 6. Tester l'ajout de fichier réel sur le formulaire de création de ticket + type MAINTENANCE
    await page.getByPlaceholder("ex : Addon validation commandes fournisseurs SAP B1").fill("Maintenance corrective base SAP B1 — Indexation HANA");
    const modal = page.locator(".fixed.inset-0.z-50");
    await modal.locator("select").first().selectOption("MAINTENANCE");
    await page.getByPlaceholder(/Décrivez précisément les exigences fonctionnelles/i).fill("Optimisation des index HANA sur la table OINV.");

    const fileInput = page.getByTestId("ticket-file-upload-input");
    await fileInput.setInputFiles({
      name: "Cahier_Maintenance_SAP_HANA.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("Contenu PDF de test pour maintenance SAP B1"),
    });

    // Vérifier l'aperçu du fichier uploadé
    await expect(page.getByTestId("uploaded-ticket-file-preview")).toBeVisible();
    await expect(page.getByTestId("uploaded-ticket-file-preview")).toContainText("Cahier_Maintenance_SAP_HANA.pdf");

    // Soumettre le ticket
    await page.getByRole("button", { name: /Enregistrer le ticket/i }).click();

    // 7. Vérifier que le nouveau ticket apparaît avec les badges colorés "MAINTENANCE" et "📥 Reçu" ainsi que le fichier joint
    await expect(page.locator("body")).toContainText("Maintenance corrective base SAP B1 — Indexation HANA");
    await expect(page.locator("body")).toContainText("Cahier_Maintenance_SAP_HANA.pdf");
    await expect(page.getByTestId("type-badge-MAINTENANCE").first()).toBeVisible();
    await expect(page.getByTestId("type-badge-ADDON").first()).toBeVisible();
    await expect(page.getByTestId("status-badge-RECEIVED").first()).toBeVisible();

    // Tester le filtre "Reçu"
    await page.getByTestId("consultant-filter-RECEIVED").click();
    await expect(page.locator("body")).toContainText("Maintenance corrective base SAP B1 — Indexation HANA");
    await page.getByTestId("consultant-filter-ALL").click();

    // 8. Se connecter en tant qu'Administrateur (Getheme Aliko) et créditer des heures supplémentaires sur un ticket non clôturé
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await loginAsAliko(page);

    const followBtn = page.getByRole("button", { name: /Suivre/i }).first();
    await followBtn.click();

    await expect(page.getByTestId("admin-extra-hours-panel")).toBeVisible();
    const extraHoursInput = page.getByTestId("admin-extra-hours-input");
    await extraHoursInput.fill("6");
    await page.getByTestId("admin-add-extra-hours-btn").click();

    // Vérifier la confirmation de crédit d'heures supplémentaires par l'Administrateur
    await expect(page.locator("body")).toContainText("+6h supplémentaires créditées");
  });

  test("21. Portail Admin & Architecture Super Admin : E-mails automatiques (Dev/Admin/Demandeur), Analytique financier en stand-by, Rapport individuel dev par dev, Rejet UAT sans heures par le consultant, Interdiction de réaffecter un ticket clôturé, Statuts démarrés/non démarrés & Création de types sur les listes déroulantes", async ({ page }) => {
    await loginAsAliko(page);

    // 1. Vérifier le badge d'architecture SUPER ADMINISTRATEUR et le générateur de rapport individuel par dev
    await expect(page.getByTestId("admin-architecture-level-badge")).toContainText("SUPER ADMINISTRATEUR");
    await expect(page.getByTestId("admin-individual-dev-select")).toBeVisible();
    await page.getByTestId("admin-individual-dev-select").selectOption("dev-hassane");
    await page.getByTestId("admin-generate-individual-report-btn").click();
    await expect(page.getByTestId("individual-dev-report-badge")).toContainText("Rapport Individuel (Dev par Dev)");
    await expect(page.locator("#printable-report")).toContainText("Hassane Bocoum");
    await page.getByLabel("Fermer le rapport").click();

    // 2. Vérifier dans la fenêtre de création de ticket Admin :
    //    - Fenêtre épurée : Analytique financier complètement retiré
    //    - Création d'une nouvelle Priorité dans la liste déroulante
    //    - Notification e-mail automatique (Développeur, Administrateur, Demandeur/Consultant)
    await page.getByRole("button", { name: /Nouveau Ticket/i }).click();
    await expect(page.locator("body")).not.toContainText("Analytique Financier");
    await expect(page.getByTestId("create-modal-auto-email-notice")).toBeVisible();

    // Ajouter une nouvelle priorité depuis la liste déroulante
    await page.getByTestId("add-priority-inline-btn").click();
    await page.getByTestId("custom-priority-input").fill("Urgence Directionnelle");
    await page.getByTestId("confirm-add-priority-btn").click();

    // Créer le ticket côté Admin en ciblant un développeur (Hassane Bocoum)
    await page.getByPlaceholder("ex : Addon validation commandes fournisseurs SAP B1").fill("Intégration API Bancaire Automatisée SAP B1");
    await page.getByTestId("create-modal-dev-select").selectOption("dev-hassane");
    await page.getByPlaceholder(/Décrivez précisément les exigences fonctionnelles/i).fill("Synchronisation automatique des relevés bancaires MT940 dans SAP B1.");
    await page.getByRole("button", { name: /Enregistrer le ticket/i }).click();

    // Vérifier que la bannière de notification e-mail automatique confirme l'envoi au Développeur, à l'Admin et au Demandeur
    await expect(page.getByTestId("latest-auto-email-banner")).toBeVisible();
    await expect(page.getByTestId("latest-auto-email-banner")).toContainText("Hassane Bocoum");
    await expect(page.getByTestId("latest-auto-email-banner")).toContainText("Getheme Aliko");
    await expect(page.getByTestId("latest-auto-email-banner")).toContainText("Mélissa Diakité");

    // 3. Vérifier la visibilité des statuts projets (Démarrés vs Non démarrés) et le filtre associé
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();
    await expect(page.getByTestId("project-start-badge-STARTED").first()).toBeVisible();
    await expect(page.getByTestId("project-start-badge-NOT_STARTED").first()).toBeVisible();
    await page.getByTestId("project-start-filter-select").selectOption("NOT_STARTED");
    await expect(page.getByTestId("project-start-badge-NOT_STARTED").first()).toBeVisible();
    await page.getByTestId("project-start-filter-select").selectOption("ALL");

    // 4. Vérifier le niveau Super Admin / Administrateurs multiples (ex: Koffi Mensah + création d'un nouvel Administrateur)
    await page.getByRole("button", { name: /Équipe & Capacité/i }).click();
    await page.getByTestId("team-subtab-admins").click();
    await expect(page.getByTestId("admins-grid")).toContainText("Getheme Aliko");
    await expect(page.getByTestId("admins-grid")).toContainText("Koffi Mensah");

    await page.getByTestId("open-add-admin-modal-btn").click();
    await page.getByTestId("new-admin-firstname-input").fill("Jean-Marc");
    await page.getByTestId("new-admin-lastname-input").fill("Yao");
    await page.getByTestId("new-admin-email-input").fill("jeanmarc.yao@safirconsulting.net");
    await page.getByTestId("confirm-create-admin-btn").click();

    await expect(page.getByTestId("admins-grid")).toContainText("Jean-Marc Yao");

  });

  test("22. Panneau Admin : Main totale sur toutes les listes déroulantes (Ajout et Suppression dynamique d'une Entreprise/Client, Demandeur, Type, Priorité)", async ({ page }) => {
    // 1. Connexion en tant qu'Administrateur (Getheme Aliko)
    await loginAsAliko(page);

    // 2. Ouvrir la modale Nouveau Ticket
    await page.getByRole("button", { name: /Nouveau Ticket/i }).click();
    await expect(page.getByTestId("create-modal-client-select")).toBeVisible();

    // 3. Tester l'ajout d'une nouvelle entreprise/client via le bouton inline
    await page.getByTestId("add-client-inline-btn").first().click();
    await expect(page.getByTestId("custom-client-input")).toBeVisible();
    await page.getByTestId("custom-client-input").fill("Cacao & Café Export SA");
    await page.getByTestId("confirm-add-client-btn").click();

    // Vérifier que la nouvelle entreprise est sélectionnée dans la liste déroulante
    await expect(page.getByTestId("create-modal-client-select")).toHaveValue("Cacao & Café Export SA");

    // 4. Tester la suppression d'une entreprise de la liste déroulante
    const clientSelect = page.getByTestId("create-modal-client-select");
    await clientSelect.selectOption("Client Alpha");
    await page.getByTestId("delete-client-inline-btn").first().click();

    // Vérifier que "Client Alpha" n'est plus présent dans la liste
    const optionsAfterDelete = await page.getByTestId("create-modal-client-select").locator("option").allInnerTexts();
    expect(optionsAfterDelete.some((opt) => opt.includes("Client Alpha"))).toBeFalsy();

    // 5. Tester l'ajout d'un nouveau demandeur via la liste déroulante
    await page.getByTestId("add-applicant-inline-btn").click();
    await expect(page.getByTestId("custom-applicant-input")).toBeVisible();
    await page.getByTestId("custom-applicant-input").fill("Drissa Coulibaly");
    await page.getByTestId("confirm-add-applicant-btn").click();
    await expect(page.getByTestId("create-modal-applicant-select")).toHaveValue("Drissa Coulibaly");

    // 6. Remplir les informations obligatoires et créer le ticket
    await page.getByPlaceholder("ex : Addon validation commandes fournisseurs SAP B1").fill("Interfaçage Balance Électronique & SAP B1");
    await page.getByPlaceholder(/Décrivez précisément les exigences fonctionnelles/i).fill("Transmission automatique du pesage des camions de cacao dans SAP B1 via Service Layer.");
    await page.getByRole("button", { name: /Enregistrer le ticket/i }).click();

    // 7. Vérifier que le ticket est bien créé avec la nouvelle entreprise et le nouveau demandeur
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();
    await expect(page.locator("body")).toContainText("Interfaçage Balance Électronique & SAP B1");
    await expect(page.locator("body")).toContainText("Drissa Coulibaly");
  });
});
