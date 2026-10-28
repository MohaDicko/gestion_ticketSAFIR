import { describe, it, expect } from "vitest";

export type TicketStatus =
  | "RECEIVED"
  | "TO_QUALIFY"
  | "READY"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "IN_REVIEW"
  | "IN_TESTING"
  | "DELIVERED"
  | "CLOSED"
  | "REJECTED";

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  RECEIVED: ["TO_QUALIFY", "REJECTED"],
  TO_QUALIFY: ["READY", "REJECTED", "RECEIVED"],
  READY: ["ASSIGNED", "TO_QUALIFY"],
  ASSIGNED: ["IN_PROGRESS", "READY"],
  IN_PROGRESS: ["IN_REVIEW", "IN_TESTING", "BLOCKED", "DELIVERED"],
  BLOCKED: ["IN_PROGRESS", "IN_REVIEW", "IN_TESTING"],
  IN_REVIEW: ["IN_PROGRESS", "IN_TESTING", "BLOCKED", "DELIVERED"],
  IN_TESTING: ["IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DELIVERED"],
  DELIVERED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  REJECTED: ["TO_QUALIFY"],
};

export function canTransition(current: TicketStatus, target: TicketStatus): boolean {
  if (current === target) return true;
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}

describe("Machine à États Finis des Demandes (Section 8 du Cahier des Charges)", () => {
  it("autorise le chemin nominal complet", () => {
    expect(canTransition("RECEIVED", "TO_QUALIFY")).toBe(true);
    expect(canTransition("TO_QUALIFY", "READY")).toBe(true);
    expect(canTransition("READY", "ASSIGNED")).toBe(true);
    expect(canTransition("ASSIGNED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "CLOSED")).toBe(true);
  });

  it("interdit les sauts directs non conformes (ex: RECEIVED vers CLOSED direct)", () => {
    expect(canTransition("RECEIVED", "CLOSED")).toBe(false);
    expect(canTransition("RECEIVED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("ASSIGNED", "DELIVERED")).toBe(false);
  });

  it("gère l'état BLOCKED (Stop-the-line) et le retour à l'état antérieur", () => {
    expect(canTransition("IN_PROGRESS", "BLOCKED")).toBe(true);
    expect(canTransition("BLOCKED", "IN_PROGRESS")).toBe(true);
    // Un ticket bloqué ne peut pas être clôturé directement
    expect(canTransition("BLOCKED", "CLOSED")).toBe(false);
  });

  it("interdit toute transition sortante depuis CLOSED (statut terminal immuable)", () => {
    expect(canTransition("CLOSED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("CLOSED", "READY")).toBe(false);
  });
});
