import { describe, it, expect } from "vitest";

export function calculateNetCapacity(params: {
  contractualHoursWeekly: number;
  absencesHours: number;
  holidaysHours: number;
  overlappingAbsenceOnHolidayHours: number;
  remainingWorkloadHours: number;
}) {
  // Règle d'or : pas de double décompte entre congés et fériés
  const effectiveDeductions =
    params.absencesHours + params.holidaysHours - params.overlappingAbsenceOnHolidayHours;

  const netCapacity = Math.max(0, params.contractualHoursWeekly - effectiveDeductions);
  const availableCapacity = Math.max(0, netCapacity - params.remainingWorkloadHours);
  const loadPercentage = netCapacity > 0 ? Math.round((params.remainingWorkloadHours / netCapacity) * 100) : 100;

  return {
    netCapacity,
    availableCapacity,
    loadPercentage,
    isOverloaded: params.remainingWorkloadHours > netCapacity,
  };
}

describe("Moteur de Calcul de Capacité Nette (Section 6 du Cahier des Charges)", () => {
  it("calcule la capacité nominale d'un développeur à 40h/semaine sans absence", () => {
    const res = calculateNetCapacity({
      contractualHoursWeekly: 40,
      absencesHours: 0,
      holidaysHours: 0,
      overlappingAbsenceOnHolidayHours: 0,
      remainingWorkloadHours: 16, // 2 tickets de 8h
    });

    expect(res.netCapacity).toBe(40);
    expect(res.availableCapacity).toBe(24);
    expect(res.loadPercentage).toBe(40);
    expect(res.isOverloaded).toBe(false);
  });

  it("empêche le double décompte lorsqu'un congé coïncide avec un jour férié", () => {
    // Semaine avec 1 jour férié (8h) et le dev a posé toute la semaine (40h)
    // Sans déduplication : 40 - (40 + 8) = négatif!
    // Avec déduplication (8h de chevauchement) : déduction réelle = 40h
    const res = calculateNetCapacity({
      contractualHoursWeekly: 40,
      absencesHours: 40,
      holidaysHours: 8,
      overlappingAbsenceOnHolidayHours: 8,
      remainingWorkloadHours: 0,
    });

    expect(res.netCapacity).toBe(0);
    expect(res.availableCapacity).toBe(0);
  });

  it("détecte une surcharge d'heures (charge restante supérieure à la capacité nette)", () => {
    const res = calculateNetCapacity({
      contractualHoursWeekly: 40,
      absencesHours: 16, // 2 jours de formation
      holidaysHours: 0,
      overlappingAbsenceOnHolidayHours: 0,
      remainingWorkloadHours: 32, // Tickets dépassant les 24h restantes
    });

    expect(res.netCapacity).toBe(24);
    expect(res.availableCapacity).toBe(0);
    expect(res.loadPercentage).toBe(133);
    expect(res.isOverloaded).toBe(true);
  });
});
