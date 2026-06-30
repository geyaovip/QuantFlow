import type { MembershipTier } from "@quantflow/contracts";

const TIER_RANK: Record<MembershipTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

const ALL_TIERS: MembershipTier[] = ["free", "plus", "pro"];

export const FREE_SIGNAL_DELAY_MINUTES = 15;

export function tierMeetsRequired(
  userTier: MembershipTier,
  requiredTier: MembershipTier,
) {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

export function accessibleTiers(maxTier: MembershipTier): MembershipTier[] {
  const maxRank = TIER_RANK[maxTier];
  return ALL_TIERS.filter((tier) => TIER_RANK[tier] <= maxRank);
}

export function signalDelayMinutes(tier: MembershipTier) {
  return tier === "free" ? FREE_SIGNAL_DELAY_MINUTES : 0;
}
