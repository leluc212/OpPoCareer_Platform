// Amplify v6 configuration for Auth (Cognito User Pool)
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || 'ap-southeast-1_LUa2Zfjtv',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '4g1ssfgjmnuveblss1a7e0v7ob',
      loginWith: {
        email: true
      }
    }
  }
};

export default awsConfig;
