import { describe, expect, it } from 'vitest';
import { getAdminNotificationBadgeCounts } from './adminNotificationBadges';

describe('getAdminNotificationBadgeCounts', () => {
  it('counts unread withdrawal notifications by owner', () => {
    const counts = getAdminNotificationBadgeCounts([
      { type: 'withdrawal_request', read: false },
      { type: 'candidate_withdrawal_request', read: false },
      { type: 'candidate_withdrawal_request', read: true }
    ]);

    expect(counts.wallet).toBe(2);
    expect(counts.walletEmployer).toBe(1);
    expect(counts.walletCandidate).toBe(1);
  });

  it('routes unread notifications to their admin sections', () => {
    const counts = getAdminNotificationBadgeCounts([
      { type: 'package_purchase_request', read: false, actionUrl: '/admin/packages' },
      { type: 'candidate_verification_request', read: false, actionUrl: '/admin/candidates' },
      { type: 'job_pending_approval', read: false, actionUrl: '/admin/posts', data: { isQuickJob: false } },
      { type: 'quick_job_activation_request', read: false, actionUrl: '/admin/employers' },
      { type: 'change_request_submitted', read: false, actionUrl: '/admin/employers' },
      { type: 'profile_change_request', read: false, actionUrl: '/admin/employers?tab=profile-changes' }
    ]);

    expect(counts.packages).toBe(1);
    expect(counts.candidateVerifications).toBe(1);
    expect(counts.posts).toBe(1);
    expect(counts.employerQuickJobs).toBe(1);
    expect(counts.employerChangeRequests).toBe(1);
    expect(counts.employerProfileChanges).toBe(1);
    expect(counts.employers).toBe(3);
  });

  it('ignores read notifications', () => {
    const counts = getAdminNotificationBadgeCounts([
      { type: 'withdrawal_request', read: true },
      { type: 'package_purchase_request', read: true }
    ]);

    expect(counts.total).toBe(0);
    expect(counts.wallet).toBe(0);
    expect(counts.packages).toBe(0);
  });
});
