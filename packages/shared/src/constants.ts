export const SCORING_WEIGHTS = {
  SKILLS: 45,
  CAPACITY: 30,
  DEADLINE: 15,
  CONTINUITY: 10,
} as const;

export const DEFAULT_WORK_SETTINGS = {
  HOURS_PER_DAY: 8,
  DAYS_PER_WEEK: 5,
  TIMEZONE: "Europe/Paris",
  ALIKO_EMAIL: "aliko@safirconsulting.net",
} as const;

export const TICKET_PREFIX_MAP: Record<string, string> = {
  ADDON: "ADD",
  BUG: "BUG",
  FEATURE: "FEAT",
  INTEGRATION: "INT",
  SUPPORT: "SUP",
  TECHNICAL_ANALYSIS: "TECH",
  OTHER: "OTH",
};

export const CAPACITY_LIMITS = {
  MAX_DAILY_HOURS: 8,
  WARNING_OVERLOAD_PERCENTAGE: 100,
  DATA_RELIABILITY_STALE_DAYS: 7,
} as const;
