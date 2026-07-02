/**
 * Top Spotlight Service
 * Fetches jobs whose employer has an active "Top Spotlight" subscription.
 *
 * Strategy:
 *  1. GET /subscriptions → filter packageName='Top Spotlight', status='active', approvalStatus='approved', not expired
 *  2. Collect Set<employerId>
 *  3. Filter allJobs by those employerIds (passed in from JobListing which already has the jobs loaded)
 *     OR fetch active jobs list and cross-reference.
 *
 * The caller passes in the already-loaded jobs array to avoid duplicate fetches.
 */

const SUBS_API = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API;

/**
 * Returns the Set of employer IDs that have an active + approved Top Spotlight subscription
 * that has not yet expired.
 */
export const getTopSpotlightEmployerIds = async () => {
  if (!SUBS_API) return new Set();

  try {
    const res = await fetch(`${SUBS_API.replace(/\/$/, '')}/subscriptions`);
    if (!res.ok) return new Set();

    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.data || [];

    const now = Date.now();

    const activeIds = new Set(
      list
        .filter(
          (sub) =>
            sub.packageName === 'Top Spotlight' &&
            sub.status === 'active' &&
            sub.approvalStatus === 'approved' &&
            // Check expiry if present
            (!sub.expiryDateTime || new Date(sub.expiryDateTime).getTime() > now)
        )
        // Sort newest purchase first so carousel order is consistent
        .sort((a, b) => {
          const ta = a.purchaseDateTime ? new Date(a.purchaseDateTime).getTime() : 0;
          const tb = b.purchaseDateTime ? new Date(b.purchaseDateTime).getTime() : 0;
          return tb - ta;
        })
        .map((sub) => sub.employerId)
    );

    return activeIds;
  } catch (err) {
    console.warn('[topSpotlightService] Failed to fetch subscriptions:', err);
    return new Set();
  }
};

/**
 * Given the already-loaded transformed jobs array and a set of top-spotlight employer IDs,
 * return the filtered + ordered list of jobs to show in the Top Spotlight banner.
 *
 * @param {Array}  jobs              — transformed job objects (from loadDynamoDBJobs)
 * @param {Set}    employerIds       — Set of employerId strings
 * @returns {Array}
 */
export const filterTopSpotlightJobs = (jobs, employerIds) => {
  if (!employerIds || employerIds.size === 0) return [];

  return jobs.filter(
    (job) => job.employerId && employerIds.has(job.employerId) && job.status !== 'deleted'
  );
};
