import React from 'react';
import styled from 'styled-components';
import Modal from './Modal';
import { Mail, CheckCircle2, Phone, MapPin, Sparkles, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SuccessBanner = styled.div`
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #065f46;
  font-size: 14px;
  font-weight: 500;
  
  svg {
    color: #10b981;
    flex-shrink: 0;
  }
`;

const PrioritySection = styled.div`
  margin-bottom: 28px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PriorityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid ${props => props.$borderColor};
`;

const PriorityTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${props => props.$color};
`;

const CandidateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const CandidateCard = styled.div`
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.$primaryColor};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }
  
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .name {
    font-size: 15px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
  
  .distance {
    font-size: 12px;
    font-weight: 700;
    background: ${props => props.$bgDist};
    color: ${props => props.$colorDist};
    padding: 2px 8px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .contact-info {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    
    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .match-badge {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #15803d;
    background: #dcfce7;
    padding: 4px 10px;
    border-radius: 6px;
    margin-top: 4px;
  }
`;

const EmptyState = styled.div`
  padding: 16px;
  text-align: center;
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  border: 1px dashed ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.textLight};
  font-size: 13px;
  font-style: italic;
`;

const UrgentRecommendationsModal = ({ isOpen, onClose, recommendations, jobTitle }) => {
  const { language } = useLanguage();
  
  if (!isOpen) return null;
  
  const { priority1 = [], priority2 = [], priority3 = [], emailsSent = 0 } = recommendations || {};
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Gợi ý ứng viên thay thế từ AI' : 'AI Urgent Candidate Recommendations'}
      size="large"
    >
      <div style={{ padding: '4px' }}>
        <SuccessBanner>
          <CheckCircle2 size={20} />
          <div>
            {language === 'vi' 
              ? `Hệ thống đã tự động gửi email thông báo cần người gấp đến ${emailsSent} ứng viên trong khu vực bán kính 10km!` 
              : `Automatically sent urgent job notification emails to ${emailsSent} candidates within a 10km radius!`}
          </div>
        </SuccessBanner>
        
        {/* Priority 1 */}
        <PrioritySection>
          <PriorityHeader $borderColor="#10b981">
            <Sparkles size={16} style={{ color: '#10b981' }} />
            <PriorityTitle $color="#065f46">
              {language === 'vi' 
                ? 'Ưu tiên 1: Trong bán kính 3km & Thích hợp với công việc' 
                : 'Priority 1: Within 3km & Suitable for Job'}
            </PriorityTitle>
          </PriorityHeader>
          {priority1.length === 0 ? (
            <EmptyState>
              {language === 'vi' ? 'Không tìm thấy ứng viên phù hợp trong bán kính 3km' : 'No matching candidates within 3km'}
            </EmptyState>
          ) : (
            <CandidateGrid>
              {priority1.map(cand => (
                <CandidateCard key={cand.candidateId} $primaryColor="#10b981" $bgDist="#dcfce7" $colorDist="#15803d">
                  <div className="card-top">
                    <div className="name"><User size={14} style={{ display: 'inline', marginRight: 4 }} /> {cand.fullName}</div>
                    <div className="distance"><MapPin size={12} /> {cand.distance} km</div>
                  </div>
                  <div className="contact-info">
                    <span><Mail size={12} /> {cand.email}</span>
                    {cand.phone && <span><Phone size={12} /> {cand.phone}</span>}
                  </div>
                  {cand.suitable && cand.reasons && cand.reasons.length > 0 && (
                    <div className="match-badge">
                      <Sparkles size={12} />
                      {cand.reasons.join(', ')}
                    </div>
                  )}
                </CandidateCard>
              ))}
            </CandidateGrid>
          )}
        </PrioritySection>
        
        {/* Priority 2 */}
        <PrioritySection style={{ marginTop: 24 }}>
          <PriorityHeader $borderColor="#3b82f6">
            <Sparkles size={16} style={{ color: '#3b82f6' }} />
            <PriorityTitle $color="#1e3a8a">
              {language === 'vi' 
                ? 'Ưu tiên 2: Trong bán kính 3-5km (hoặc <3km chưa tối ưu)' 
                : 'Priority 2: Within 3-5km (or <3km not matched)'}
            </PriorityTitle>
          </PriorityHeader>
          {priority2.length === 0 ? (
            <EmptyState>
              {language === 'vi' ? 'Không tìm thấy ứng viên trong bán kính 3-5km' : 'No candidates within 3-5km'}
            </EmptyState>
          ) : (
            <CandidateGrid>
              {priority2.map(cand => (
                <CandidateCard key={cand.candidateId} $primaryColor="#3b82f6" $bgDist="#dbeafe" $colorDist="#1e40af">
                  <div className="card-top">
                    <div className="name"><User size={14} style={{ display: 'inline', marginRight: 4 }} /> {cand.fullName}</div>
                    <div className="distance"><MapPin size={12} /> {cand.distance} km</div>
                  </div>
                  <div className="contact-info">
                    <span><Mail size={12} /> {cand.email}</span>
                    {cand.phone && <span><Phone size={12} /> {cand.phone}</span>}
                  </div>
                  {cand.suitable && cand.reasons && cand.reasons.length > 0 && (
                    <div className="match-badge">
                      <Sparkles size={12} />
                      {cand.reasons.join(', ')}
                    </div>
                  )}
                </CandidateCard>
              ))}
            </CandidateGrid>
          )}
        </PrioritySection>
        
        {/* Priority 3 */}
        <PrioritySection style={{ marginTop: 24 }}>
          <PriorityHeader $borderColor="#8b5cf6">
            <Sparkles size={16} style={{ color: '#8b5cf6' }} />
            <PriorityTitle $color="#4c1d95">
              {language === 'vi' 
                ? 'Ưu tiên 3: Trong bán kính 5-10km' 
                : 'Priority 3: Within 5-10km'}
            </PriorityTitle>
          </PriorityHeader>
          {priority3.length === 0 ? (
            <EmptyState>
              {language === 'vi' ? 'Không tìm thấy ứng viên trong bán kính 5-10km' : 'No candidates within 5-10km'}
            </EmptyState>
          ) : (
            <CandidateGrid>
              {priority3.map(cand => (
                <CandidateCard key={cand.candidateId} $primaryColor="#8b5cf6" $bgDist="#f3e8ff" $colorDist="#6b21a8">
                  <div className="card-top">
                    <div className="name"><User size={14} style={{ display: 'inline', marginRight: 4 }} /> {cand.fullName}</div>
                    <div className="distance"><MapPin size={12} /> {cand.distance} km</div>
                  </div>
                  <div className="contact-info">
                    <span><Mail size={12} /> {cand.email}</span>
                    {cand.phone && <span><Phone size={12} /> {cand.phone}</span>}
                  </div>
                  {cand.suitable && cand.reasons && cand.reasons.length > 0 && (
                    <div className="match-badge">
                      <Sparkles size={12} />
                      {cand.reasons.join(', ')}
                    </div>
                  )}
                </CandidateCard>
              ))}
            </CandidateGrid>
          )}
        </PrioritySection>
      </div>
    </Modal>
  );
};

export default UrgentRecommendationsModal;
