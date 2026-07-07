/**
 * useEmailCheck — React hook kiểm tra email real-time
 *
 * Dùng chung cho CandidateRegister, EmployerRegister và LoginPage.
 * Debounce 500ms, gọi GET /auth/check-email?email=...
 *
 * Returns:
 *   {
 *     emailStatus:  null | 'checking' | 'free' | 'native' | 'google',
 *     checkEmail:   (email: string) => void,   // gọi khi email thay đổi
 *     resetStatus:  () => void,
 *   }
 */
import { useState, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_CHECK_EMAIL_API
  || import.meta.env.VITE_CANDIDATE_API_URL
  || 'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useEmailCheck() {
  const [emailStatus, setEmailStatus] = useState(null);
  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  const checkEmail = useCallback((email) => {
    // Huỷ debounce cũ
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Huỷ request đang bay (nếu có)
    if (abortRef.current) abortRef.current.abort();

    const trimmed = (email || '').trim();

    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setEmailStatus(null);
      return;
    }

    // Reset về null ngay khi bắt đầu debounce để ẩn thông báo cũ
    setEmailStatus(null);

    debounceRef.current = setTimeout(async () => {
      setEmailStatus('checking');
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const url = `${API_BASE}/auth/check-email?email=${encodeURIComponent(trimmed.toLowerCase())}`;
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          // Server error → không block user, ẩn thông báo
          setEmailStatus(null);
          return;
        }

        const data = await res.json();

        if (!data.exists) {
          setEmailStatus('free');
        } else if (data.provider === 'google') {
          setEmailStatus('google');
        } else {
          setEmailStatus('native');
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // request bị huỷ — bình thường
        console.warn('[useEmailCheck] fetch error:', err);
        setEmailStatus(null); // lỗi mạng → không block user
      }
    }, 500);
  }, []);

  const resetStatus = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setEmailStatus(null);
  }, []);

  return { emailStatus, checkEmail, resetStatus };
}
