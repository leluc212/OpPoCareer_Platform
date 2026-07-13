/**
 * UnifiedChart.jsx
 * Shared chart components dùng chung cho NTD, UV và Admin
 * Tất cả biểu đồ trong hệ thống đều dùng các styled-components từ file này
 */
import styled from 'styled-components';

// ─── Card wrapper ──────────────────────────────────────────────
export const ChartCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border: 1.5px solid ${props => props.theme.colors.border};
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  position: relative;

  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);
  }

  @media (max-width: 768px) {
    padding: 16px 18px;
  }
`;

// ─── Header ────────────────────────────────────────────────────
export const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  gap: 12px;
  flex-wrap: wrap;

  .title-group {
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      svg { width: 18px; height: 18px; color: ${props => props.theme.colors.primary}; }
    }
    p {
      font-size: 12px;
      color: #94A3B8;
      font-weight: 500;
    }
  }
`;

// ─── Filter pills ──────────────────────────────────────────────
export const ChartFilters = styled.div`
  display: flex;
  background: #F1F5F9;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;

  button {
    padding: 5px 13px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    background: transparent;
    color: #64748B;
    transition: all 0.2s;

    &.active, &:focus {
      background: ${props => props.theme.colors.primary};
      color: white;
      outline: none;
    }

    &:hover:not(.active) {
      background: #E2E8F0;
    }
  }
`;

// ─── Legend ────────────────────────────────────────────────────
export const ChartLegend = styled.div`
  display: flex;
  gap: 18px;
  margin-bottom: 14px;
  flex-wrap: wrap;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 600;

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }
`;

// ─── SVG wrapper (line / area charts) ─────────────────────────
export const ChartSvg = styled.svg`
  width: 100%;
  overflow: visible;
  display: block;
`;

// ─── Scrollable container for charts on small screens ─────────
export const ChartScrollWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

// ─── Grid layouts ──────────────────────────────────────────────
export const ChartsGrid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartsGrid3 = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

// ─── Progress bar (pipeline / stage) ──────────────────────────
export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
`;

export const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$width ?? 0}%;
  background: ${props => props.$color ?? props.theme.colors.primary};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

// ─── Pie chart SVG wrapper ─────────────────────────────────────
export const PieChartSvg = styled.svg`
  width: 180px;
  height: 180px;
  flex-shrink: 0;
`;

// ─── Tooltip ───────────────────────────────────────────────────
export const ChartTooltip = styled.div`
  position: absolute;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  color: white;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translate(-50%, -100%);
  margin-top: -8px;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(15, 23, 42, 0.95);
  }
`;

// ─── Summary pill (hiển thị tổng trên chart) ──────────────────
export const ChartSummaryRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

export const ChartSummaryPill = styled.div`
  background: ${props => props.$bg ?? '#EFF6FF'};
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  color: ${props => props.$color ?? '#1D4ED8'};
  font-weight: 700;
`;
