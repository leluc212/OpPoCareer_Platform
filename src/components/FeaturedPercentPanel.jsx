import React from 'react';
import styled from 'styled-components';
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Star,
  UserCheck,
} from 'lucide-react';

const MILESTONES = [
  { value: 40, labelVi: 'Đủ điều kiện', labelEn: 'Work ready' },
  { value: 60, labelVi: 'Phát triển', labelEn: 'Growing' },
  { value: 80, labelVi: 'Nổi bật', labelEn: 'Featured' },
  { value: 100, labelVi: 'Siêu sao', labelEn: 'Superstar' },
];

const COPY = {
  vi: {
    title: '% nổi bật',
    loading: 'Đang tải % nổi bật...',
    noData: 'Chưa có dữ liệu % nổi bật',
    unavailable: 'Không thể tải % nổi bật',
    profile: 'Hồ sơ cá nhân',
    profileReady: 'Đủ điều kiện đi làm',
    completeProfile: 'Hoàn thiện hồ sơ',
    findJobs: 'Tìm việc làm',
    history: 'Lịch sử theo nhà tuyển dụng',
    noHistory: 'Chưa có lịch sử theo nhà tuyển dụng',
    missingPrefix: 'Còn thiếu',
    profileMax: '/40%',
  },
  en: {
    title: 'Featured %',
    loading: 'Loading featured %...',
    noData: 'No featured % data yet',
    unavailable: 'Unable to load featured %',
    profile: 'Personal profile',
    profileReady: 'Work ready',
    completeProfile: 'Complete profile',
    findJobs: 'Find jobs',
    history: 'Employer history',
    noHistory: 'No employer history yet',
    missingPrefix: 'Missing',
    profileMax: '/40%',
  },
};

const Panel = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  .icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #eff6ff;
    color: #1d4ed8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  h2 {
    font-size: 20px;
    line-height: 1.2;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 4px;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
  }
`;

const PercentBlock = styled.div`
  text-align: right;

  strong {
    display: block;
    color: #0f172a;
    font-size: 34px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0;
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #0369a1;
    background: #e0f2fe;
    border: 1px solid #bae6fd;
    border-radius: 999px;
    padding: 5px 10px;
    margin-top: 8px;
    font-size: 12px;
    font-weight: 800;
  }

  @media (max-width: 720px) {
    text-align: left;
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 16px;
  font-weight: 700;

  svg {
    color: #1d4ed8;
    flex-shrink: 0;
  }
`;

const ProgressTrack = styled.div`
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$percent}%;
  max-width: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1d4ed8, #0891b2, #16a34a);
`;

const MilestoneGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0 22px;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Milestone = styled.div`
  border: 1px solid ${props => props.$active ? '#93c5fd' : '#e5e7eb'};
  background: ${props => props.$active ? '#eff6ff' : '#ffffff'};
  color: ${props => props.$active ? '#1d4ed8' : '#64748b'};
  border-radius: 10px;
  padding: 9px 10px;

  strong {
    display: block;
    font-size: 13px;
    font-weight: 900;
    color: inherit;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 700;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.85fr);
  gap: 18px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    color: #0f172a;
    font-size: 15px;
    line-height: 1.25;
    font-weight: 800;
  }
`;

const Checklist = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ChecklistItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: ${props => props.$completed ? '#ecfdf5' : '#fff7ed'};
  color: ${props => props.$completed ? '#047857' : '#c2410c'};
  font-size: 12px;
  font-weight: 800;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
  }
`;

const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
`;

const ActionButton = styled.button`
  border: 1px solid ${props => props.$primary ? '#1d4ed8' : '#cbd5e1'};
  background: ${props => props.$primary ? '#1d4ed8' : '#ffffff'};
  color: ${props => props.$primary ? '#ffffff' : '#334155'};
  border-radius: 10px;
  min-height: 40px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  }
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const HistoryItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;

  strong {
    display: block;
    color: #0f172a;
    font-size: 13px;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    color: #0f172a;
    font-style: normal;
    font-size: 18px;
    font-weight: 900;
  }
`;

const clampPercent = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const getCopy = language => COPY[language] || COPY.vi;

const getLevelLabel = (summary, language) => {
  if (summary?.level?.label) return summary.level.label;
  if (language === 'en') return 'Work ready';
  return 'Có thể bắt đầu đi làm';
};

const FeaturedPercentPanel = ({
  summary,
  loading = false,
  configured = true,
  error = null,
  language = 'vi',
  onOpenProfile,
  onOpenJobs,
}) => {
  const copy = getCopy(language);
  const hasSummary = configured && !loading && !error && summary && typeof summary.percent !== 'undefined';
  const percent = hasSummary ? clampPercent(summary.percent) : 0;
  const profilePercent = clampPercent(summary?.profile?.percent || 0);
  const profileItems = Array.isArray(summary?.profile?.items) ? summary.profile.items : [];
  const history = Array.isArray(summary?.history) ? summary.history.slice(0, 4) : [];
  const missingCount = Array.isArray(summary?.profile?.missingFields) ? summary.profile.missingFields.length : 0;

  let statusText = copy.noData;
  if (loading) statusText = copy.loading;
  if (error) statusText = copy.unavailable;

  return (
    <Panel aria-label={copy.title}>
      <Header>
        <TitleGroup>
          <div className="icon">
            <Award size={22} />
          </div>
          <div>
            <h2>{copy.title}</h2>
            <p>{hasSummary ? getLevelLabel(summary, language) : statusText}</p>
          </div>
        </TitleGroup>

        {hasSummary && (
          <PercentBlock>
            <strong>{percent}%</strong>
            <span>
              <Star size={13} />
              {getLevelLabel(summary, language)}
            </span>
          </PercentBlock>
        )}
      </Header>

      {!hasSummary ? (
        <EmptyState>
          <AlertCircle size={18} />
          <span>{statusText}</span>
        </EmptyState>
      ) : (
        <>
          <ProgressTrack>
            <ProgressFill $percent={percent} />
          </ProgressTrack>

          <MilestoneGrid>
            {MILESTONES.map(item => (
              <Milestone key={item.value} $active={percent >= item.value}>
                <strong>{item.value}%</strong>
                <span>{language === 'en' ? item.labelEn : item.labelVi}</span>
              </Milestone>
            ))}
          </MilestoneGrid>

          <DetailGrid>
            <DetailSection>
              <h3>
                <UserCheck size={17} />
                {copy.profile} {profilePercent}%{copy.profileMax}
              </h3>
              <Checklist>
                {profileItems.map(item => (
                  <ChecklistItem key={item.key || item.label} $completed={Boolean(item.completed)}>
                    {item.completed ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                    <span>{item.label || item.key}</span>
                  </ChecklistItem>
                ))}
              </Checklist>

              <InlineActions>
                {missingCount > 0 ? (
                  <ActionButton type="button" $primary onClick={onOpenProfile}>
                    <ClipboardCheck size={16} />
                    {copy.completeProfile}
                  </ActionButton>
                ) : (
                  <ActionButton type="button" onClick={onOpenJobs}>
                    <Briefcase size={16} />
                    {copy.profileReady}
                  </ActionButton>
                )}
                {missingCount > 0 && (
                  <ActionButton type="button" onClick={onOpenJobs}>
                    <Briefcase size={16} />
                    {copy.findJobs}
                  </ActionButton>
                )}
              </InlineActions>
            </DetailSection>

            <DetailSection>
              <h3>
                <Briefcase size={17} />
                {copy.history}
              </h3>
              {history.length > 0 ? (
                <HistoryList>
                  {history.map(item => (
                    <HistoryItem key={item.applicationId || item.jobId || `${item.employerName}-${item.percent}`}>
                      <div>
                        <strong>{item.employerName || item.jobTitle || '---'}</strong>
                        <span>{item.jobTitle || item.level?.label || getLevelLabel(item, language)}</span>
                      </div>
                      <em>{clampPercent(item.percent)}%</em>
                    </HistoryItem>
                  ))}
                </HistoryList>
              ) : (
                <EmptyState>
                  <Clock3 size={18} />
                  <span>{copy.noHistory}</span>
                </EmptyState>
              )}
            </DetailSection>
          </DetailGrid>
        </>
      )}
    </Panel>
  );
};

export default FeaturedPercentPanel;
