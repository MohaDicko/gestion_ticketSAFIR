import { test, expect } from "@playwright/test";

async function loginAsAliko(page: any) {
  await page.goto("/");
  const alikoBtn = page.getByRole("button", { name: /Aliko Getheme/i }).first();
  if (await alikoBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await alikoBtn.click();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();
  }
}

test.describe("Tests E2E Interface, Login & Portails RBAC (Playwright)", () => {
  test("1. Affiche par défaut la page de login Safir Consulting, s'authentifie et accède au portail Direction", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Ticket Manager/i);

    // Vérifier l'écran de Login initial par défaut
    await expect(page.locator("body")).toContainText("Safir Consulting");
    await expect(page.locator("body")).toContainText("Connexion à votre Espace");
    await expect(page.locator("body")).toContainText("Adresse e-mail professionnelle (Login)");
    await expect(page.getByRole("button", { name: /Se connecter à mon portail/i })).toBeVisible();

    // Connexion en tant qu'Aliko Getheme (Direction)
    const alikoBtn = page.getByRole("button", { name: /Aliko Getheme/i }).first();
    await expect(alikoBtn).toBeVisible();
    await alikoBtn.click();

    // Vérifier l'arrivée dans le portail Direction (HEAD)
    const header = page.locator("header");
    await expect(header).toContainText("Aliko Getheme");
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

    // Vérifier l'arrivée sur le portail Consultante dédié
    await expect(page.locator("body")).toContainText("Mélissa Diakité");
    await expect(page.locator("header")).toContainText("CONSULTANT");
    await expect(page.locator("body")).toContainText("Espace Consulting SAP — Mélissa Diakité");

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
    await expect(page.getByText(/La consultante doit d'abord tester et approuver la recette/i)).toBeVisible();

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
    await expect(page.getByText("Fil d'Échange Tracé — Développeur ↔ Consultante ↔ Direction")).toBeVisible();
    await expect(page.locator("body")).toContainText("Bonjour Mélissa, l'anomalie de lettrage");

    // 6. Rédiger la réponse apportant les précisions attendues
    const textarea = page.locator("textarea");
    await textarea.fill("Bonjour Anoop, voici l'échantillon des pièces comptables n° 4501 et 4502 pour tes tests.");

    // 7. Envoyer la réponse
    await page.getByRole("button", { name: /Envoyer/i }).click();

    // 8. Vérifier la prise en compte et le déblocage du ticket
    await expect(page.locator("body")).toContainText("Précision apportée par la consultante");
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

    // 4. Hassane saisit le reste à faire sur son lot technique
    await page.getByRole("button", { name: /Saisir Reste à Faire/i }).first().click();
    await expect(page.getByText("Votre Lot")).toBeVisible();
    await expect(page.locator("form").getByText("Intégration HANA & Vues SQLScript")).toBeVisible();

    const rafInput = page.locator("input[type='number']");
    await rafInput.fill("5");
    await page.getByRole("button", { name: /Enregistrer/i }).click();
    await expect(page.locator("body")).toContainText("Reste à faire mis à jour");

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
    await expect(page.getByText(/Joindre un document SAP ou une capture au message/i)).toBeVisible();
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
    await page.getByText(/Aliko Getheme/i).first().click();
    const userMenu = page.locator(".absolute.right-0.mt-2.w-80");
    await expect(userMenu.getByText(/Session Active Sécurisée/i)).toBeVisible();
    await expect(userMenu.getByText(/Tester les niveaux d'accès/i)).not.toBeVisible();
    await expect(userMenu.getByText(/Anoop Pandimukkula/i)).not.toBeVisible();
    await expect(userMenu.getByText(/Mélissa Diakité/i)).not.toBeVisible();

    // Fermer le menu
    await page.getByText(/Aliko Getheme/i).first().click();

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

    // 2. Déconnexion et Connexion Consultante (Mélissa Diakité)
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    const melissaBtn = page.getByRole("button", { name: /Mélissa Diakité/i }).first();
    await melissaBtn.click();
    await expect(page.getByText(/Espace Consulting SAP — Mélissa Diakité/i)).toBeVisible();

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
    await expect(page.getByText(/Reprise demandée suite à Recette Consultante/i)).toBeVisible();
    await expect(page.getByText(/Anomalie constatée : Le calcul de remise sur facture ne s'applique pas correctement sous SAP B1/i)).toBeVisible();

    // Le développeur effectue la correction et renvoie le ticket en test
    const redeliverBtn = page.getByRole("button", { name: /Envoyer en test chez le consultant|Marquer comme Livré/i }).first();
    await redeliverBtn.click();
    await expect(page.getByText(/Livré \(À tester\)/i).first()).toBeVisible();

    // 5. Déconnexion et Reconnexion Consultante (Mélissa) pour Approbation
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Mélissa Diakité/i }).first().click();

    // La consultante valide la recette avec succès
    const approveBtn = page.getByRole("button", { name: /Tester & Approuver la Recette/i });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Vérifier que le statut passe à "Recette testée & validée avec succès"
    await expect(page.getByText(/Recette testée & validée avec succès par vos soins/i)).toBeVisible();
    await expect(page.getByText(/Attente Clôture Direction/i)).toBeVisible();

    // 6. Déconnexion et Connexion Direction (Aliko) pour Clôture Définitive
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Aliko Getheme/i }).first().click();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();

    // Aliko ouvre le ticket dans Tous les Tickets SAP
    await page.getByRole("button", { name: /Tous les Tickets SAP/i }).click();
    const superviseBtn = page.getByRole("button", { name: /Suivre/i }).first();
    await superviseBtn.click();

    // Vérifier que la modale indique que la recette est validée
    await expect(page.getByText(/Recette approuvée par la consultante/i)).toBeVisible();
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

    // 3. Test du Chronomètre / Compteur de temps en direct (Règle mono-tâche stricte)
    const startTimerBtn = page.getByRole("button", { name: /Démarrer chrono/i }).first();
    await startTimerBtn.click();

    // Vérifier l'apparition du bandeau actif en temps réel
    await expect(page.getByText(/Compteur d'heures actif \(Règle mono-tâche\)/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Arrêter & Enregistrer/i })).toBeVisible();

    // Arrêter le chrono et vérifier l'enregistrement
    await page.getByRole("button", { name: /Arrêter & Enregistrer/i }).click();
    await expect(page.getByText(/Session enregistrée/i)).toBeVisible();

    // 4. Test d'impression de son propre rapport par le Développeur
    const devPrintBtn = page.getByRole("button", { name: /Imprimer mon rapport d'heures/i });
    await expect(devPrintBtn).toBeVisible();
    await devPrintBtn.click();

    // Vérifier l'ouverture de la modale de rapport périodique
    await expect(page.getByText(/Rapport d'Activité & Feuilles de Temps — Safir Consulting/i)).toBeVisible();
    await expect(page.getByText(/Collaborateur SAP/i)).toBeVisible();

    // Tester les bascules de granularité périodique
    await page.getByRole("button", { name: /Journalier/i }).click();
    await expect(page.getByText(/Rapport Périodique : Journalier/i)).toBeVisible();

    await page.getByRole("button", { name: /Hebdomadaire/i }).click();
    await expect(page.getByText(/Rapport Périodique : Hebdomadaire/i)).toBeVisible();

    await page.getByRole("button", { name: /Mensuel/i }).click();
    await expect(page.getByText(/Rapport Périodique : Mensuel/i)).toBeVisible();

    await page.getByRole("button", { name: /Annuel/i }).click();
    await expect(page.getByText(/Rapport Périodique : Annuel/i)).toBeVisible();

    // Fermer la modale
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();

    // 5. Test d'accès Direction : Aliko imprime le rapport d'un développeur et d'un consultant
    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await page.getByRole("button", { name: /Aliko Getheme/i }).first().click();
    await expect(page.getByRole("button", { name: /Tableau de bord/i })).toBeVisible();

    // Navigation vers Équipe & Capacité
    await page.getByRole("button", { name: /Équipe & Capacité/i }).click();

    // Clic sur 'Rapport d'heures' du premier développeur
    const devCardReportBtn = page.getByRole("button", { name: /Rapport d'heures/i }).first();
    await expect(devCardReportBtn).toBeVisible();
    await devCardReportBtn.click();

    // Vérifier que la modale d'impression s'ouvre pour le développeur sélectionné
    await expect(page.getByText(/Rapport d'Activité & Feuilles de Temps — Safir Consulting/i)).toBeVisible();
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();

    // Basculer vers l'onglet Consultants
    await page.getByRole("button", { name: /Consultants Fonctionnels/i }).click();
    const consultantReportBtn = page.getByRole("button", { name: /Rapport d'activité/i }).first();
    await expect(consultantReportBtn).toBeVisible();
    await consultantReportBtn.click();

    // Vérifier l'ouverture du rapport pour la consultante
    await expect(page.getByText(/Rapport d'Activité & Feuilles de Temps — Safir Consulting/i)).toBeVisible();
    await page.getByRole("button", { name: /Fermer le rapport/i }).click();
  });
});
