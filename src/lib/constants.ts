export const PLAN_LIMITS = {
  free: {
    maxActiveLeads: 10,
    maxPipelines: 10,
  },
  pro: {
    maxActiveLeads: Infinity,
    maxPipelines: Infinity,
  },
  team: {
    maxActiveLeads: Infinity,
    maxPipelines: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
