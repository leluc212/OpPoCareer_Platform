/**
 * CvAiAnalysisCard — "Kết quả AI phân tích CV"
 * Biểu đồ donut phân bổ CV theo điểm AI (aiScreeningScore) từ StandardApplications.
 * Dữ liệu thật: lấy applications của tất cả jobs của employer hiện tại.
 * Dùng Recharts (PieChart / Cell) để vẽ donut.
 */
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import jobPostService from '../services/jobPostService';
import { getJobApplications } from '../services/applicationService';
import { useAuth } from '../context/AuthContext';

// Màu sắc cho 3 nhóm
const GROUPS = [
  { label: 'Trên 80%',  color: '#22c55e', key: 'high'   },
  { label: '60 – 80%',  color: '#f97316', key: 'medium' },
  { label: 'Dưới 60%',  color: '#94a3b8', key: 'low'    },
];

// Custom label ở trung tâm donut
const CenterLabel = ({ cx, cy, total }) => (
  <text textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} y={cy - 10} style={{ fontSize: 26, fontWeight: 700, fill: '#1e293b' }}>
      {total.toLocaleString('vi-VN')}
    </tspan>
    <tspan x={cx} dy={22} style={{ fontSize: 11, fill: '#94a3b8' }}>
      CV đã phân tích
    </tspan>
  </text>
);

export default function CvAiAnalysisCard() {
  const { user } = useAuth();

  const [counts, setCounts] = useState({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Lấy tất cả standard jobs của employer
        const myJobs = await jobPostService.getMyJobPosts().catch(() => []);
        if (cancelled) return;

        if (!myJobs || myJobs.length === 0) {
          setCounts({ high: 0, medium: 0, low: 0 });
          setLoading(false);
          return;
        }

        // 2. Lấy applications cho từng job (batch 4)
        const batchSize = 4;
        let allApps = [];
        for (let i = 0; i < myJobs.length; i += batchSize) {
          if (cancelled) return;
          const batch = myJobs.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(j => getJobApplications(j.idJob || j.id).catch(() => []))
          );
          allApps.push(...results.flat());
        }

        if (cancelled) return;

        // 3. Chỉ tính những application có aiScreeningScore (đã qua AI sàng lọc)
        const scored = allApps.filter(
          a => typeof a.aiScreeningScore === 'number' && a.aiScreeningScore >= 0
        );

        const high   = scored.filter(a => a.aiScreeningScore >= 80).length;
        const medium = scored.filter(a => a.aiScreeningScore >= 60 && a.aiScreeningScore < 80).length;
        const low    = scored.filter(a => a.aiScreeningScore < 60).length;

        setCounts({ high, medium, low });
      } catch (err) {
        if (!cancelled) setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  const total = counts.high + counts.medium + counts.low;

  const chartData = GROUPS.map(g => ({
    ...g,
    value: counts[g.key],
    pct: total > 0 ? Math.round((counts[g.key] / total) * 100) : 0,
  }));

  // Nếu total = 0 thì hiện placeholder segment để donut không trống
  const pieData = total > 0
    ? chartData
    : [{ label: '', color: '#f1f5f9', value: 1, pct: 0, key: 'empty' }];

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.dot} />
        <span style={styles.title}>Kết quả AI phân tích CV</span>
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
      ) : (
        <div style={styles.body}>
          {/* Donut Chart */}
          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                {total > 0 && (
                  <Tooltip
                    formatter={(value, name) => [`${value} CV`, name]}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      boxShadow: 'none',
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            {/* Center text overlay */}
            <div style={styles.centerLabel}>
              <span style={styles.centerTotal}>{total.toLocaleString('vi-VN')}</span>
              <span style={styles.centerSub}>CV đã phân tích</span>
            </div>
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            {chartData.map(g => (
              <div key={g.key} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: g.color }} />
                <div style={styles.legendText}>
                  <span style={styles.legendLabel}>{g.label}</span>
                  <span style={styles.legendCount}>
                    {g.value} CV
                    {total > 0 && (
                      <span style={styles.legendPct}> ({g.pct}%)</span>
                    )}
                  </span>
                </div>
              </div>
            ))}

            {total === 0 && (
              <p style={styles.emptyNote}>
                Chưa có CV nào được AI sàng lọc.
              </p>
            )}
          </div>
        </div>
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
    gap: 8,
    marginBottom: 16,
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
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  chartWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 200,
  },
  centerLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  centerTotal: {
    fontSize: 26,
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1,
  },
  centerSub: {
    fontSize: 11,
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  legend: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 500,
  },
  legendCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
  },
  legendPct: {
    color: '#94a3b8',
    fontWeight: 400,
  },
  emptyNote: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    margin: '8px 0 0',
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 160,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2.5px solid #e2e8f0',
    borderTopColor: '#f97316',
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
};
