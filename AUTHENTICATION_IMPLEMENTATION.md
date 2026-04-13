# Authentication System Implementation

## Overview
Implemented a complete user authentication system with login, signup, profile management, and notifications for the Rayu collaborative storytelling platform.

## Features Implemented

### 1. User Authentication
- **Signup**: Users can register with email, password, and nickname
- **Login**: Email and password authentication
- **Logout**: Session termination
- **Session Management**: Cookie-based sessions using `cookie-session`
- **Nickname Validation**: Real-time checking if nickname is already taken

### 2. User Profile
- **Profile Page**: Accessible via user icon in header
- **User Stats**: 
  - List of stories created by the user
  - List of chapters the user has contributed to
- **Inbox**: Notification system for story updates

### 3. Notification System
- **Automatic Notifications**: Story creators receive notifications when someone adds a chapter to their story
- **Inbox**: View all notifications with read/unread status
- **Badge**: Unread notification count displayed on user icon
- **Mark as Read**: Users can mark notifications as read

### 4. Anonymous Stories
- **Backward Compatibility**: Users can still create stories without logging in
- **Nickname Check**: When creating stories anonymously, the system checks if the nickname is already registered
- **Authenticated Users**: When logged in, the username field is hidden and automatically uses the logged-in user's nickname

## Database Changes

### Updated `users` table:
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### New `notifications` table:
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  story_id UUID NOT NULL REFERENCES stories(id),
  chapter_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
```

## Backend Files Created/Modified

### New Files:
1. `src/application/auth/authService.js` - Authentication business logic
2. `src/application/users/userService.js` - User profile and notification management
3. `src/infrastructure/repositories/postgresUserRepository.js` - User data access
4. `src/infrastructure/repositories/postgresNotificationRepository.js` - Notification data access
5. `src/routes/auth.js` - Authentication API endpoints
6. `src/routes/users.js` - User profile and notification endpoints

### Modified Files:
1. `src/db/postgres.js` - Updated schema
2. `src/infrastructure/container.js` - Added new services
3. `src/infrastructure/bootstrap.js` - Pass new services to HTTP app
4. `src/infrastructure/http/createHttpApp.js` - Added session middleware and routes
5. `src/application/stories/storyService.js` - Added notification creation
6. `src/infrastructure/repositories/postgresStoryRepository.js` - Added getStoryCreator method
7. `package.json` - Added `cookie-session` dependency

## Frontend Files Created/Modified

### New Files:
1. `public/adapters/httpAuthApi.js` - Authentication API client
2. `public/adapters/httpUserApi.js` - User API client
3. `public/application/authApp.js` - Authentication UI logic

### Modified Files:
1. `public/index.html` - Added login/signup/profile modals and user icon
2. `public/main.js` - Integrated authentication system
3. `public/application/storyApp.js` - Use authenticated user for stories/chapters
4. `public/adapters/domStoryView.js` - Hide username field when logged in
5. `public/styles.css` - Added authentication UI styles

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/check-nickname/:nickname` - Check if nickname is available

### User Profile (`/api/users`)
- `GET /api/users/profile` - Get user profile (requires auth)
- `GET /api/users/notifications` - Get user notifications (requires auth)
- `POST /api/users/notifications/:id/read` - Mark notification as read (requires auth)
- `GET /api/users/notifications/unread-count` - Get unread notification count (requires auth)

## Security Features

1. **Password Hashing**: Passwords are hashed using SHA-256
2. **Session Management**: Secure cookie-based sessions
3. **Email Validation**: Email format validation on signup
4. **Password Requirements**: Minimum 6 characters
5. **Nickname Requirements**: Minimum 3 characters
6. **Unique Constraints**: Email and nickname must be unique

## User Experience

### Header UI:
- **Not Logged In**: Shows "Iniciar sesión" and "Registrarse" buttons
- **Logged In**: Shows user icon with nickname and notification badge

### Profile Modal:
- **Tabs**: 
  - Mis Historias (My Stories)
  - Mis Capítulos (My Chapters)
  - Inbox (Notifications)
- **Logout Button**: Allows user to sign out

### Story Creation:
- **Logged In**: Username field is hidden, uses authenticated user's nickname
- **Not Logged In**: Username field is visible, allows anonymous creation

## Installation & Setup

### Docker Deployment (Recommended)

1. Rebuild the Docker containers to install new dependencies:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

2. The `SESSION_SECRET` is already configured in `docker-compose.yml`
   - For production, change the value to a secure random string

3. The database tables will be created automatically on first run

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set environment variable in `.env`:
```
SESSION_SECRET=your-secret-key-here
```

3. Start the application:
```bash
npm start
```

## Notes

- Anonymous story creation is still supported for backward compatibility
- Notifications are only sent to users with registered email addresses
- The system uses SHA-256 for password hashing (consider bcrypt for production)
- Session cookies expire after 30 days
- All authenticated routes return 401 if user is not logged in
