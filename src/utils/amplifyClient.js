// AWS Amplify v6 Auth configuration
import { 
  signUp, 
  signIn, 
  confirmSignUp, 
  resendSignUpCode, 
  signOut, 
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  signInWithRedirect,
  updatePassword
} from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

// Configure token storage to use localStorage
cognitoUserPoolsTokenProvider.setKeyValueStorage(window.localStorage);

// Redirect URI must exactly match what's registered in Cognito Hosted UI.
// Local dev: http://localhost:3000/  (vite base = '/', port 3000)
// Production: https://oppocareer.com/
const redirectUri = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/'
  : 'https://oppocareer.com/';

// Configure Amplify v6 with proper storage and OAuth settings
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-1_ShCajkmJd',
      userPoolClientId: '2mv7qt4gpmq03dmlm0or9724n8',
      loginWith: {
        email: true,
        oauth: {
          domain: 'opporeview.auth.ap-southeast-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [redirectUri],
          redirectSignOut: [redirectUri],
          responseType: 'code'
        }
      }
    }
  }
});

console.info('✅ Amplify v6 configured with localStorage for token persistence and Google OAuth');

// Export Auth functions for v6
export const Auth = {
  signUp,
  signIn,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  signInWithRedirect,
  updatePassword
};

export { Amplify };
export default { Amplify, Auth };

// Export OAuth constants for non-hardcoded usage
export const OAUTH_DOMAIN = 'opporeview.auth.ap-southeast-1.amazoncognito.com';
export const OAUTH_CLIENT_ID = '2mv7qt4gpmq03dmlm0or9724n8';
export const OAUTH_REDIRECT_URI = redirectUri;
