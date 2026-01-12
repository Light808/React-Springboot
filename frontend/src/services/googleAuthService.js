const API_BASE_URL = 'http://localhost:8080/api';

// Google OAuth configuration - will be loaded from backend
let GOOGLE_CLIENT_ID = null;

// Initialize Google OAuth
export const initializeGoogleAuth = async () => {
  // First, get Client ID from backend
  try {
    const config = await getGoogleOAuthConfig();
    GOOGLE_CLIENT_ID = config.clientId;
  } catch (error) {
    console.error('Failed to get Google OAuth config from backend:', error);
    throw new Error('Failed to get Google OAuth configuration');
  }

  if (window.google && window.google.accounts) {
    // Re-initialize if already loaded
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true // Enable FedCM as required by Google
    });
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true // Enable FedCM as required by Google
        });
        resolve();
      } catch (error) {
        console.error('Failed to initialize Google OAuth:', error);
        reject(error);
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google OAuth script'));
    };
    
    document.head.appendChild(script);
  });
};

// Get Google OAuth configuration from backend
const getGoogleOAuthConfig = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/google-oauth-config`);
    if (!res.ok) {
      throw new Error(`Failed to get OAuth config: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error getting Google OAuth config:', error);
    throw error;
  }
};

// Handle Google OAuth response
const handleGoogleResponse = async (response) => {
  try {
    const credential = response.credential;
    const payload = JSON.parse(atob(credential.split('.')[1]));
    
    const googleUserData = {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      profilePicture: payload.picture
    };
    
    // Send to backend for authentication
    const user = await googleLogin(googleUserData);
    
    // Store user data in localStorage
    localStorage.setItem('authToken', 'user-token-' + user.id);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    console.log('Google login successful:', user.fullName);
    
    // Call the callback if it exists
    if (window.googleAuthCallback) {
      window.googleAuthCallback.resolve(user);
    }
    
    return user;
  } catch (error) {
    console.error('Google login error:', error);
    
    // Call the error callback if it exists
    if (window.googleAuthCallback) {
      window.googleAuthCallback.reject(error);
    }
    
    throw new Error('Google login failed');
  }
};

// Google login API call
export const googleLogin = async (googleUserData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/google-login-legacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleUserData)
    });

    if (!res.ok) {
      throw new Error(`Google login failed: ${res.status}`);
    }

    const user = await res.json();
    
    // Generate avatar if not provided
    if (!user.avatarUrl && !user.avatar) {
      const avatarUrl = generateAIPersonAvatar(user.fullName || user.username);
      user.avatarUrl = avatarUrl;
      user.customAvatar = false;
    }
    
    return user;
  } catch (error) {
    console.error('Google login API error:', error);
    throw new Error(error.message || 'Google login failed. Please try again.');
  }
};

// Generate AI avatar (reuse existing function)
const generateAIPersonAvatar = (name) => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[name.length % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200`;
};

// Render Google Sign-In button
export const renderGoogleSignInButton = (elementId, onSuccess, onError) => {
  if (!window.google) {
    onError(new Error('Google OAuth not initialized'));
    return;
  }

  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 300
    }
  );
};

// Check if Google ID exists
export const checkGoogleId = async (googleId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/check-google-id?googleId=${googleId}`);
    if (!res.ok) {
      throw new Error(`Check failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Check Google ID error:', error);
    return false;
  }
};
