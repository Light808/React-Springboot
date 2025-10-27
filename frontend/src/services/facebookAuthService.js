const API_BASE_URL = 'http://localhost:8080/api';

// Facebook OAuth configuration - will be loaded from backend
let FACEBOOK_APP_ID = null;

// Initialize Facebook SDK
export const initializeFacebookAuth = async () => {
  return new Promise(async (resolve, reject) => {
    // First, get App ID from backend
    try {
      const config = await getFacebookOAuthConfig();
      FACEBOOK_APP_ID = config.appId;
    } catch (error) {
      console.error('Failed to get Facebook OAuth config from backend:', error);
      reject(new Error('Failed to get Facebook OAuth configuration'));
      return;
    }

    if (window.FB) {
      resolve();
      return;
    }

    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve();
    };

    // Inject Facebook SDK script
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        resolve();
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;
      js.defer = true;
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!window.FB) {
        reject(new Error('Failed to load Facebook SDK'));
      }
    }, 10000);
  });
};

// Get Facebook OAuth configuration from backend
const getFacebookOAuthConfig = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/facebook-oauth-config`);
    if (!res.ok) {
      throw new Error(`Failed to get OAuth config: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error getting Facebook OAuth config:', error);
    throw error;
  }
};

// Handle Facebook login
export const loginWithFacebook = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await initializeFacebookAuth();

      if (!window.FB) {
        reject(new Error('Facebook SDK not loaded'));
        return;
      }

      window.FB.login(function(response) {
        if (response.authResponse) {
          // User is logged in and authorized
          handleFacebookLoginSuccess(response.authResponse.userID, response.authResponse.accessToken);
          resolve(response);
        } else {
          reject(new Error('User cancelled login or did not fully authorize.'));
        }
      }, {
        scope: 'email,public_profile',
        return_scopes: true
      });
    } catch (error) {
      console.error('Facebook login initialization error:', error);
      reject(error);
    }
  });
};

// Handle successful Facebook login
const handleFacebookLoginSuccess = async (userID, accessToken) => {
  try {
    // Get user info from Facebook Graph API
    const userInfo = await getFacebookUserInfo(accessToken);
    
    // Send to backend for authentication
    const user = await facebookLogin(userInfo);
    
    // Store user data in localStorage
    localStorage.setItem('authToken', 'user-token-' + user.id);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    console.log('Facebook login successful:', user.fullName);
    
    // Call the callback if it exists
    if (window.facebookAuthCallback) {
      window.facebookAuthCallback.resolve(user);
    }
    
    return user;
  } catch (error) {
    console.error('Facebook login error:', error);
    
    // Call the error callback if it exists
    if (window.facebookAuthCallback) {
      window.facebookAuthCallback.reject(error);
    }
    
    throw new Error('Facebook login failed');
  }
};

// Get user info from Facebook Graph API
const getFacebookUserInfo = async (accessToken) => {
  return new Promise((resolve, reject) => {
    window.FB.api('/me', {
      fields: 'id,name,email,picture',
      access_token: accessToken
    }, function(response) {
      if (response.error) {
        reject(new Error('Failed to get user info from Facebook'));
      } else {
        resolve({
          id: response.id,
          name: response.name,
          email: response.email,
          picture: response.picture?.data?.url
        });
      }
    });
  });
};

// Facebook login API call
export const facebookLogin = async (facebookUserData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/facebook-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facebookUserData)
    });

    if (!res.ok) {
      throw new Error(`Facebook login failed: ${res.status}`);
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
    console.error('Facebook login API error:', error);
    throw new Error(error.message || 'Facebook login failed. Please try again.');
  }
};

// Generate AI avatar (reuse existing function)
const generateAIPersonAvatar = (name) => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[name.length % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200`;
};

// Check if Facebook ID exists
export const checkFacebookId = async (facebookId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/check-facebook-id?facebookId=${facebookId}`);
    if (!res.ok) {
      throw new Error(`Check failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Check Facebook ID error:', error);
    return false;
  }
};
