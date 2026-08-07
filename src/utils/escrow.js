export const ESCROW_CANDIDATE_RATE = 0.85;

// All money values in the product are whole VND. Keep this calculation in one
// place so the employer, candidate and admin views always show the same split.
export const getEscrowDistribution = (value) => {
  const totalAmount = Math.max(0, Math.round(Number(value) || 0));
  const candidateAmount = Math.round(totalAmount * ESCROW_CANDIDATE_RATE);

  return {
    totalAmount,
    candidateAmount,
    platformAmount: totalAmount - candidateAmount
  };
};

export const getStoredEscrowDistribution = (total, application = {}) => {
  const calculated = getEscrowDistribution(total);
  const candidateAmount = Number(application.escrowCandidateAmount);
  const platformAmount = Number(application.escrowPlatformAmount);

  if (Number.isFinite(candidateAmount) && Number.isFinite(platformAmount)) {
    return {
      totalAmount: Number.isFinite(Number(application.escrowTotalAmount))
        ? Number(application.escrowTotalAmount)
        : calculated.totalAmount,
      candidateAmount,
      platformAmount
    };
  }

  return calculated;
};
