/**
 * JobEfficiencyCard — "Hiệu quả tin tuyển dụng"
 * Hiển thị danh sách job posts với view_count và application_count.
 * Dữ liệu thật từ jobPostService (DynamoDB bảng PostStandardJob).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jobPostService from '../services/jobPostService';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 5;

export default function JobEfficiencyCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0); // 0-based

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await jobPostService.getMyJobPosts();
        if (cancelled) return;

        // Sort by views desc, then by createdAt desc as tie-breaker
        const sorted = [...(data || [])].sort((a, b) => {
          const viewDiff = (b.views || 0) - (a.views || 0);
          if (viewDiff !== 0) return viewDiff;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        setJobs(sorted);
      } catch (err) {
        if (!cancelled) setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);
  const visible = jobs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.dot} />
          <span style={styles.title}>Hiệu quả tin tuyển dụng</span>
        </div>
        <button
          style={styles.viewAll}
          onClick={() => navigate('/employer/standard-jobs')}
        >
          Xem tất cả →
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Đang tải...</span>
        </div>
      ) : error ? (
        <div style={styles.center}>
          <span style={styles.errorText}>{error}</span>
        </div>
      ) : jobs.length === 0 ? (
        <div style={styles.center}>
          <span style={styles.emptyText}>Chưa có tin tuyển dụng nào.</span>
        </div>
      ) : (
        <>
          {/* Column labels */}
          <div style={styles.colRow}>
            <span style={{ ...styles.colLabel, flex: 1 }}>Vị trí tuyển dụng</span>
            <span style={{ ...styles.colLabel, width: 72, textAlign: 'right' }}>Lượt xem</span>
            <span style={{ ...styles.colLabel, width: 84, textAlign: 'right' }}>Ứng tuyển</span>
          </div>

          {/* Rows */}
          {visible.map((job, idx) => {
            const isLast = idx === visible.length - 1;
            const title = job.title || 'Vị trí công việc';
            const views = typeof job.views === 'number' ? job.views : 0;
            const applicants = typeof job.applicants === 'number' ? job.applicants : 0;

            return (
              <div
                key={job.idJob || job.id || idx}
                style={{
                  ...styles.row,
                  borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <span style={styles.jobTitle} title={title}>{title}</span>
                <span style={styles.stat}>{views.toLocaleString('vi-VN')}</span>
                <span style={styles.stat}>{applicants.toLocaleString('vi-VN')}</span>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.pageBtn,
                  opacity: page === 0 ? 0.4 : 1,
                  cursor: page === 0 ? 'default' : 'pointer',
                }}
                onClick={() => page > 0 && setPage(p => p - 1)}
                disabled={page === 0}
                aria-label="Trang trước"
              >
                ‹
              </button>
              <span style={styles.pageInfo}>
                {page + 1} / {totalPages}
              </span>
              <button
                style={{
                  ...styles.pageBtn,
                  opacity: page >= totalPages - 1 ? 0.4 : 1,
                  cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                }}
                onClick={() => page < totalPages - 1 && setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Trang tiếp"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: 12,
    border: '0.5px solid #e2e8f0',
    padding: '20px 24px',
    minHeight: 240,
    display: 'flex',
    flexDirection: 'column',
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
    background: '#3b82f6',
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
  colRow: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottom: '1px solid #e2e8f0',
    marginBottom: 4,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '11px 0',
    gap: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  stat: {
    width: 72,
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
    textAlign: 'right',
    flexShrink: 0,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9',
  },
  pageBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#64748b',
    fontWeight: 600,
    padding: 0,
  },
  pageInfo: {
    fontSize: 12,
    color: '#94a3b8',
    minWidth: 40,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 120,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2.5px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    animation: 'spin 0.7s linear infinite',
  },
  loadingText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
};
