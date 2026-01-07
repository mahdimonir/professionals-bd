# ProfessionalsBD Backend API Guide  
**For Frontend Developers**  
**Base URL:** `https://server.professionalsbd.vercel.app/api/v1`

**Date:** January 07, 2026  
**Version:** MVP 1.0

---

### 1. Authentication

#### 1.1 Email/Password + OTP Flow

| Method | Endpoint                          | Body (JSON)                                                                 | Response                                                                 | Notes |
|-------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------|-------|
| POST  | `/auth/register`                  | `{ "name": "John Doe", "email": "john@example.com", "password": "secret123", "phone": "+8801..." }` | `{ "success": true, "message": "Verification code sent to your email" }` | Sends 6-digit OTP |
| POST  | `/auth/register/verify`           | `{ "email": "john@example.com", "otp": "123456" }`                          | `{ "success": true, "data": { "accessToken", "refreshToken", "user": { "id", "name", "email", "role", "avatar" } } }` | Logs in user |
| POST  | `/auth/register/resend`           | `{ "email": "john@example.com" }`                                           | `{ "success": true, "message": "New verification code sent" }`           |       |
| POST  | `/auth/login`                     | `{ "email": "john@example.com", "password": "secret123" }`                  | Same as verify (access + refresh token + user)                            | Only for verified users |
| POST  | `/auth/forgot-password`           | `{ "email": "john@example.com" }`                                           | `{ "success": true, "message": "If account exists, reset code sent" }`   | Sends OTP |
| POST  | `/auth/reset-password`            | `{ "email": "john@example.com", "otp": "123456", "newPassword": "newpass123" }` | `{ "success": true, "message": "Password reset successful" }`            |       |
| POST  | `/auth/refresh`                   | `{ "refreshToken": "your_refresh_token" }`                                  | `{ "success": true, "data": { "accessToken", "refreshToken", "user" } }` | New tokens |
| POST  | `/auth/logout`                    | `{ "refreshToken": "your_refresh_token" }`                                  | `{ "success": true, "message": "Logged out successfully" }`              | Optional |

#### 1.2 Google Social Login

1. Click "Login with Google" → redirects to:  
   `https://professionalsbd-backend.vercel.app/api/v1/auth/google`

2. After Google consent → redirects back to your frontend:  
   `/auth/callback?accessToken=...&refreshToken=...&user=...`

3. Frontend: Parse URL params → save tokens → redirect to dashboard

**No manual POST needed** — fully handled by OAuth redirect.

---

### 2. Token Usage (All Protected Routes)

- Save `accessToken` and `refreshToken` in localStorage (or secure HttpOnly cookie if using SSR)
- Send `Authorization: Bearer <accessToken>` in headers for all protected routes
- On 401 → call `/auth/refresh` → replace tokens
- On refresh fail → logout and redirect to login

---

### 3. Cloudinary Upload (Frontend Direct – Signed)

**Step 1: Get Signature (Protected)**

| Method | Endpoint               | Headers                          | Response |
|--------|------------------------|----------------------------------|----------|
| POST   | `/api/v1/media/signature` | `Authorization: Bearer <token>` | `{ "success": true, "data": { "timestamp", "signature", "cloudName", "apiKey", "folder", "uploadPreset" } }` |

**Step 2: Upload Directly from Frontend**

```js
const formData = new FormData();
formData.append("file", file);
formData.append("timestamp", data.timestamp);
formData.append("signature", data.signature);
formData.append("api_key", data.apiKey);
formData.append("folder", data.folder);
formData.append("upload_preset", data.uploadPreset);

const res = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/auto/upload`, {
  method: "POST",
  body: formData,
});

const result = await res.json();
const imageUrl = result.secure_url; // → send this to backend
```

**Step 3: Send URL to Backend**

When updating profile:
```json
{ "avatar": "https://res.cloudinary.com/.../image.jpg" }
```

Backend auto deletes old image from Cloudinary.

---

### 4. User & Profile Routes

| Method | Endpoint                          | Auth Required | Body / Params                                      | Response |
|--------|-----------------------------------|---------------|----------------------------------------------------|----------|
| GET    | `/users/me/profile`               | Yes           | —                                                  | Full user + professional profile |
| PATCH  | `/users/me/profile`               | Yes           | `{ "name", "bio", "phone", "location", "timezone", "avatar" }` | Updated profile |
| GET    | `/users/:id`                      | No            | Param: id                                          | Public user profile |
| GET    | `/users/search?q=john&role=PROFESSIONAL` | No     | Query params                                       | Paginated search results |
| GET    | `/users/admin/all`                | Admin/Mod     | Query: page, limit                                 | All users (admin panel) |

---

### 5. Professional Profile Routes

| Method | Endpoint                          | Auth Required | Body                                               | Response |
|--------|-----------------------------------|---------------|----------------------------------------------------|----------|
| GET    | `/professionals/me`               | Yes (Pro)     | —                                                  | Own professional profile |
| POST   | `/professionals/me`               | Yes (Pro)     | `{ "specialties", "rates", "experience", "languages", "certifications": ["url1", "url2"] }` | Created profile |
| PATCH  | `/professionals/me`               | Yes (Pro)     | Same as POST (partial)                             | Updated profile |
| GET    | `/professionals/`                 | No            | Query: page, limit                                 | List all professionals |
| PATCH  | `/professionals/verify/:userId`   | Admin only    | `{ "isVerified": true/false }`                     | Verification status |

---

### 6. Booking Routes

| Method | Endpoint                          | Auth Required | Body / Params                                      | Response |
|--------|-----------------------------------|---------------|----------------------------------------------------|----------|
| POST   | `/bookings/`                      | Yes           | `{ "professionalId", "startTime": "2026-01-10T10:00:00Z", "endTime": "2026-01-10T11:00:00Z", "notes" }` | Created booking |
| GET    | `/bookings/my`                    | Yes           | Query: status (optional)                           | User's bookings (as client or pro) |
| GET    | `/bookings/:id`                   | Yes           | —                                                  | Single booking details |
| PATCH  | `/bookings/:id/cancel`            | Yes           | `{ "reason": "Not available" }`                    | Cancelled booking |
| PATCH  | `/bookings/:id/status`            | Pro only      | `{ "status": "CONFIRMED" or "COMPLETED" }`         | Status update |

---

### 7. Meeting Routes (Stream.io Video)

| Method | Endpoint                          | Auth Required | Body / Params                                      | Response |
|--------|-----------------------------------|---------------|----------------------------------------------------|----------|
| POST   | `/meetings/`                      | Pro only      | `{ "bookingId": "..." }`                           | Creates Stream call room |
| GET    | `/meetings/:bookingId/token`      | Yes           | —                                                  | `{ "token", "callId", "callType" }` → join video |
| PATCH  | `/meetings/:meetingId/recording`  | Admin only    | `{ "approved": true/false }`                       | Approve recording storage |

**Frontend Video Join (React Example):**

```tsx
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";

const client = new StreamVideoClient({
  apiKey: "your_stream_api_key",
  user: { id: userId, name: userName },
  token: joinToken,
});

const call = client.call("default", bookingId);
await call.join();

<StreamVideo client={client}>
  <StreamCall call={call}>
    {/* Video UI components */}
  </StreamCall>
</StreamVideo>
```

---

### 8. Webhook (Internal – Do Not Call Directly)

- `/webhooks/stream/recording` → Stream.io calls this when recording ready

---

### Final Notes for Frontend Team

- All responses follow: `{ "success": true, "data": ..., "message": "..." }`
- Errors: `{ "success": false, "message": "..." }`
- Use `accessToken` in `Authorization: Bearer <token>` header
- Store `refreshToken` and call `/auth/refresh` on 401
- Cloudinary: Always get signature first → upload direct → send URL to backend
- Google login: Redirect flow only
- All dates in ISO format (UTC recommended)
