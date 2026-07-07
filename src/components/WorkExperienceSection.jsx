/**
 * WorkExperienceSection.jsx
 * Used inside CandidateProfile page.
 *
 * Props:
 *   candidateId  – string (Cognito sub)
 *   readOnly     – bool (true = viewing another user's profile, only show APPROVED)
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Plus,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../hooks/useToast';
import { createExperience, getMyCandidateExperiences } from '../services/experienceService';

// ─── Styled Components ────────────────────────────────────────────────────────

const Section = styled.div`
  background: ${p => p.theme.colors.bgLight};
  border-radius: ${p => p.theme.borderRadius.xl};
  padding: 32px;
  border: 1px solid ${p => p.theme.colors.border};

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      width: 22px;
      height: 22px;
      color: ${p => p.theme.colors.primary};
    }
  }
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: ${p => p.theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: #1a34a0; }

  svg { width: 16px; height: 16px; }
`;

// ── Experience card ────────────────────────────────────────────────────────────
const ExpCard = styled(motion.div)`
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 14px;
  background: ${p => p.theme.colors.bgDark};
  transition: border-color 0.2s;

  &:hover { border-color: #bfdbfe; }
`;

const ExpCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ExpIconBox = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg { width: 22px; height: 22px; color: #1e40af; }
`;

const ExpInfo = styled.div`
  flex: 1;

  .company { font-size: 16px; font-weight: 700; color: ${p => p.theme.colors.text}; }
  .title   { font-size: 14px; color: ${p => p.theme.colors.textLight}; margin-top: 2px; }
  .period  {
    font-size: 13px;
    color: ${p => p.theme.colors.textLight};
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 6px;

    svg { width: 14px; height: 14px; }
  }
`;

// Status badge
const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;

  ${p => p.$status === 'APPROVED' && `
    background: #d1fae5; color: #065f46; border: 1.5px solid #34d399;`}
  ${p => p.$status === 'PENDING' && `
    background: #fef3c7; color: #92400e; border: 1.5px solid #fcd34d;`}
  ${p => p.$status === 'REJECTED' && `
    background: #fee2e2; color: #991b1b; border: 1.5px solid #fca5a5;`}

  svg { width: 12px; height: 12px; }
`;

const DescToggle = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: ${p => p.theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  padding: 0;

  svg { width: 14px; height: 14px; }
`;

const RejectedReason = styled.div`
  margin-top: 10px;
  padding: 10px 14px;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  border-radius: 6px;
  font-size: 13px;
  color: #991b1b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 16px;
  color: ${p => p.theme.colors.textLight};

  svg { width: 48px; height: 48px; opacity: 0.3; margin-bottom: 12px; }
  p   { font-size: 14px; }
`;

// ── Modal overlay ─────────────────────────────────────────────────────────────
const Overlay = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
`;

const ModalBox = styled(motion.div)`
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);

  @media (max-width: 600px) { padding: 20px 16px; }
`;

const ModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;

  h3 { font-size: 20px; font-weight: 800; color: #1e293b; }

  button {
    background: #f1f5f9; border: none; border-radius: 8px;
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b;
    &:hover { background: #e2e8f0; }
    svg { width: 18px; height: 18px; }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .full { grid-column: 1 / -1; }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    .full { grid-column: 1; }
  }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 6px;

  label {
    font-size: 13px; font-weight: 600; color: #374151;
    span.req { color: #ef4444; margin-left: 2px; }
  }

  input, select, textarea {
    padding: 10px 12px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;

    &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    &::placeholder { color: #9ca3af; }
  }

  textarea { resize: vertical; min-height: 80px; }
`;

const CheckboxRow = styled.label`
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #374151; cursor: pointer;
  user-select: none;

  input[type=checkbox] {
    width: 16px; height: 16px; accent-color: #1e40af; cursor: pointer;
  }
`;

// ── Image upload ───────────────────────────────────────────────────────────────
const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  margin-top: 8px;
`;

const ImageThumb = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e2e8f0;

  img { width: 100%; height: 100%; object-fit: cover; }

  button {
    position: absolute; top: 4px; right: 4px;
    background: rgba(0,0,0,0.55); border: none; border-radius: 50%;
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff;
    &:hover { background: #ef4444; }
    svg { width: 12px; height: 12px; }
  }
`;

const AddImageBtn = styled.label`
  aspect-ratio: 1;
  border-radius: 10px;
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; cursor: pointer; font-size: 12px; color: #64748b;
  transition: all 0.2s;

  &:hover { border-color: #3b82f6; background: #eff6ff; color: #1e40af; }
  svg { width: 22px; height: 22px; }
  input { display: none; }
`;

// ── Modal footer ───────────────────────────────────────────────────────────────
const ModalFooter = styled.div`
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 24px;

  button {
    padding: 11px 22px; border-radius: 10px; font-size: 14px;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
  }

  .cancel {
    background: #f1f5f9; border: 1.5px solid #e2e8f0; color: #374151;
    &:hover { background: #e2e8f0; }
  }

  .submit {
    background: #1e40af; color: #fff; border: none;
    &:hover { background: #1a34a0; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_VI = [
  '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const MONTHS_EN = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatPeriod(exp, lang) {
  const months = lang === 'vi' ? MONTHS_VI : MONTHS_EN;
  const start = `${months[exp.startMonth] || exp.startMonth}/${exp.startYear}`;
  const end = exp.isCurrent
    ? (lang === 'vi' ? 'Hiện tại' : 'Present')
    : exp.endMonth && exp.endYear
      ? `${months[exp.endMonth] || exp.endMonth}/${exp.endYear}`
      : '';
  return end ? `${start} – ${end}` : start;
}

function statusIcon(status) {
  if (status === 'APPROVED') return <CheckCircle />;
  if (status === 'REJECTED') return <XCircle />;
  return <Clock />;
}

function statusLabel(status, lang) {
  const map = {
    APPROVED: lang === 'vi' ? 'Đã duyệt'   : 'Approved',
    PENDING:  lang === 'vi' ? 'Chờ duyệt'  : 'Pending',
    REJECTED: lang === 'vi' ? 'Bị từ chối' : 'Rejected',
  };
  return map[status] || status;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

// ─── Main Component ───────────────────────────────────────────────────────────

const WorkExperienceSection = ({ readOnly = false }) => {
  const { language } = useLanguage();
  const toast = useToast();

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState({});

  // Form state
  const defaultForm = {
    companyName: '',
    jobTitle: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrent: false,
    description: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [proofImages, setProofImages] = useState([]); // [{file, preview}]
  const fileInputRef = useRef(null);

  // Load experiences
  useEffect(() => {
    if (readOnly) return; // public view fetches already-filtered list from parent
    loadExperiences();
  }, [readOnly]);

  async function loadExperiences() {
    setLoading(true);
    try {
      const data = await getMyCandidateExperiences();
      setExperiences(data);
    } catch (err) {
      console.error('Failed to load experiences:', err);
    } finally {
      setLoading(false);
    }
  }

  // Displayed list: readOnly shows only APPROVED
  const displayed = readOnly
    ? experiences.filter(e => e.status === 'APPROVED')
    : experiences;

  // ── Image handling ──────────────────────────────────────────────────────────
  function handleImageAdd(e) {
    const files = Array.from(e.target.files || []);
    if (proofImages.length + files.length > 5) {
      toast.error(language === 'vi' ? 'Tối đa 5 ảnh' : 'Maximum 5 images');
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setProofImages(prev => [...prev, { file, preview: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeImage(idx) {
    setProofImages(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Form submit ─────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.companyName.trim() || !form.jobTitle.trim() || !form.startMonth || !form.startYear) {
      toast.error(language === 'vi' ? 'Vui lòng điền đủ thông tin bắt buộc' : 'Please fill all required fields');
      return;
    }
    if (!form.isCurrent && (!form.endMonth || !form.endYear)) {
      toast.error(language === 'vi' ? 'Vui lòng chọn tháng và năm kết thúc' : 'Please select end month and year');
      return;
    }
    // Validate minimum 2 months duration
    if (!form.isCurrent && form.startMonth && form.startYear && form.endMonth && form.endYear) {
      const startTotal = Number(form.startYear) * 12 + Number(form.startMonth);
      const endTotal   = Number(form.endYear)   * 12 + Number(form.endMonth);
      if (endTotal < startTotal) {
        toast.error(language === 'vi' ? 'Tháng kết thúc phải sau tháng bắt đầu' : 'End date must be after start date');
        return;
      }
      if (endTotal - startTotal < 2) {
        toast.error(language === 'vi' ? 'Công việc phải làm ít nhất 2 tháng mới được ghi nhận' : 'Job duration must be at least 2 months');
        return;
      }
    }
    if (!form.description.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập mô tả công việc' : 'Please enter a job description');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        startMonth: Number(form.startMonth),
        startYear:  Number(form.startYear),
        endMonth:   form.isCurrent ? null : (form.endMonth  ? Number(form.endMonth)  : null),
        endYear:    form.isCurrent ? null : (form.endYear   ? Number(form.endYear)   : null),
        proofImages: proofImages.map(p => p.preview), // base64 data URIs → Lambda uploads
      };

      await createExperience(payload);
      toast.success(language === 'vi' ? 'Đã gửi, chờ Admin duyệt!' : 'Submitted for review!');
      setShowModal(false);
      setForm(defaultForm);
      setProofImages([]);
      await loadExperiences();
    } catch (err) {
      toast.error(err.message || (language === 'vi' ? 'Gửi thất bại' : 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function openModal() {
    setForm(defaultForm);
    setProofImages([]);
    setShowModal(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Section>
        <SectionHeader>
          <h2>
            <Briefcase />
            {language === 'vi' ? 'Kinh nghiệm làm việc' : 'Work Experience'}
          </h2>
          {!readOnly && (
            <AddBtn onClick={openModal}>
              <Plus />
              {language === 'vi' ? 'Thêm kinh nghiệm' : 'Add Experience'}
            </AddBtn>
          )}
        </SectionHeader>

        {loading ? (
          <EmptyState>
            <Clock />
            <p>{language === 'vi' ? 'Đang tải...' : 'Loading...'}</p>
          </EmptyState>
        ) : displayed.length === 0 ? (
          <EmptyState>
            <Briefcase />
            <p>
              {readOnly
                ? (language === 'vi' ? 'Chưa có kinh nghiệm' : 'No experience yet')
                : (language === 'vi' ? 'Bạn chưa có kinh nghiệm nào. Nhấn "Thêm" để bắt đầu!' : 'No experience yet. Click "Add" to get started!')}
            </p>
          </EmptyState>
        ) : (
          <AnimatePresence>
            {displayed.map(exp => (
              <ExpCard
                key={exp.experienceId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ExpCardHeader>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <ExpIconBox><Building2 /></ExpIconBox>
                    <ExpInfo>
                      <div className="company">{exp.companyName}</div>
                      <div className="title">{exp.jobTitle}</div>
                      <div className="period">
                        <Calendar /> {formatPeriod(exp, language)}
                      </div>
                    </ExpInfo>
                  </div>
                  {!readOnly && (
                    <StatusBadge $status={exp.status}>
                      {statusIcon(exp.status)}
                      {statusLabel(exp.status, language)}
                    </StatusBadge>
                  )}
                </ExpCardHeader>

                {exp.status === 'REJECTED' && exp.rejectedReason && !readOnly && (
                  <RejectedReason>
                    <strong>{language === 'vi' ? 'Lý do từ chối: ' : 'Reason: '}</strong>
                    {exp.rejectedReason}
                  </RejectedReason>
                )}

                {exp.description && (
                  <>
                    <DescToggle onClick={() => setExpandedDesc(prev => ({ ...prev, [exp.experienceId]: !prev[exp.experienceId] }))}>
                      {expandedDesc[exp.experienceId]
                        ? <><ChevronUp />{language === 'vi' ? 'Thu gọn' : 'Collapse'}</>
                        : <><ChevronDown />{language === 'vi' ? 'Xem mô tả' : 'View description'}</>}
                    </DescToggle>
                    <AnimatePresence>
                      {expandedDesc[exp.experienceId] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p style={{ marginTop: 10, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                            {exp.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </ExpCard>
            ))}
          </AnimatePresence>
        )}
      </Section>

      {/* ── Add Experience Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <ModalBox
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <ModalHeader>
                <h3>{language === 'vi' ? 'Thêm kinh nghiệm làm việc' : 'Add Work Experience'}</h3>
                <button onClick={() => setShowModal(false)}><X /></button>
              </ModalHeader>

              <FormGrid>
                {/* Company name */}
                <FormGroup className="full">
                  <label>
                    {language === 'vi' ? 'Tên công ty' : 'Company name'}
                    <span className="req">*</span>
                  </label>
                  <input
                    value={form.companyName}
                    onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                    placeholder={language === 'vi' ? 'Ví dụ: Công ty TNHH ABC' : 'e.g. ABC Co., Ltd.'}
                  />
                </FormGroup>

                {/* Job title */}
                <FormGroup className="full">
                  <label>
                    {language === 'vi' ? 'Vị trí làm việc' : 'Job title'}
                    <span className="req">*</span>
                  </label>
                  <input
                    value={form.jobTitle}
                    onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                    placeholder={language === 'vi' ? 'Ví dụ: Nhân viên kế toán' : 'e.g. Accountant'}
                  />
                </FormGroup>

                {/* Start month */}
                <FormGroup>
                  <label>
                    {language === 'vi' ? 'Tháng bắt đầu' : 'Start month'}
                    <span className="req">*</span>
                  </label>
                  <select value={form.startMonth} onChange={e => setForm(p => ({ ...p, startMonth: e.target.value }))}>
                    <option value="">{language === 'vi' ? 'Chọn tháng' : 'Select month'}</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{MONTHS_VI[m]}</option>
                    ))}
                  </select>
                </FormGroup>

                {/* Start year */}
                <FormGroup>
                  <label>
                    {language === 'vi' ? 'Năm bắt đầu' : 'Start year'}
                    <span className="req">*</span>
                  </label>
                  <select value={form.startYear} onChange={e => setForm(p => ({ ...p, startYear: e.target.value }))}>
                    <option value="">{language === 'vi' ? 'Chọn năm' : 'Select year'}</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </FormGroup>

                {/* Currently working checkbox */}
                <FormGroup className="full">
                  <CheckboxRow>
                    <input
                      type="checkbox"
                      checked={form.isCurrent}
                      onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))}
                    />
                    {language === 'vi' ? 'Hiện tại vẫn đang làm việc' : 'Currently working here'}
                  </CheckboxRow>
                </FormGroup>

                {/* End date (hidden when isCurrent) */}
                {!form.isCurrent && (
                  <>
                    <FormGroup>
                      <label>{language === 'vi' ? 'Tháng kết thúc' : 'End month'} <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.endMonth} onChange={e => setForm(p => ({ ...p, endMonth: e.target.value }))}>
                        <option value="">{language === 'vi' ? 'Chọn tháng' : 'Select month'}</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{MONTHS_VI[m]}</option>
                        ))}
                      </select>
                    </FormGroup>
                    <FormGroup>
                      <label>{language === 'vi' ? 'Năm kết thúc' : 'End year'} <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.endYear} onChange={e => setForm(p => ({ ...p, endYear: e.target.value }))}>
                        <option value="">{language === 'vi' ? 'Chọn năm' : 'Select year'}</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </FormGroup>
                  </>
                )}
                {/* Duration hint */}
                <FormGroup className="full" style={{ marginTop: -8 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                    {language === 'vi'
                      ? 'Công việc phải làm ít nhất 2 tháng mới được ghi nhận.'
                      : 'The job must last at least 2 months to be accepted.'}
                  </p>
                </FormGroup>

                {/* Description */}
                <FormGroup className="full">
                  <label>{language === 'vi' ? 'Mô tả công việc' : 'Job description'} <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder={language === 'vi' ? 'Mô tả chi tiết công việc, nhiệm vụ và thành tích của bạn tại vị trí này...' : 'Describe your role, responsibilities and achievements in detail...'}
                    rows={4}
                  />
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                    {language === 'vi'
                      ? 'Mô tả chi tiết công việc, nhiệm vụ và thành tích của bạn tại vị trí này. Yêu cầu trình bày đầy đủ và rõ ràng.'
                      : 'Describe your tasks, responsibilities and achievements at this position in detail. Clear and thorough descriptions are required.'}
                  </p>
                </FormGroup>

                {/* Proof images */}
                <FormGroup className="full">
                  <label>
                    {language === 'vi' ? 'Hình ảnh chứng minh' : 'Proof images'}
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>
                      ({proofImages.length}/5)
                    </span>
                  </label>
                  <ImageGrid>
                    {proofImages.map((img, idx) => (
                      <ImageThumb key={idx}>
                        <img src={img.preview} alt={`proof-${idx}`} />
                        <button type="button" onClick={() => removeImage(idx)}>
                          <Trash2 />
                        </button>
                      </ImageThumb>
                    ))}
                    {proofImages.length < 5 && (
                      <AddImageBtn>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleImageAdd}
                          ref={fileInputRef}
                        />
                        <Upload />
                        <span>{language === 'vi' ? 'Thêm ảnh' : 'Add image'}</span>
                      </AddImageBtn>
                    )}
                  </ImageGrid>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    {language === 'vi'
                      ? 'Tối đa 5 ảnh • JPG / PNG / WebP'
                      : 'Max 5 images • JPG / PNG / WebP'}
                  </p>
                </FormGroup>
              </FormGrid>

              <ModalFooter>
                <button className="cancel" onClick={() => setShowModal(false)}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button className="submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...')
                    : (language === 'vi' ? 'Gửi duyệt' : 'Submit for review')}
                </button>
              </ModalFooter>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default WorkExperienceSection;
