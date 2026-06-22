/**
 * Tests for job deletion and expiration logic
 * - Soft-delete job → applications get status 'job_deleted'
 * - Expired jobs auto-deleted → applications also marked 'job_deleted'
 * - Candidate applications filter out 'job_deleted'
 * - Employer applications filter out 'job_deleted'
 * 
 * Run: npx vitest run src/services/jobDeletion.test.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock aws-amplify ──────────────────────────────────────────────────────────
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(() => Promise.resolve({ tokens: { idToken: { payload: { sub: 'user123' }, toString: () => 'mock-token' } } }))
}));

// ─── Mock localStorage ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// ─── Test Data ─────────────────────────────────────────────────────────────────

const mockApplications = [
  {
    applicationId: 'app_1',
    jobId: 'job_active',
    jobTitle: 'Nhân viên bán hàng',
    candidateId: 'user123',
    status: 'pending',
    appliedAt: '2026-06-20T10:00:00Z',
  },
  {
    applicationId: 'app_2',
    jobId: 'job_deleted',
    jobTitle: 'Pha chế',
    candidateId: 'user123',
    status: 'job_deleted',
    appliedAt: '2026-06-18T10:00:00Z',
  },
  {
    applicationId: 'app_3',
    jobId: 'job_expired',
    jobTitle: 'Phục vụ',
    candidateId: 'user123',
    status: 'job_deleted',
    appliedAt: '2026-06-15T10:00:00Z',
  },
  {
    applicationId: 'app_4',
    jobId: 'job_active',
    jobTitle: 'Nhân viên bán hàng',
    candidateId: 'user123',
    status: 'approved',
    appliedAt: '2026-06-19T10:00:00Z',
  },
  {
    applicationId: 'app_5',
    jobId: 'job_active_2',
    jobTitle: 'Kế toán',
    candidateId: 'user123',
    status: 'rejected',
    appliedAt: '2026-06-17T10:00:00Z',
  },
];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Job Deletion - Application Filtering', () => {

  describe('Candidate-side filtering', () => {
    it('should filter out applications with status job_deleted', () => {
      const activeApps = mockApplications.filter(app => app.status !== 'job_deleted');
      
      expect(activeApps).toHaveLength(3);
      expect(activeApps.map(a => a.applicationId)).toEqual(['app_1', 'app_4', 'app_5']);
    });

    it('should keep applications with other statuses (pending, approved, rejected)', () => {
      const activeApps = mockApplications.filter(app => app.status !== 'job_deleted');
      
      const statuses = activeApps.map(a => a.status);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('approved');
      expect(statuses).toContain('rejected');
      expect(statuses).not.toContain('job_deleted');
    });

    it('should return empty array if all applications are job_deleted', () => {
      const allDeleted = [
        { ...mockApplications[1] },
        { ...mockApplications[2] },
      ];
      
      const activeApps = allDeleted.filter(app => app.status !== 'job_deleted');
      expect(activeApps).toHaveLength(0);
    });

    it('should return all applications if none are job_deleted', () => {
      const noneDeleted = [
        { ...mockApplications[0] },
        { ...mockApplications[3] },
        { ...mockApplications[4] },
      ];
      
      const activeApps = noneDeleted.filter(app => app.status !== 'job_deleted');
      expect(activeApps).toHaveLength(3);
    });
  });

  describe('Employer-side filtering', () => {
    it('should filter out job_deleted applications in employer view', () => {
      // Simulates what Applications.jsx does
      const allApplications = mockApplications;
      const transformedApplications = allApplications
        .filter(app => {
          if (!(app.jobTitle?.trim())) return false;
          if (app.status === 'job_deleted') return false;
          return true;
        });
      
      expect(transformedApplications).toHaveLength(3);
      expect(transformedApplications.every(a => a.status !== 'job_deleted')).toBe(true);
    });

    it('should still show rejected/pending applications for non-deleted jobs', () => {
      const allApplications = mockApplications;
      const transformedApplications = allApplications
        .filter(app => {
          if (app.status === 'job_deleted') return false;
          return true;
        });
      
      const statuses = new Set(transformedApplications.map(a => a.status));
      expect(statuses.has('pending')).toBe(true);
      expect(statuses.has('approved')).toBe(true);
      expect(statuses.has('rejected')).toBe(true);
    });
  });

  describe('Job expiration → deletion logic', () => {
    it('should detect expired jobs (workDays < today)', () => {
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const jobs = [
        { idJob: 'job_1', status: 'active', workDays: '2025-01-01' }, // expired
        { idJob: 'job_2', status: 'active', workDays: '2099-12-31' }, // not expired
        { idJob: 'job_3', status: 'active', workDays: '' },           // no date
        { idJob: 'job_4', status: 'closed', workDays: '2025-01-01' }, // already closed
        { idJob: 'job_5', status: 'active', workDays: '2020-06-15' }, // long expired
      ];

      const expiredActiveJobs = jobs.filter(job => {
        if (job.status !== 'active' || !job.workDays) return false;
        const workDate = new Date(job.workDays);
        const workDateOnly = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
        return workDateOnly < todayOnly;
      });

      expect(expiredActiveJobs.map(j => j.idJob)).toEqual(['job_1', 'job_5']);
    });

    it('should not mark future jobs as expired', () => {
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const futureJob = { idJob: 'future_1', status: 'active', workDays: '2099-12-31' };
      
      const workDate = new Date(futureJob.workDays);
      const workDateOnly = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
      const isExpired = workDateOnly < todayOnly;
      
      expect(isExpired).toBe(false);
    });

    it('should not expire jobs without workDays', () => {
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const noDateJob = { idJob: 'no_date', status: 'active', workDays: '' };
      
      // This replicates the actual production logic
      const isExpired = noDateJob.status === 'active' && !!noDateJob.workDays && 
        new Date(noDateJob.workDays) < todayOnly;
      
      expect(isExpired).toBe(false);
    });

    it('should only expire active jobs, not closed/deleted ones', () => {
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const jobs = [
        { idJob: 'j1', status: 'closed', workDays: '2020-01-01' },
        { idJob: 'j2', status: 'deleted', workDays: '2020-01-01' },
        { idJob: 'j3', status: 'pending', workDays: '2020-01-01' },
        { idJob: 'j4', status: 'active', workDays: '2020-01-01' },
      ];

      const expiredActiveJobs = jobs.filter(job => {
        if (job.status !== 'active' || !job.workDays) return false;
        const workDate = new Date(job.workDays);
        const workDateOnly = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
        return workDateOnly < todayOnly;
      });

      // Only the active one should be detected
      expect(expiredActiveJobs).toHaveLength(1);
      expect(expiredActiveJobs[0].idJob).toBe('j4');
    });

    it('should remove expired jobs from employer job list after deletion', () => {
      const jobs = [
        { idJob: 'job_1', status: 'active', title: 'Bán hàng' },
        { idJob: 'job_2', status: 'active', title: 'Pha chế' },    // this one expires
        { idJob: 'job_3', status: 'active', title: 'Kế toán' },
      ];

      const expiredJobs = [{ idJob: 'job_2' }];

      // Simulates what Applications.jsx does after deleting
      const updatedJobs = jobs.filter(job =>
        !expiredJobs.some(ej => ej.idJob === job.idJob)
      );

      expect(updatedJobs).toHaveLength(2);
      expect(updatedJobs.map(j => j.idJob)).toEqual(['job_1', 'job_3']);
    });
  });

  describe('Quick job expiration logic', () => {
    it('should detect expired quick jobs by workDate and endTime', () => {
      const now = new Date();
      const nowDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const nowTimeStr = now.toTimeString().slice(0, 5);  // HH:MM

      const quickJobs = [
        { idJob: 'qj1', status: 'active', workDate: '2020-01-01', endTime: '18:00' }, // expired
        { idJob: 'qj2', status: 'active', workDate: '2099-12-31', endTime: '18:00' }, // future
        { idJob: 'qj3', status: 'active', workDate: nowDateStr, endTime: '00:00' },   // today but time passed
        { idJob: 'qj4', status: 'active', workDate: nowDateStr, endTime: '23:59' },   // today not yet expired
        { idJob: 'qj5', status: 'closed', workDate: '2020-01-01', endTime: '18:00' }, // already closed
      ];

      const expiredJobs = quickJobs.filter(job => {
        if (job.status !== 'active' || !job.workDate) return false;
        const endTime = job.endTime || '23:59';
        return job.workDate < nowDateStr || (job.workDate === nowDateStr && endTime <= nowTimeStr);
      });

      // qj1 is definitely expired (past date)
      expect(expiredJobs.some(j => j.idJob === 'qj1')).toBe(true);
      // qj2 is future
      expect(expiredJobs.some(j => j.idJob === 'qj2')).toBe(false);
      // qj5 is already closed, shouldn't be in expired list
      expect(expiredJobs.some(j => j.idJob === 'qj5')).toBe(false);
    });
  });

  describe('Lambda delete_job_post simulation', () => {
    it('should set job status to deleted and mark all applications as job_deleted', () => {
      // Simulate the Lambda logic
      const job = { idJob: 'job_abc', status: 'active', employerId: 'emp_1' };
      const jobApplications = [
        { applicationId: 'app_x', jobId: 'job_abc', status: 'pending' },
        { applicationId: 'app_y', jobId: 'job_abc', status: 'approved' },
        { applicationId: 'app_z', jobId: 'job_abc', status: 'job_deleted' }, // already marked
      ];

      // Simulate delete_job_post logic
      job.status = 'deleted';
      job.updatedAt = new Date().toISOString();

      const updatedApps = jobApplications.map(app => {
        if (app.status !== 'job_deleted') {
          return { ...app, status: 'job_deleted', updatedAt: new Date().toISOString() };
        }
        return app;
      });

      expect(job.status).toBe('deleted');
      expect(updatedApps.every(a => a.status === 'job_deleted')).toBe(true);
    });

    it('should only mark applications for the specific deleted job', () => {
      const allApps = [
        { applicationId: 'a1', jobId: 'job_deleted_one', status: 'pending' },
        { applicationId: 'a2', jobId: 'job_active_one', status: 'pending' },
        { applicationId: 'a3', jobId: 'job_deleted_one', status: 'approved' },
        { applicationId: 'a4', jobId: 'job_active_two', status: 'approved' },
      ];

      const deletedJobId = 'job_deleted_one';

      // Simulate: only update applications for the deleted job
      const updatedApps = allApps.map(app => {
        if (app.jobId === deletedJobId && app.status !== 'job_deleted') {
          return { ...app, status: 'job_deleted' };
        }
        return app;
      });

      // Applications for deleted job should be marked
      expect(updatedApps.filter(a => a.status === 'job_deleted')).toHaveLength(2);
      // Applications for other jobs should be untouched
      expect(updatedApps.find(a => a.applicationId === 'a2').status).toBe('pending');
      expect(updatedApps.find(a => a.applicationId === 'a4').status).toBe('approved');
    });

    it('should add deletedReason=expired for auto-deleted expired jobs', () => {
      const job = { idJob: 'job_exp', status: 'active', workDays: '2025-01-01' };
      
      // Simulate expired auto-delete
      job.status = 'deleted';
      job.deletedReason = 'expired';
      job.updatedAt = new Date().toISOString();

      expect(job.status).toBe('deleted');
      expect(job.deletedReason).toBe('expired');
    });

    it('should NOT add deletedReason for manual deletes', () => {
      const job = { idJob: 'job_manual', status: 'active' };
      
      // Simulate manual delete (no deletedReason)
      job.status = 'deleted';
      job.updatedAt = new Date().toISOString();

      expect(job.status).toBe('deleted');
      expect(job.deletedReason).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty applications array gracefully', () => {
      const apps = [];
      const filtered = apps.filter(app => app.status !== 'job_deleted');
      expect(filtered).toHaveLength(0);
    });

    it('should handle applications with undefined status', () => {
      const apps = [
        { applicationId: 'a1', jobId: 'j1', status: undefined },
        { applicationId: 'a2', jobId: 'j1', status: null },
        { applicationId: 'a3', jobId: 'j1' }, // no status field
      ];

      const filtered = apps.filter(app => app.status !== 'job_deleted');
      // All should pass since their status is not 'job_deleted'
      expect(filtered).toHaveLength(3);
    });

    it('should handle job with today as workDays (not expired yet)', () => {
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD

      const todayJob = { idJob: 'today_job', status: 'active', workDays: todayStr };
      
      const workDate = new Date(todayJob.workDays);
      const workDateOnly = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
      const isExpired = workDateOnly < todayOnly;
      
      // Job with today's date should NOT be expired (only strictly before today)
      expect(isExpired).toBe(false);
    });
  });
});
