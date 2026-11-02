import { describe, expect, it } from "vitest";
import { translateText } from "../../apps/web/src/lib/i18n";

describe("Traduction de l'interface", () => {
  it("traduit les textes statiques et dynamiques en anglais", () => {
    expect(translateText("Tableau de bord — 3 Tickets en cours", "en")).toBe(
      "Dashboard — 3 Active Tickets"
    );
    expect(translateText("Données synchronisées avec succès", "en")).toBe(
      "Data synchronized successfully"
    );
  });

  it("reste inchangé en français", () => {
    expect(translateText("Tableau de bord", "fr")).toBe("Tableau de bord");
  });
});
