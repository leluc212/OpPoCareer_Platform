import React, { useRef } from 'react';
import styled from 'styled-components';

export const Button = styled.button`
  padding: ${props => {
    if (props.$size === 'small') return '8px 16px';
    if (props.$size === 'large') return '14px 28px';
    return '12px 24px';
  }};
  font-size: ${props => props.$size === 'small' ? '13px' : '15px'};
  font-weight: 700;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  cursor: pointer;
  border: none;
  
  ${props => props.$variant === 'primary' && `
    background: #1e40af;
    color: white;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
    
    &:hover:not(:disabled) {
      background: #1e3a8a;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(30, 64, 175, 0.35);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(30, 64, 175, 0.25);
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background: #FFFFFF;
    color: #64748B;
    border: 2px solid #E8EFFF;
    
    &:hover:not(:disabled) {
      border-color: #1e40af;
      color: #1e40af;
      background: #EFF6FF;
    }
  `}
  
  ${props => props.$variant === 'outline' && `
    background: #FFFFFF;
    color: #1e40af;
    border: 2px solid #1e40af;
    
    &:hover:not(:disabled) {
      background: #EFF6FF;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
    }
  `}
  
  ${props => props.$variant === 'ghost' && `
    background: transparent;
    color: #64748B;
    
    &:hover:not(:disabled) {
      background: #F8FAFC;
      color: #1E293B;
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background: #EF4444;
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    
    &:hover:not(:disabled) {
      background: #DC2626;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  ${props => props.$fullWidth && `
    width: 100%;
  `}
`;

export const Input = styled.input`
  padding: 14px 16px;
  font-size: 15px;
  border: 2px solid #E8EFFF;
  border-radius: 12px;
  background: #FFFFFF;
  color: #1E293B;
  transition: all 0.2s ease;
  width: 100%;
  font-weight: 500;
  
  &:focus {
    border-color: #1e40af;
    box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.1);
    background: #FFFFFF;
    outline: none;
  }
  
  &:hover:not(:focus):not(:disabled) {
    border-color: #BFDBFE;
  }
  
  &::placeholder {
    color: #94A3B8;
    font-weight: 400;
  }
  
  &:disabled {
    background: #F8FAFC;
    color: #64748B;
    cursor: not-allowed;
    opacity: 1;
    border-color: #E2E8F0;
  }
  
  ${props => props.$error && `
    border-color: #EF4444;
    
    &:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }
  `}

  &[type="date"]::-webkit-datetime-edit {
    display: flex;
  }
  &[type="date"]::-webkit-datetime-edit-day-field { order: 1; }
  &[type="date"]::-webkit-datetime-edit-text:first-of-type { order: 2; }
  &[type="date"]::-webkit-datetime-edit-month-field { order: 3; }
  &[type="date"]::-webkit-datetime-edit-text:last-of-type { order: 4; }
  &[type="date"]::-webkit-datetime-edit-year-field { order: 5; }
  
  &[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 1;
    }
  }
`;

export const TextArea = styled.textarea`
  padding: 14px 16px;
  font-size: 15px;
  border: 2px solid #E8EFFF;
  border-radius: 12px;
  background: #FFFFFF;
  color: #1E293B;
  transition: all 0.2s ease;
  width: 100%;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.6;
  
  &:focus {
    border-color: #1e40af;
    box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.1);
    background: #FFFFFF;
    outline: none;
  }
  
  &:hover:not(:focus):not(:disabled) {
    border-color: #BFDBFE;
  }
  
  &::placeholder {
    color: #94A3B8;
    font-weight: 400;
  }
  
  &:disabled {
    background: #F8FAFC;
    color: #64748B;
    cursor: not-allowed;
    opacity: 1;
    border-color: #E2E8F0;
  }
`;

export const Select = styled.select`
  padding: 14px 16px;
  font-size: 15px;
  border: 2px solid #E8EFFF;
  border-radius: 12px;
  background: #FFFFFF;
  color: #1E293B;
  transition: all 0.2s ease;
  width: 100%;
  cursor: pointer;
  font-weight: 500;
  
  &:focus {
    border-color: #1e40af;
    box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.1);
    background: #FFFFFF;
    outline: none;
  }
  
  &:hover:not(:focus):not(:disabled) {
    border-color: #BFDBFE;
  }
  
  /* Style for empty/placeholder option */
  &:invalid,
  option[value=""] {
    color: #94A3B8;
    font-weight: 400;
  }
  
  option {
    background: #FFFFFF;
    color: #1E293B;
    font-weight: 500;
  }
  
  option[value=""] {
    color: #94A3B8;
    font-weight: 400;
  }
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  /* Dấu * bắt buộc màu đỏ */
  span.req {
    color: #ef4444;
    font-weight: 700;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 14px;
`;

export const ErrorText = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.error};
  margin-top: 3px;
  display: block;
`;

// ── DateInput component ──────────────────────────────────────────────────────
const DateInputWrapper = styled.div`
  position: relative;
  width: 100%;

  input[type="text"] {
    padding-right: 40px;
  }

  input[type="date"] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 1px;
    height: 1px;
    top: 0;
    left: 0;
  }

  .cal-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.15s;
    &:hover { color: #2563EB; }
  }
`;

const maskDate = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  return out;
};

// Convert dd/mm/yyyy ↔ yyyy-mm-dd
const toNative = (dmy) => {
  const p = dmy.split('/');
  if (p.length !== 3 || p[2].length !== 4) return '';
  return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
};
const fromNative = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
};

export const DateInput = ({ value, onChange, required, style, $error, placeholder = 'dd/mm/yyyy' }) => {
  const nativeRef = useRef(null);

  const handleText = (e) => {
    onChange(maskDate(e.target.value));
  };

  const handleNative = (e) => {
    onChange(fromNative(e.target.value));
  };

  const openPicker = () => {
    const el = nativeRef.current;
    if (!el) return;
    el.value = toNative(value || '');
    el.showPicker?.();
  };

  return (
    <DateInputWrapper>
      <Input
        type="text"
        value={value || ''}
        onChange={handleText}
        placeholder={placeholder}
        required={required}
        style={style}
        $error={$error}
        inputMode="numeric"
        maxLength={10}
      />
      <input
        ref={nativeRef}
        type="date"
        onChange={handleNative}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button type="button" className="cal-btn" onClick={openPicker} tabIndex={-1}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>
    </DateInputWrapper>
  );
};
