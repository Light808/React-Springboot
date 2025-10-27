# Google OAuth Backend Test Guide

## Cách test Backend Google OAuth

### 1. Cấu hình Google OAuth
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Kích hoạt Google Identity API
4. Tạo OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`

### 2. Cập nhật application.properties
```properties
# Google OAuth Configuration
google.oauth.client-id=your-actual-client-id.apps.googleusercontent.com
google.oauth.client-secret=your-actual-client-secret
google.oauth.redirect-uri=http://localhost:3000
```

### 3. Chạy Backend
```bash
cd spring_boot_server/Server
mvn clean install
mvn spring-boot:run
```

### 4. Test với Postman

#### Test Google Login với Token Verification
```
POST http://localhost:8080/api/users/google-login
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzI4NjQ4NzI..."
}
```

**Expected Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "user@example.com",
  "email": "user@example.com",
  "fullName": "John Doe",
  "googleId": "123456789012345678901",
  "provider": "google",
  "avatar": "https://lh3.googleusercontent.com/a/...",
  "lastLoginAt": "2024-01-01T12:00:00",
  "createdAt": "2024-01-01T10:00:00"
}
```

#### Test Legacy Google Login
```
POST http://localhost:8080/api/users/google-login-legacy
Content-Type: application/json

{
  "googleId": "123456789012345678901",
  "email": "user@example.com",
  "fullName": "John Doe",
  "profilePicture": "https://lh3.googleusercontent.com/a/..."
}
```

#### Test Check Google ID
```
GET http://localhost:8080/api/users/check-google-id?googleId=123456789012345678901
```

**Expected Response:**
```json
true
```

### 5. Test với Frontend Integration

#### Cập nhật Frontend để sử dụng Token Verification
Trong `frontend/src/services/googleAuthService.js`, cập nhật:

```javascript
// Handle Google OAuth response
const handleGoogleResponse = async (response) => {
  try {
    const credential = response.credential;
    
    // Send ID token to backend for verification
    const googleUserData = {
      idToken: credential
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
```

### 6. Test Scenarios

#### Scenario 1: New User Registration
1. User chưa có tài khoản trong hệ thống
2. Đăng nhập bằng Google lần đầu
3. **Expected**: Tạo user mới với `provider: "google"`

#### Scenario 2: Existing User Login
1. User đã có tài khoản Google trong hệ thống
2. Đăng nhập lại bằng Google
3. **Expected**: Cập nhật `lastLoginAt`, không tạo user mới

#### Scenario 3: Account Linking
1. User có tài khoản local với email trùng với Google email
2. Đăng nhập bằng Google
3. **Expected**: Link Google ID với tài khoản hiện có, set `provider: "google"`

#### Scenario 4: Invalid Token
1. Gửi request với token không hợp lệ
2. **Expected**: HTTP 401 Unauthorized

### 7. Database Verification

#### Kiểm tra MongoDB
```javascript
// Connect to MongoDB và kiểm tra collection users
db.users.find({provider: "google"})

// Expected result:
{
  "_id": ObjectId("..."),
  "username": "user@example.com",
  "email": "user@example.com",
  "fullName": "John Doe",
  "googleId": "123456789012345678901",
  "provider": "google",
  "avatar": "https://lh3.googleusercontent.com/a/...",
  "lastLoginAt": ISODate("2024-01-01T12:00:00Z"),
  "createdAt": ISODate("2024-01-01T10:00:00Z")
}
```

### 8. Error Handling Tests

#### Test với Token Expired
```json
{
  "idToken": "expired-token-string"
}
```
**Expected**: HTTP 401 Unauthorized

#### Test với Invalid Token Format
```json
{
  "idToken": "invalid-token-format"
}
```
**Expected**: HTTP 401 Unauthorized

#### Test với Missing Token
```json
{
  "email": "user@example.com"
}
```
**Expected**: HTTP 400 Bad Request

### 9. Performance Testing

#### Load Test
- Test với nhiều concurrent requests
- Monitor response time
- Check memory usage

#### Token Verification Performance
- Monitor Google API calls
- Check caching nếu cần

### 10. Security Testing

#### Token Validation
- Test với token từ different client ID
- Test với tampered token
- Test với expired token

#### CORS Testing
- Test từ different origins
- Verify CORS headers

## Troubleshooting

### Lỗi "Invalid token"
- Kiểm tra Google Client ID
- Kiểm tra token format
- Kiểm tra token expiration

### Lỗi "Audience mismatch"
- Kiểm tra Client ID trong Google Cloud Console
- Đảm bảo Client ID trong application.properties khớp

### Lỗi "Network timeout"
- Kiểm tra internet connection
- Kiểm tra Google APIs accessibility
- Check firewall settings

## Monitoring

### Logs to Monitor
- Google OAuth verification logs
- User creation/update logs
- Error logs

### Metrics to Track
- Login success rate
- Token verification time
- Error rates by type

Backend Google OAuth đã sẵn sàng để test!
