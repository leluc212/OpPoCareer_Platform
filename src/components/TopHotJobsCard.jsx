/**
 * TopHotJobsCard — "Top công việc hot nhất"
 * Lấy dữ liệu trực tiếp từ DB:
 *   - JobPosts (PostStandardJob) + QuickJobs (PostQuickJob)
 *   - Applications: dùng getAllApplications để đếm theo jobId
 * Sort theo số ứng viên giảm dần, lấy top 5.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import jobPostService from '../services/jobPostService';
import quickJobService from '../services/quickJobService';
import applicationService, { getJobApplications } from '../services/applicationService';

// ─── Rank badge colors ────────────────────────────────────────
const RANK_COLORS = [
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#dbeafe', color: '#2563eb' },
  { bg: '#f0fdf4', color: '#16a34a' },
  { bg: '#f5f3ff', color: '#7c3aed' },
  { bg: '#fff7ed', color: '#ea580c' },
];

// ─── Styles (defined before components that use them) ─────────
const styles = {
  card: {
    background: '#ffffff',
    borderRadius: 12,
    border: '0.5px solid #e2e8f0',
    padding: '20px 24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#f97316',
    flexShrink: 0,
    display: 'inline-block',
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1e293b',
  },
  viewAll: {
    fontSize: 13,
    color: '#3b82f6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontWeight: 500,
  },
  // Grid columns: title | candidates | views | status
  grid: {
    display: 'grid',
    gridTemplateColumns: '50% 16% 14% 20%',
    alignItems: 'center',
    width: '100%',
  },
  colRow: {
    display: 'grid',
    gridTemplateColumns: '50% 16% 14% 20%',
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottom: '1px solid #e2e8f0',
    marginBottom: 2,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  colLabelRight: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textAlign: 'right',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '50% 16% 14% 20%',
    width: '100%',
    alignItems: 'center',
    padding: '12px 0',
  },
  jobTitle: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: 16,
  },
  viewsStat: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
    textAlign: 'right',
    paddingRight: 8,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '32px 0',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#94a3b8',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
  },
  skeleton: {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  },
};

// ─── Skeleton row ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={styles.row}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...styles.skeleton, width: 20, height: 20, borderRadius: 5, flexShrink: 0 }} />
        <div style={{ ...styles.skeleton, width: '60%', height: 14, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ ...styles.skeleton, width: 44, height: 24, borderRadius: 20 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ ...styles.skeleton, width: 28, height: 14, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ ...styles.skeleton, width: 72, height: 24, borderRadius: 999 }} />
      </div>
    </div>
  );
}

// ─── Status helpers ───────────────────────────────────────────
function statusLabel(status, vi) {
  if (status === 'active') return vi ? 'Đang tuyển' : 'Active';
  if (status === 'closed') return vi ? 'Đã đóng'   : 'Closed';
  return vi ? 'Nháp' : 'Draft';
}

function statusStyle(status) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    background:
      status === 'active' ? '#f0fdf4' :
      status === 'closed' ? '#fef2f2' : '#fefce8',
    color:
      status === 'active' ? '#16a34a' :
      status === 'closed' ? '#dc2626' : '#ca8a04',
  };
}

// ─── Component ────────────────────────────────────────────────
export default function TopHotJobsCard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const vi = language === 'vi';

  const [topJobs, setTopJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch jobs song song
        const [stdJobs, qJobs] = await Promise.all([
          jobPostService.getMyJobPosts().catch(() => []),
          quickJobService.getMyQuickJobs
            ? quickJobService.getMyQuickJobs().catch(() => [])
            : Promise.resolve([]),
        ]);
        if (cancelled) return;

        const stdArr = Array.isArray(stdJobs) ? stdJobs : [];
        const qArr   = Array.isArray(qJobs)   ? qJobs   : [];

        // 2. Fetch applications — thử bulk trước, fallback per-job
        const appCountMap = {}; // { jobId: count }
        let usedBulk = false;

        try {
          const allApps = await applicationService.getAllApplications();
          if (Array.isArray(allApps) && allApps.length > 0) {
            const myJobIds = new Set([
              ...stdArr.map(j => j.idJob || j.id),
              ...qArr.map(j => j.jobID || j.id),
            ].filter(Boolean));

            allApps.forEach(app => {
              const id = app.jobId || app.jobID;
              if (id && myJobIds.has(id)) {
                appCountMap[id] = (appCountMap[id] || 0) + 1;
              }
            });
            usedBulk = true;
          }
        } catch (_) { /* fallthrough to per-job */ }

        // Fallback: fetch per-job theo batch 3
        if (!usedBulk) {
          const allIds = [
            ...stdArr.map(j => j.idJob || j.id),
            ...qArr.map(j => j.jobID || j.id),
          ].filter(Boolean);

          const BATCH = 3;
          for (let i = 0; i < allIds.length; i += BATCH) {
            if (cancelled) return;
            const batch = allIds.slice(i, i + BATCH);
            const results = await Promise.all(
              batch.map(id => getJobApplications(id).catch(() => []))
            );
            results.forEach((apps, idx) => {
              if (Array.isArray(apps)) {
                appCountMap[batch[idx]] = apps.length;
              }
            });
            if (i + BATCH < allIds.length) {
              await new Promise(r => setTimeout(r, 150));
            }
          }
        }

        if (cancelled) return;

        // 3. Build combined list
        const allJobs = [
          ...stdArr.map(j => {
            const id = j.idJob || j.id;
            return {
              id,
              title: j.title || '',
              applications: appCountMap[id] ?? (Number(j.applicants) || 0),
              views: Number(j.views) || 0,
              status:
                j.status === 'active' ? 'active' :
                j.status === 'closed' ? 'closed' : 'draft',
              type: 'standard',
            };
          }),
          ...qArr.map(j => {
            const id = j.jobID || j.id;
            return {
              id,
              title: j.title || '',
              applications: appCountMap[id] ?? (Number(j.applicants) || 0),
              views: Number(j.views) || 0,
              status: (j.status === 'approved' || j.status === 'active') ? 'active' : 'closed',
              type: 'quick',
            };
          }),
        ];

        // 4. Sort theo applications desc, views làm tie-breaker → top 5
        const sorted = allJobs
          .sort((a, b) => b.applications - a.applications || b.views - a.views)
          .slice(0, 5);

        setTopJobs(sorted);
      } catch (err) {
        if (!cancelled) setError(vi ? 'Không thể tải dữ liệu' : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.dot} />
          <span style={styles.title}>
            {vi ? 'Top công việc hot nhất' : 'Top Performing Jobs'}
          </span>
        </div>
        <button style={styles.viewAll} onClick={() => navigate('/employer/standard-jobs')}>
          {vi ? 'Xem tất cả →' : 'View all →'}
        </button>
      </div>

      {/* Column labels */}
      <div style={styles.colRow}>
        <span style={styles.colLabel}>
          {vi ? 'Tiêu đề công việc' : 'Job title'}
        </span>
        <span style={{ ...styles.colLabelRight }}>
          {vi ? 'Ứng viên' : 'Candidates'}
        </span>
        <span style={{ ...styles.colLabelRight }}>
          {vi ? 'Lượt xem' : 'Views'}
        </span>
        <span style={{ ...styles.colLabelRight }}>
          {vi ? 'Trạng thái' : 'Status'}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
      ) : error ? (
        <div style={styles.center}>
          <span style={styles.errorText}>{error}</span>
        </div>
      ) : topJobs.length === 0 ? (
        <div style={styles.center}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <span style={styles.emptyText}>
            {vi ? 'Chưa có tin tuyển dụng nào' : 'No job posts yet'}
          </span>
        </div>
      ) : (
        topJobs.map((job, i) => {
          const rank = RANK_COLORS[i] || RANK_COLORS[RANK_COLORS.length - 1];
          const isLast = i === topJobs.length - 1;
          return (
            <div
              key={job.id || i}
              style={{
                ...styles.row,
                borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
              }}
            >
              {/* Col 1: Rank + Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: rank.bg,
                  color: rank.color,
                }}>
                  {i + 1}
                </span>
                <span style={styles.jobTitle} title={job.title}>{job.title}</span>
              </div>

              {/* Col 2: Ứng viên badge */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  + {job.applications}
                </span>
              </div>

              {/* Col 3: Lượt xem */}
              <span style={styles.viewsStat}>
                {job.views.toLocaleString('vi-VN')}
              </span>

              {/* Col 4: Trạng thái */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={statusStyle(job.status)}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'currentColor', flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  {statusLabel(job.status, vi)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// Inject shimmer keyframe once
if (typeof document !== 'undefined' && !document.getElementById('shimmer-kf')) {
  const s = document.createElement('style');
  s.id = 'shimmer-kf';
  s.textContent = '@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }';
  document.head.appendChild(s);
}
