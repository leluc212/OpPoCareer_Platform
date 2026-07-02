/**
 * TopSpotlightJobCard
 * ──────────────────────────────────────────────────────────────────────────────
 * Card job nổi bật dành riêng cho gói Top Spotlight, chèn xen kẽ vào
 * danh sách kết quả tìm kiếm (Vị trí 2).
 *
 * Phân biệt rõ so với JobCard thường:
 *  - Nền gradient tối premium, không phải màu nền trắng/xám bình thường
 *  - Viền gradient vàng-đỏ + glow animation
 *  - Badge "🔥 Top Spotlight" góc trên phải
 *  - CTA "Ứng tuyển ngay" nổi bật
 *  - Lớn hơn card thường (padding và layout rộng hơn)
 *
 * Props: job, onClick, language
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { MapPin, DollarSign, Clock, Sparkles, Building2 } from 'lucide-react';

// ─── Keyframes ────────────────────────────────────────────────────────────────

const gradientShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const badgePulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 3px 12px rgba(220,38,38,0.4); }
  50%       { transform: scale(1.05); box-shadow: 0 5px 20px rgba(220,38,38,0.65); }
`;

const borderGlow = keyframes`
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1; }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

/* Glow border wrapper */
const Outer = styled.div`
  position: relative;
  border-radius: 18px;
  padding: 2.5px;
  background: linear-gradient(
    135deg,
    #f59e0b 0%,
    #dc2626 35%,
    #f59e0b 65%,
    #fbbf24 100%
  );
  background-size: 300% 300%;
  animation: ${gradientShift} 6s ease infinite, ${borderGlow} 2.5s ease-in-out infinite;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.2), 0 2px 8px rgba(0,0,0,0.12);

  &:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 16px 48px rgba(220, 38, 38, 0.32), 0 4px 16px rgba(0,0,0,0.15);
  }
`;

const Card = styled.div`
  border-radius: 16px;
  background: linear-gradient(135deg, #1a0533 0%, #2d0a4e 50%, #1e0a3c 100%);
  padding: 20px 24px;
  position: relative;
  overflow: hidden;

  /* Subtle shine overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
`;

const LogoBox = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const LogoText = styled.span`
  font-size: 22px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.85);
`;

const MainText = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 5px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 6px rgba(0,0,0,0.3);
`;

const Company = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
`;

const BadgeTopRight = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 16px;
  animation: ${badgePulse} 2.4s ease-in-out infinite;
  border: 1.5px solid rgba(255, 255, 255, 0.3);

  svg {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);

  svg {
    width: 12px;
    height: 12px;
    color: #fbbf24;
    flex-shrink: 0;
  }
`;

const SalaryChip = styled(MetaChip)`
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border-color: rgba(251, 191, 36, 0.3);
  font-weight: 700;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PostedAt = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
`;

const ApplyBtn = styled.button`
  padding: 9px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.55);
  }

  &:active {
    transform: translateY(0);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const TopSpotlightJobCard = ({ job, onClick, language = 'vi' }) => {
  if (!job) return null;

  const handleClick = () => onClick && onClick(job.id || job.idJob);

  const handleApply = (e) => {
    e.stopPropagation();
    onClick && onClick(job.id || job.idJob);
  };

  return (
    <Outer onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`${job.title} - Top Spotlight`}
    >
      <Card>
        {/* Badge góc phải */}
        <BadgeTopRight>
          <Sparkles />
          Top Spotlight
        </BadgeTopRight>

        <TopRow>
          {/* Logo */}
          <LogoBox>
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.company} />
            ) : (
              <LogoText>
                {job.company ? job.company.charAt(0).toUpperCase() : '?'}
              </LogoText>
            )}
          </LogoBox>

          <MainText>
            <Title title={job.title}>{job.title}</Title>
            <Company>{job.company}</Company>
          </MainText>
        </TopRow>

        {/* Meta chips */}
        <MetaRow>
          {job.location && (
            <MetaChip>
              <MapPin />
              {job.location}
            </MetaChip>
          )}
          {job.salary && (
            <SalaryChip>
              <DollarSign />
              {job.salary}
            </SalaryChip>
          )}
          {job.workHours && (
            <MetaChip>
              <Clock />
              {job.workHours}
            </MetaChip>
          )}
        </MetaRow>

        {/* Bottom row */}
        <BottomRow>
          <PostedAt>{job.postedAt}</PostedAt>
          <ApplyBtn onClick={handleApply}>
            {language === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
          </ApplyBtn>
        </BottomRow>
      </Card>
    </Outer>
  );
};

export default TopSpotlightJobCard;
