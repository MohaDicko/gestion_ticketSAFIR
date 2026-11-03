import { describe, expect, it } from "vitest";
import { getReportDateRange } from "../../apps/web/src/lib/report-period";

describe("périodes de rapport", () => {
  const referenceDate = new Date(2026, 10, 3, 12);

  it("calcule la semaine du lundi au dimanche autour de la date courante", () => {
    expect(getReportDateRange("WEEKLY", "", "", referenceDate)).toEqual({
      from: "2026-11-02",
      to: "2026-11-08",
    });
  });

  it("calcule les périodes mensuelle, trimestrielle, semestrielle et annuelle", () => {
    expect(getReportDateRange("MONTHLY", "", "", referenceDate)).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    });
    expect(getReportDateRange("QUARTERLY", "", "", referenceDate)).toEqual({
      from: "2026-10-01",
      to: "2026-12-31",
    });
    expect(getReportDateRange("SEMESTER", "", "", referenceDate)).toEqual({
      from: "2026-07-01",
      to: "2026-12-31",
    });
    expect(getReportDateRange("YEARLY", "", "", referenceDate)).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("conserve l'intervalle personnalisé sélectionné", () => {
    expect(
      getReportDateRange("CUSTOM", "2026-09-14", "2026-10-14", referenceDate),
    ).toEqual({ from: "2026-09-14", to: "2026-10-14" });
  });
});
