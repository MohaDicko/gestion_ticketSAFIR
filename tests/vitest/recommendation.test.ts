import { describe, it, expect } from "vitest";

// Simulation unitaire fidèle de l'algorithme de scoring sur 100 points
export function calculateCandidateScore(params: {
  developer: {
    skills: { name: string; level: number }[];
    reservedHours: number;
    weeklyCapacityHours: number;
    isExcluded: boolean;
    hasClientHistory: boolean;
  };
  ticket: {
    estimatedHours: number;
    requiredSkills: { name: string; minimumLevel: number; isMandatory: boolean }[];
  };
}) {
  const { developer: dev, ticket } = params;
  const reasons: string[] = [];
  let isEligible = true;

  if (dev.isExcluded) {
    isEligible = false;
    reasons.push("Exclusion client active");
  }

  let matchedSkills = 0;
  let skillsScoreSum = 0;
  const totalReq = ticket.requiredSkills.length;

  for (const req of ticket.requiredSkills) {
    const devSkill = dev.skills.find((s) => s.name === req.name);
    if (!devSkill || devSkill.level < req.minimumLevel) {
      if (req.isMandatory) {
        isEligible = false;
        reasons.push(`Niveau insuffisant sur ${req.name} (${devSkill?.level || 0} < ${req.minimumLevel})`);
      }
    } else {
      matchedSkills++;
      const ratio = Math.min(1.25, devSkill.level / req.minimumLevel);
      skillsScoreSum += ratio;
    }
  }

  const weeklyMax = dev.weeklyCapacityHours || 40;
  const loadPercent = Math.min(100, Math.round((dev.reservedHours / weeklyMax) * 100));
  const freeHours = Math.max(0, weeklyMax - dev.reservedHours);

  // 1. Compétences (Max 45)
  let skillsScore = totalReq > 0 ? Math.round((skillsScoreSum / totalReq) * 45) : 40;
  skillsScore = Math.min(45, skillsScore);

  // 2. Capacité (Max 30)
  let capacityScore = 0;
  if (loadPercent <= 50) capacityScore = 30;
  else if (loadPercent <= 75) capacityScore = 22;
  else if (loadPercent <= 90) capacityScore = 14;
  else if (loadPercent < 100) capacityScore = 6;
  else capacityScore = 0;

  // 3. Échéance (Max 15)
  let deadlineScore = 15;
  if (loadPercent > 85 && ticket.estimatedHours > freeHours) {
    deadlineScore = 8;
  }

  // 4. Continuité (Max 10)
  const continuityScore = dev.hasClientHistory ? 10 : 0;

  const totalScore = isEligible ? skillsScore + capacityScore + deadlineScore + continuityScore : 0;

  return {
    isEligible,
    reasons,
    totalScore,
    breakdown: {
      skillsScore,
      capacityScore,
      deadlineScore,
      continuityScore,
    },
    loadPercent,
    freeHours,
  };
}

describe("Algorithme d'Aide à l'Affectation (Scoring 100 Points)", () => {
  it("attribue le score maximal (~100 pts) à un développeur expert, disponible et avec antécédents", () => {
    const res = calculateCandidateScore({
      developer: {
        skills: [{ name: "SAP B1 — Service Layer", level: 5 }],
        reservedHours: 10, // 25% charge
        weeklyCapacityHours: 40,
        isExcluded: false,
        hasClientHistory: true,
      },
      ticket: {
        estimatedHours: 8,
        requiredSkills: [{ name: "SAP B1 — Service Layer", minimumLevel: 4, isMandatory: true }],
      },
    });

    expect(res.isEligible).toBe(true);
    expect(res.breakdown.skillsScore).toBe(45); // Ratio maxé à 1.25 -> 45
    expect(res.breakdown.capacityScore).toBe(30); // charge <= 50%
    expect(res.breakdown.deadlineScore).toBe(15);
    expect(res.breakdown.continuityScore).toBe(10);
    expect(res.totalScore).toBe(100);
  });

  it("élimine strictement un développeur n'ayant pas le niveau requis sur une compétence obligatoire", () => {
    const res = calculateCandidateScore({
      developer: {
        skills: [{ name: "SAP B1 — Service Layer", level: 2 }],
        reservedHours: 0,
        weeklyCapacityHours: 40,
        isExcluded: false,
        hasClientHistory: false,
      },
      ticket: {
        estimatedHours: 16,
        requiredSkills: [{ name: "SAP B1 — Service Layer", minimumLevel: 4, isMandatory: true }],
      },
    });

    expect(res.isEligible).toBe(false);
    expect(res.totalScore).toBe(0);
    expect(res.reasons.some((r) => r.includes("Niveau insuffisant"))).toBe(true);
  });

  it("élimine strictement un développeur faisant l'objet d'une exclusion client", () => {
    const res = calculateCandidateScore({
      developer: {
        skills: [{ name: "SAP B1 — Service Layer", level: 5 }],
        reservedHours: 0,
        weeklyCapacityHours: 40,
        isExcluded: true,
        hasClientHistory: false,
      },
      ticket: {
        estimatedHours: 8,
        requiredSkills: [{ name: "SAP B1 — Service Layer", minimumLevel: 4, isMandatory: true }],
      },
    });

    expect(res.isEligible).toBe(false);
    expect(res.totalScore).toBe(0);
    expect(res.reasons).toContain("Exclusion client active");
  });

  it("applique les paliers de capacité dégressifs (30, 22, 14, 0)", () => {
    // Cas 60% charge
    const res60 = calculateCandidateScore({
      developer: {
        skills: [],
        reservedHours: 24, // 60%
        weeklyCapacityHours: 40,
        isExcluded: false,
        hasClientHistory: false,
      },
      ticket: { estimatedHours: 4, requiredSkills: [] },
    });
    expect(res60.breakdown.capacityScore).toBe(22);

    // Cas 80% charge
    const res80 = calculateCandidateScore({
      developer: {
        skills: [],
        reservedHours: 32, // 80%
        weeklyCapacityHours: 40,
        isExcluded: false,
        hasClientHistory: false,
      },
      ticket: { estimatedHours: 4, requiredSkills: [] },
    });
    expect(res80.breakdown.capacityScore).toBe(14);

    // Cas 100% surcharge
    const res100 = calculateCandidateScore({
      developer: {
        skills: [],
        reservedHours: 40, // 100%
        weeklyCapacityHours: 40,
        isExcluded: false,
        hasClientHistory: false,
      },
      ticket: { estimatedHours: 4, requiredSkills: [] },
    });
    expect(res100.breakdown.capacityScore).toBe(0);
  });
});
