import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
});

export interface AuthResponse {
  success: boolean;
  session?: CognitoUserSession;
  error?: string;
}

export async function signIn(username: string, password: string): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve({ success: true, session });
      },
      onFailure: (err) => {
        resolve({ success: false, error: err.message });
      },
    });
  });
}

export async function signOut(): Promise<void> {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(session);
    });
  });
}

export function isAuthenticated(): Promise<boolean> {
  return getCurrentSession().then((session) => {
    return session !== null && session.isValid();
  });
}

export function getAccessToken(): Promise<string | null> {
  return getCurrentSession().then((session) => {
    return session?.getAccessToken().getJwtToken() || null;
  });
}

export function getIdToken(): Promise<string | null> {
  return getCurrentSession().then((session) => {
    return session?.getIdToken().getJwtToken() || null;
  });
}

export function getUsername(): Promise<string | null> {
  return getCurrentSession().then((session) => {
    return session?.getIdToken().payload.email || null;
  });
} 