/**
 * useVerificationGuard.js
 * Hook kiểm tra trạng thái xác minh của candidate.
 * Nếu chưa được duyệt, chuyển hướng đến trang /candidate/verification.
 *
 * Cách dùng:
 *   const { isVerified, isLoading } = useVerificationGuard({ redirect: true });
 *
 * Options:
 *   redirect  - boolean: tự động navigate khi chưa verified (default: true)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import candidateProfileService from '../services/candidateProfileService';

export const useVerificationGuard = ({ redirect = true } = {}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('PENDING');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Only run for candidates
    if (!isAuthenticated || user?.role !== 'candidate') {
      setIsLoading(false);
      setIsVerified(true); // Non-candidates bypass guard
      return;
    }

    const check = async () => {
      try {
        const p = await candidateProfileService.getMyProfile();
        setProfile(p);

        const status = p?.verificationStatus || 'PENDING';
        setVerificationStatus(status);

        const approved = status === 'APPROVED';
        setIsVerified(approved);

        if (!approved && redirect) {
          navigate('/candidate/verification', { replace: true });
        }
      } catch (err) {
        console.error('Verification guard error:', err);
        // On error, don't block access — fail open
        setIsVerified(true);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [isAuthenticated, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isLoading, isVerified, verificationStatus, profile };
};

export default useVerificationGuard;
