import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// Keep the context object stable across HMR reloads by storing it on the window.
// Without this, Vite hot-reloading AuthContext creates a new context object while
// App.jsx still holds a reference to the old one, causing "must be used within AuthProvider".
const AUTH_CONTEXT_KEY = '__OpPoAuthContext__';
if (!window[AUTH_CONTEXT_KEY]) {
  window[AUTH_CONTEXT_KEY] = createContext();
}
const AuthContext = window[AUTH_CONTEXT_KEY];

// ─── One-time fix: correct any wrongly-locked Google role mappings ────────────
// If a Google account already has a candidate profile in the DB but was
// accidentally locked to 'employer' in localStorage, reset the mapping so the
// next login re-detects the correct role.
try {
  const googleRoleMap = JSON.parse(localStorage.getItem('googleRoleMapping') || '{}');
  // Hard-coded corrections for known mis-mapped accounts
  const corrections = { 'duypl2310@gmail.com': 'candidate' };
  let changed = false;
  for (const [email, correctRole] of Object.entries(corrections)) {
    if (googleRoleMap[email] && googleRoleMap[email] !== correctRole) {
      console.warn(`🔧 [AuthContext] Fixing wrong role mapping for ${email}: ${googleRoleMap[email]} → ${correctRole}`);
      googleRoleMap[email] = correctRole;
      changed = true;
    }
  }
  // Also fix the cached user object in localStorage if it's affected
  if (changed) {
    localStorage.setItem('googleRoleMapping', JSON.stringify(googleRoleMap));
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (savedUser && corrections[savedUser.email] && savedUser.role !== corrections[savedUser.email]) {
        savedUser.role = corrections[savedUser.email];
        localStorage.setItem('user', JSON.stringify(savedUser));
        console.warn(`🔧 [AuthContext] Fixed cached user role for ${savedUser.email} → ${savedUser.role}`);
      }
    } catch (_) {}
  }
} catch (_) {}
// ─────────────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData) => {
    console.log('🔐 Login called with:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));
  };

  const logout = async () => {
    console.log('🚪 Logout called');
    
    // Tự động tắt trạng thái tìm việc của candidate khi đăng xuất
    if (user?.role === 'candidate' && user?.userId) {
      try {
        const isAvailableStr = localStorage.getItem('candidate_job_search_is_available');
        const isAvailable = isAvailableStr ? JSON.parse(isAvailableStr) : false;
        if (isAvailable) {
          const { default: candidateProfileService } = await import('../services/candidateProfileService');
          await candidateProfileService.updateProfile({ isActive: false }).catch(() => null);
          localStorage.setItem('candidate_job_search_is_available', JSON.stringify(false));
        }
      } catch (e) {
        console.log('Error turning off job search status during logout:', e);
      }
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    sessionStorage.clear(); // Clear session khi đăng xuất
    try {
      await signOut();
    } catch (e) {
      console.log('SignOut error (ignored):', e);
    }
  };

  const updateUser = (userData) => {
    console.log('📝 Update user called with:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Check Cognito session on mount and after refresh
  useEffect(() => {
    const BASE = import.meta.env.BASE_URL || '/';
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        console.log('🔍 [AuthContext] Starting authentication check...');
        const hasToken = !!Object.keys(localStorage).some(
          key => key.startsWith('CognitoIdentityServiceProvider.') && key.endsWith('.idToken')
        );
        
        // Try to get current Cognito user
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();
        
        if (!isMounted) {
          console.log('⚠️ Component unmounted, skipping auth update');
          return;
        }
        
        console.log('✅ [AuthContext] Cognito user found:', currentUser.username);
        console.log('✅ [AuthContext] Session tokens:', session.tokens ? 'Present' : 'Missing');

        const userGroups = session.tokens?.accessToken?.payload['cognito:groups'] || [];
        const roleFromGroups = userGroups.includes('Admin')
          ? 'admin'
          : userGroups.includes('Employer')
            ? 'employer'
            : userGroups.includes('Candidate')
              ? 'candidate'
              : null;
        const isSocialUser = Boolean(session.tokens?.idToken?.payload?.identities);
        
        if (currentUser && session.tokens) {
          // User is authenticated with Cognito
          const userIdFromToken = session.tokens.idToken.payload.sub; // Always get userId from token
          const emailFromToken = session.tokens.idToken.payload.email;
          const savedUser = localStorage.getItem('user');
          
          if (savedUser) {
            // Use saved user data from localStorage but ensure userId and email are from token
            const userData = JSON.parse(savedUser);
            userData.userId = userIdFromToken; // Override with token userId
            userData.email = emailFromToken; // Override with token email
            userData.username = currentUser.username; // Override with current username
            
            // Kiểm tra nếu Google user đã có role cố định (không cho đổi vai trò)
            const pendingRole = localStorage.getItem('pendingGoogleRole');
            const googleRoleMap = JSON.parse(localStorage.getItem('googleRoleMapping') || '{}');
            
            if (googleRoleMap[emailFromToken] && pendingRole && pendingRole !== googleRoleMap[emailFromToken]) {
              // MISMATCH: Email đã khóa ở role khác → sign out và báo lỗi
              const lockedRole = googleRoleMap[emailFromToken] === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng';
              const attemptedRole = pendingRole === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng';
              console.warn(`🚫 [AuthContext] Role mismatch! Email ${emailFromToken} locked to ${googleRoleMap[emailFromToken]}, but tried ${pendingRole}`);
              localStorage.removeItem('pendingGoogleRole');
              localStorage.setItem('googleLoginError', JSON.stringify({
                title: 'Tài khoản Google đã được đăng ký',
                message: `Email ${emailFromToken} đã đăng ký với vai trò ${lockedRole}. Vui lòng dùng tài khoản Google khác để đăng nhập với vai trò ${attemptedRole}.`
              }));
              // Giữ isLoading = true để không render dashboard, redirect ngay
              localStorage.removeItem('user');
              try {
                const { signOut } = await import('aws-amplify/auth');
                await signOut();
              } catch (e) { /* ignore */ }
              window.location.replace(`${BASE}login`);
              return;
            } else if (googleRoleMap[emailFromToken]) {
              // Email này đã đăng ký với vai trò cố định
              userData.role = googleRoleMap[emailFromToken];
              console.log('🔒 [AuthContext] Google account locked to role:', userData.role);
              if (pendingRole) localStorage.removeItem('pendingGoogleRole');
            } else if (pendingRole && ['candidate', 'employer'].includes(pendingRole)) {
              // Lần đầu đăng nhập Google → kiểm tra profile tồn tại trước khi lock
              let detectedRole = null;
              try {
                const { default: candidateProfileService } = await import('../services/candidateProfileService');
                const candidateProfile = await candidateProfileService.getMyProfile().catch(() => null);
                if (candidateProfile) {
                  detectedRole = 'candidate';
                  console.log('🔍 [AuthContext] Found existing candidate profile → role: candidate');
                }
              } catch (e) {
                console.log('[AuthContext] Could not detect existing profile:', e.message);
              }
              const roleToLock = detectedRole || pendingRole;
              userData.role = roleToLock;
              googleRoleMap[emailFromToken] = roleToLock;
              localStorage.setItem('googleRoleMapping', JSON.stringify(googleRoleMap));
              console.log('📋 [AuthContext] Locking Google account to role:', roleToLock);
              localStorage.removeItem('pendingGoogleRole');
            }
            
            // If social account has no Cognito group yet, force role onboarding page.
            if (isSocialUser && !roleFromGroups) {
              userData.role = null;
              localStorage.setItem('needsGoogleRoleSetup', '1');
            } else {
              if (roleFromGroups) {
                userData.role = roleFromGroups;
              }
              localStorage.removeItem('needsGoogleRoleSetup');
            }

            console.log('✅ [AuthContext] Restored user from localStorage:', userData.email, 'Role:', userData.role, 'UserId:', userData.userId);
            
            if (isMounted) {
              setUser(userData);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } else {
            // Create user data from Cognito tokens
            let userRole = roleFromGroups;
            
            // Nếu không có Cognito group (đăng nhập Google),
            // kiểm tra role mapping cố định trước, rồi mới dùng pendingGoogleRole
            if (!userRole) {
              const googleRoleMap = JSON.parse(localStorage.getItem('googleRoleMapping') || '{}');
              const emailForMapping = session.tokens.idToken.payload.email;
              const pendingRole = localStorage.getItem('pendingGoogleRole');
              
              if (googleRoleMap[emailForMapping] && pendingRole && pendingRole !== googleRoleMap[emailForMapping]) {
                // MISMATCH: Email đã khóa ở role khác → sign out và báo lỗi
                const lockedRole = googleRoleMap[emailForMapping] === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng';
                const attemptedRole = pendingRole === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng';
                console.warn(`🚫 [AuthContext] Role mismatch! Email ${emailForMapping} locked to ${googleRoleMap[emailForMapping]}, but tried ${pendingRole}`);
                localStorage.removeItem('pendingGoogleRole');
                localStorage.setItem('googleLoginError', JSON.stringify({
                  title: 'Tài khoản Google đã được đăng ký',
                  message: `Email ${emailForMapping} đã đăng ký với vai trò ${lockedRole}. Vui lòng dùng tài khoản Google khác để đăng nhập với vai trò ${attemptedRole}.`
                }));
                // Redirect to login so the LoginPage can show the error immediately
                localStorage.removeItem('user');
                try {
                  const { signOut } = await import('aws-amplify/auth');
                  await signOut();
                } catch (e) { /* ignore */ }
                window.location.replace(`${BASE}login`);
                return;
              } else if (googleRoleMap[emailForMapping]) {
                userRole = googleRoleMap[emailForMapping];
                console.log('🔒 [AuthContext] Google account locked to role:', userRole);
              } else {
                if (pendingRole && ['candidate', 'employer'].includes(pendingRole)) {
                  // Before trusting pendingRole for a new user, check if candidate profile exists
                  let detectedRole = null;
                  try {
                    const { default: candidateProfileService } = await import('../services/candidateProfileService');
                    const candidateProfile = await candidateProfileService.getMyProfile().catch(() => null);
                    if (candidateProfile) {
                      detectedRole = 'candidate';
                      console.log('🔍 [AuthContext] Found existing candidate profile → role: candidate');
                    }
                  } catch (e) {
                    console.log('[AuthContext] Could not detect existing profile:', e.message);
                  }

                  if (detectedRole) {
                    userRole = detectedRole;
                    googleRoleMap[emailForMapping] = detectedRole;
                    localStorage.setItem('googleRoleMapping', JSON.stringify(googleRoleMap));
                    console.log('📋 [AuthContext] Locking to DETECTED role (existing profile):', userRole);
                  } else {
                    userRole = pendingRole;
                    googleRoleMap[emailForMapping] = pendingRole;
                    localStorage.setItem('googleRoleMapping', JSON.stringify(googleRoleMap));
                    console.log('📋 [AuthContext] Locking NEW Google account to role:', userRole);
                  }
                } else {
                  userRole = null;
                }
              }
              localStorage.removeItem('pendingGoogleRole');
            }

            if (isSocialUser && !roleFromGroups && !userRole) {
              localStorage.setItem('needsGoogleRoleSetup', '1');
            } else {
              localStorage.removeItem('needsGoogleRoleSetup');
            }
            
            const userData = {
              username: currentUser.username,
              userId: session.tokens.idToken.payload.sub,
              email: session.tokens.idToken.payload.email,
              role: userRole,
              approved: true
            };
            console.log('✅ [AuthContext] Created user from Cognito:', userData.email, 'Role:', userData.role, 'UserId:', userData.userId);

            // Auto-create profile ONLY when we have CONFIRMED the candidate has no profile yet.
            // getMyProfile() returns null only for a genuine 404 (new user) and throws for
            // transient errors (network/5xx). Previously we did `.catch(() => null)`, so a
            // transient failure looked like "no profile" and triggered a blank createProfile
            // that could overwrite/blank an existing profile on login. Now we skip auto-create
            // whenever the existence check fails, to never risk overwriting real data.
            if (userRole === 'candidate' && userData.userId) {
              try {
                const { default: candidateProfileService } = await import('../services/candidateProfileService');
                let existing = null;
                let profileCheckFailed = false;
                try {
                  existing = await candidateProfileService.getMyProfile();
                } catch (checkErr) {
                  profileCheckFailed = true;
                  console.warn('[AuthContext] Profile existence check failed on login — skipping auto-create to avoid overwriting existing data:', checkErr);
                }
                if (!existing && !profileCheckFailed) {
                  await candidateProfileService.createProfile({
                    userId: userData.userId,
                    fullName: session.tokens.idToken.payload.name || '',
                    email: userData.email,
                  }).catch(() => null);
                }
              } catch (_) {}
            }
            
            if (isMounted) {
              setUser(userData);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        } else {
          // No valid Cognito session
          console.log('❌ [AuthContext] No valid Cognito session');
          const savedUser = localStorage.getItem('user');
          if (savedUser && hasToken && isMounted) {
            try {
              const userData = JSON.parse(savedUser);
              console.log('✅ [AuthContext] Falling back to saved user in localStorage (no Cognito session):', userData.email);
              setUser(userData);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            } catch (e) { /* ignore */ }
          }
          
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.log('ℹ️ [AuthContext] No authenticated user (expected for guests):', error.name);
        
        // Fallback: Check if we have user in localStorage to keep them logged in
        const savedUser = localStorage.getItem('user');
        if (savedUser && hasToken && isMounted) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('✅ [AuthContext] Falling back to saved user in localStorage (Cognito error):', userData.email);
            setUser(userData);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        }
        
        // No authenticated user, clear state
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log('✅ [AuthContext] Auth check complete');
        }
      }
    };

    // If redirect from Hosted UI with code + we have pkce verifier, perform token exchange first
    const tryHandleCode = async () => {
      try {
        const params = new URLSearchParams(window.location.search || '');

        // ── Bắt lỗi từ Cognito Pre Sign-up trigger (Google flow) ──
        // Cognito redirect về với ?error=access_denied hoặc ?error=invalid_request
        // kèm ?error_description=<message từ Lambda>
        const oauthError = params.get('error');
        const oauthErrorDesc = params.get('error_description');
        if (oauthError && oauthErrorDesc) {
          console.warn('🚫 [AuthContext] OAuth error from Cognito:', oauthError, oauthErrorDesc);
          // Decode URL-encoded message (e.g. "Email+đã+tồn+tại..." → proper string)
          const decoded = decodeURIComponent(oauthErrorDesc.replace(/\+/g, ' '));
          console.warn('🚫 [AuthContext] Decoded error_description:', decoded);

          // Xoá params khỏi URL ngay lập tức để tránh re-trigger
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('error');
            url.searchParams.delete('error_description');
            url.searchParams.delete('state');
            window.history.replaceState({}, document.title, url.pathname + url.search);
          } catch (_) {}

          // Lưu vào localStorage để trang login/register hiển thị modal
          if (decoded.includes('Email đã tồn tại')) {
            localStorage.setItem('googleLoginError', JSON.stringify({
              title: 'Đăng nhập Google thất bại',
              message: decoded
            }));
          } else {
            localStorage.setItem('googleLoginError', JSON.stringify({
              title: 'Đăng nhập Google thất bại',
              message: decoded || 'Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại.'
            }));
          }

          sessionStorage.removeItem('pkce_code_verifier');

          // Điều hướng về trang login (không để user kẹt loading)
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          const pendingRole = localStorage.getItem('pendingGoogleRole') || '';
          localStorage.removeItem('pendingGoogleRole');
          // Điều hướng về trang phù hợp
          const redirectPath = pendingRole === 'employer'
            ? '/register/employer'
            : pendingRole === 'candidate'
              ? '/register/candidate'
              : '/login';
          window.location.replace(redirectPath);
          return;
        }

        const code = params.get('code');
        if (!code) { await checkAuth(); return; }
        const verifier = sessionStorage.getItem('pkce_code_verifier');
        if (!verifier) { await checkAuth(); return; }

        console.log('🔐 [AuthContext] Exchanging PKCE code for tokens...');
        const { OAUTH_DOMAIN: domain, OAUTH_CLIENT_ID: clientId, OAUTH_REDIRECT_URI: redirectUri } = await import('../utils/amplifyClient');

        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code: code,
          redirect_uri: redirectUri,
          code_verifier: verifier
        });

        const tokenRes = await fetch(`https://${domain}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text().catch(() => '');
          console.warn('❌ Token exchange failed', tokenRes.status, errText);
          // fallback to normal check
          await checkAuth();
          return;
        }

        const tokens = await tokenRes.json();
        // tokens: access_token, id_token, refresh_token, expires_in, token_type
        const decodePayload = (jwt) => {
          try {
            const parts = jwt.split('.');
            return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          } catch (e) { return {}; }
        };

        const idPayload = decodePayload(tokens.id_token || '');
        const accessPayload = decodePayload(tokens.access_token || '');

        const userGroups = accessPayload?.['cognito:groups'] || [];
        const roleFromGroups = userGroups.includes('Admin')
          ? 'admin'
          : userGroups.includes('Employer')
            ? 'employer'
            : userGroups.includes('Candidate')
              ? 'candidate'
              : null;

        // Determine final role
        let finalRole = roleFromGroups;
        const googleRoleMap = JSON.parse(localStorage.getItem('googleRoleMapping') || '{}');
        const pendingRole = localStorage.getItem('pendingGoogleRole');
        const isSocialUser = Boolean(idPayload.identities);

        if (!finalRole && isSocialUser) {
          if (googleRoleMap[idPayload.email]) {
            // Already locked — always respect existing mapping, ignore pendingRole
            finalRole = googleRoleMap[idPayload.email];
            console.log('🔒 [AuthContext-PKCE] Locked to role:', finalRole);
          } else {
            // No mapping yet — try to detect existing profile in DB before trusting pendingRole
            let detectedRole = null;
            try {
              const userId = idPayload.sub;
              // Check candidate profile first
              const { default: candidateProfileService } = await import('../services/candidateProfileService');
              // Temporarily store tokens so services can auth
              const tempClientId = '2mv7qt4gpmq03dmlm0or9724n8';
              const tempUsername = idPayload['cognito:username'] || idPayload.email?.split('@')[0] || idPayload.sub;
              const tempBase = `CognitoIdentityServiceProvider.${tempClientId}.${tempUsername}`;
              localStorage.setItem(`${tempBase}.idToken`, tokens.id_token || '');
              localStorage.setItem(`${tempBase}.accessToken`, tokens.access_token || '');
              localStorage.setItem(`CognitoIdentityServiceProvider.${tempClientId}.LastAuthUser`, tempUsername);

              const candidateProfile = await candidateProfileService.getMyProfile().catch(() => null);
              if (candidateProfile) {
                detectedRole = 'candidate';
                console.log('🔍 [AuthContext-PKCE] Found existing candidate profile → role: candidate');
              }
            } catch (e) {
              console.log('[AuthContext-PKCE] Could not detect existing profile:', e.message);
            }

            if (detectedRole) {
              // Existing profile found → lock to detected role, ignore pendingRole
              finalRole = detectedRole;
              googleRoleMap[idPayload.email] = detectedRole;
              localStorage.setItem('googleRoleMapping', JSON.stringify(googleRoleMap));
              console.log('📋 [AuthContext-PKCE] Locking to DETECTED role (existing profile):', finalRole);
            } else if (pendingRole && ['candidate', 'employer'].includes(pendingRole)) {
              // Truly new user — safe to use pendingRole
              finalRole = pendingRole;
              googleRoleMap[idPayload.email] = pendingRole;
              localStorage.setItem('googleRoleMapping', JSON.stringify(googleRoleMap));
              console.log('📋 [AuthContext-PKCE] Locking NEW Google account to:', finalRole);
            }
          }
          localStorage.removeItem('pendingGoogleRole');
        }

        const userData = {
          username: idPayload['cognito:username'] || idPayload.email?.split('@')[0] || idPayload.sub,
          userId: idPayload.sub,
          email: idPayload.email,
          role: finalRole,
          approved: true
        };

        if (isSocialUser && !roleFromGroups && !finalRole) {
          localStorage.setItem('needsGoogleRoleSetup', '1');
        } else {
          localStorage.removeItem('needsGoogleRoleSetup');
        }

        console.log('✅ [AuthContext] PKCE login succeeded, user:', userData.email, 'role:', userData.role);
        // Persist user data for UI
        localStorage.setItem('user', JSON.stringify(userData));

        // Also write tokens into Amplify-compatible storage keys so fetchAuthSession() works
        try {
          const clientId = '2mv7qt4gpmq03dmlm0or9724n8';
          const username = userData.username || userData.userId || idPayload.sub;
          const base = `CognitoIdentityServiceProvider.${clientId}.${username}`;
          localStorage.setItem(`${base}.idToken`, tokens.id_token || '');
          localStorage.setItem(`${base}.accessToken`, tokens.access_token || '');
          if (tokens.refresh_token) localStorage.setItem(`${base}.refreshToken`, tokens.refresh_token);
          localStorage.setItem(`${base}.tokenScopesString`, 'openid email profile');
          // LastAuthUser key
          localStorage.setItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`, username);
        } catch (e) {
          console.warn('Failed to write Amplify token keys:', e);
        }
        sessionStorage.removeItem('pkce_code_verifier');

        if (isMounted) {
          setUser(userData);
          setIsAuthenticated(true);
          setIsLoading(false);
        }

        // remove code/state from URL
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, document.title, url.pathname + url.search);
        } catch (e) { /* ignore */ }

        return;
      } catch (e) {
        console.error('PKCE token exchange error', e);
        await checkAuth();
      }
    };

    tryHandleCode();
    // If redirected from Hosted UI (code/state present) allow a few retries
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.has('code') || params.has('state') || params.has('error')) {
        let attempts = 0;
        const maxAttempts = 4;
        const retryDelay = 800;
        const retry = async () => {
          attempts += 1;
          if (!isMounted) return;
          console.log('🔁 [AuthContext] OAuth redirect detected, retrying auth check (attempt', attempts, ')');
          await new Promise(r => setTimeout(r, retryDelay));
          try {
            await checkAuth();
          } catch (e) { /* ignore */ }
          const stored = localStorage.getItem('user');
          if (!stored && attempts < maxAttempts && isMounted) {
            retry();
          }
        };
        retry();
      }
    } catch (e) { /* ignore */ }
    
    // Listen for storage events (when user data is updated in another tab or by login)
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        console.log('🔄 [AuthContext] User data changed in storage, re-checking auth...');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for Amplify Hub events for real-time auth sync
    const unsubscribeHub = Hub.listen('auth', ({ payload }) => {
      console.log('🔔 [AuthContext] Hub Auth Event:', payload.event, payload.message);
      
      switch (payload.event) {
        case 'signInWithRedirect':
        case 'signedIn':
          console.log('✨ [AuthContext] Sign in/Redirect successful, re-checking auth...');
          checkAuth();
          break;
        case 'signedOut':
          console.log('📤 [AuthContext] Signed out');
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
          localStorage.removeItem('user');
          break;
      }
    });
    
    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      unsubscribeHub();
    };
  }, []);

  // Auto deactivate candidate availability status on new tab/browser session
  useEffect(() => {
    if (user?.role === 'candidate' && user?.userId) {
      const isNewSession = !sessionStorage.getItem('session_initialized');
      if (isNewSession) {
        sessionStorage.setItem('session_initialized', 'true');
        console.log('🔄 [AuthContext] New session detected for candidate. Deactivating job search status...');
        import('../services/candidateProfileService').then(({ default: candidateProfileService }) => {
          candidateProfileService.updateProfile({ isActive: false }).catch(() => null);
          localStorage.setItem('candidate_job_search_is_available', JSON.stringify(false));
        }).catch(() => null);
      }
    }
  }, [user?.role, user?.userId]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
