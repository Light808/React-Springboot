/* eslint-disable no-unused-vars */
import { generateAIPersonAvatar } from './avatarService';
import { googleLogin, initializeGoogleAuth, renderGoogleSignInButton } from './googleAuthService';

const API_BASE_URL = 'http://localhost:8080/api';

/* Map backend user.avatar to frontend avatarUrl and customAvatar. */
export function applyAvatarMapping(user) {
  if (!user) return user;
  const av = user.avatar;
  if (av && String(av).startsWith('data:')) {
    user.avatarUrl = av;
    user.customAvatar = true;
  } else {
    user.avatarUrl = generateAIPersonAvatar(user.username);
    user.customAvatar = false;
  }
  return user;
}

/**
 * Persist avatar to backend. Pass data URL to save, or null to clear.
 */
export async function updateUserAvatar(avatarDataOrNull) {
  const currentUser = getCurrentUserSync();
  if (!currentUser || !currentUser.id) {
    throw new Error('User not found');
  }
  const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: avatarDataOrNull })
  });
  if (!res.ok) {
    throw new Error('Failed to save avatar');
  }
  const serverUser = await res.json();
  const finalUser = applyAvatarMapping(serverUser);
  localStorage.setItem('currentUser', JSON.stringify(finalUser));
  return finalUser;
}

export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      if (res.status === 409) {
        throw new Error('Username or email already exists');
      }
      if (res.status === 400) {
        throw new Error('Invalid information');
      }
      throw new Error(`Registration failed: ${res.status}`);
    }

    const user = await res.json();
    const avatarUrl = generateAIPersonAvatar(user.username);
    user.avatarUrl = avatarUrl;
    user.customAvatar = false; 
    
    console.log('Generated default AI avatar for user:', user.username, 'URL:', avatarUrl);
    
    // save user info to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
}

export async function loginUser({ username, password }) {
  try {
    const params = new URLSearchParams({
      username: username,
      password: password
    });

    const res = await fetch(`${API_BASE_URL}/users/login?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Username or password is incorrect');
      }
      throw new Error(`Login failed: ${res.status}`);
    }

    const user = await res.json();
    applyAvatarMapping(user);

    // save token and user to localStorage
    localStorage.setItem('authToken', 'user-token-' + user.id);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    console.log('User logged in:', user.username, 'Last login:', user.lastLoginAt);
    
    try {
      await updateLastLogin(user.id);
    } catch (error) {
      console.warn('Could not update last login time:', error);
    }
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed. Please check your information.');
  }
}

export async function logoutUser() {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    return true;
  }
}

// update last login time
export async function updateLastLogin(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/update-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`Update last login time failed: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Update last login time error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Get current user error:', error);
    localStorage.removeItem('currentUser');
    return null;
  }
}

// get user profile from database
export async function getUserProfile() {
  try {
    const localUser = getCurrentUserSync();
    if (!localUser || !localUser.id) {
      throw new Error('No access');
    }
    const res = await fetch(`${API_BASE_URL}/users/profile?userId=${localUser.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('User not found');
      }
      console.warn('API failed');
      return localUser;
    }

    const userData = await res.json();
    applyAvatarMapping(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));

    return userData;
  } catch (error) {
    const localUser = getCurrentUserSync();
    if (localUser) {
      console.warn('Using localStorage data as fallback');
      return localUser;
    }
    throw new Error(error.message || 'Get user profile failed. Please try again.');
  }
}

export async function updateUserProfile(userData) {
  try {
    // get current user info
    const currentUser = getCurrentUserSync();
    if (!currentUser) {
        throw new Error('User not found');
    }

    // only send fields to update, do not send password
    const updateData = {
      username: userData.username || currentUser.username,
      fullName: userData.fullName || currentUser.fullName,
      email: userData.email || currentUser.email,
      phone: userData.phone || currentUser.phone,
      address: userData.address || currentUser.address,
      notes: userData.notes || currentUser.notes,
      avatar: userData.avatar || currentUser.avatar
    };

    // update localStorage before
    const updatedUser = {
      ...currentUser,
      ...updateData,
      avatarUrl: currentUser.avatarUrl,
      customAvatar: currentUser.customAvatar
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    try {
      const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const serverUser = await res.json();
        const finalUser = applyAvatarMapping(serverUser);
        localStorage.setItem('currentUser', JSON.stringify(finalUser));
        return finalUser;
      } else {
        console.warn('API update failed, but local update succeeded');
        return updatedUser;
      }
    } catch (apiError) {
      console.warn('API call failed, but local update succeeded:', apiError);
      return updatedUser;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Update profile failed. Please try again.');
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  try {
    const currentUser = getCurrentUserSync();
    if (!currentUser) {
      throw new Error('User not found');
    }

    // call API to change password
    const res = await fetch(`${API_BASE_URL}/users/change-password/${currentUser.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Current password is incorrect');
      }
      throw new Error(`Change password failed: ${res.status}`);
    }

    const serverUser = await res.json();
    const finalUser = applyAvatarMapping(serverUser);
    localStorage.setItem('currentUser', JSON.stringify(finalUser));

    return finalUser;
  } catch (error) {
    console.error('Change password error:', error);
    throw new Error(error.message || 'Change password failed. Please try again.');
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('currentUser');
}

export function getCurrentUserSync() {
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
}

export function generateAvatarForCurrentUser() {
  try {
    const user = getCurrentUserSync();
    if (user && user.username && !user.avatarUrl) {
      const avatarUrl = generateAIPersonAvatar(user.username);
      user.avatarUrl = avatarUrl;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return avatarUrl;
    }
    return user?.avatarUrl || null;
  } catch (error) {
    console.error('Generate avatar error:', error);
    return null;
  }
}

// Get user profile by userId (for viewing other users' profiles)
export async function getUserProfileById(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/profile?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`Get user profile failed: ${res.status}`);
    }

    const userData = await res.json();
    return userData;
  } catch (error) {
    console.error('Get user profile by ID error:', error);
    throw new Error(error.message || 'Get user profile failed. Please try again.');
  }
}

export async function checkUsername(username) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/check-username?username=${encodeURIComponent(username)}`);
    if (!res.ok) {
      throw new Error('Cannot check username');
    }
    return await res.json();
  } catch (error) {
    console.error('Check username error:', error);
    throw error;
  }
}

// Helper function to check if email exists
export async function checkEmail(email) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      throw new Error('Cannot check email');
    }
    return await res.json();
  } catch (error) {
    console.error('Check email error:', error);
    throw error;
  }
}

// Admin reset password for user
export async function adminResetPassword(userId, newPassword) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/admin/reset-password/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newPassword: newPassword
      })
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('User not found');
      }
      if (res.status === 400) {
        throw new Error('New password is invalid');
      }
      throw new Error(`Reset password failed: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Admin reset password error:', error);
    throw new Error(error.message || 'Reset password failed. Please try again.');
  }
}

// Google OAuth functions - Initialize and return promise for button click
export async function loginWithGoogle() {
  try {
    await initializeGoogleAuth();
    return new Promise((resolve, reject) => {
      const callbackRef = { resolve, reject };
      window.googleAuthCallback = callbackRef;

      setTimeout(() => {
        if (window.googleAuthCallback === callbackRef) {
          reject(new Error('Google Sign-In timeout. Please try again.'));
          window.googleAuthCallback = null;
        }
      }, 300000); 
    });
  } catch (error) {
    console.error('Google login initialization error:', error);
    throw new Error('Failed to initialize Google login: ' + error.message);
  }
}


// Password reset functions
export async function requestPasswordReset(email) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Failed to request password reset');
    }

    return data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw new Error(error.message || 'Failed to request password reset. Please try again.');
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to reset password. Please try again.');
  }
}

export async function verifyResetToken(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, message: 'Failed to verify token' };
  }
}

export async function handleGoogleLoginSuccess(user) {
  try {
    // Update last login time
    await updateLastLogin(user.id);
    return user;
  } catch (error) {
    console.warn('Could not update last login time:', error);
    return user;
  }
}

export function renderGoogleButton(elementId) {
  try {
    renderGoogleSignInButton(elementId, 
      (user) => {
        if (window.googleAuthCallback) {
          window.googleAuthCallback.resolve(user);
        }
      },
      (error) => {
        if (window.googleAuthCallback) {
          window.googleAuthCallback.reject(error);
        }
      }
    );
  } catch (error) {
    console.error('Error rendering Google button:', error);
  }
}