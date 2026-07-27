# Email OTP Authentication System

A complete production-ready email OTP authentication system using React, Node.js, and Supabase.

## Features

- 📧 Email OTP-based login & registration
- 🔐 JWT-based authentication
- 🛡️ Helmet for security headers
- ⚡ Rate limiting for OTP requests
- 📱 Mobile responsive UI
- 🔄 Auto-resend OTP with countdown
- 📋 Paste OTP support
- 🔁 Auto-focus OTP inputs

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- React Hook Form
- Zod
- Axios
- Tailwind CSS
- shadcn/ui

### Backend
- Node.js
- Express
- TypeScript
- JWT
- Helmet
- Express Rate Limit
- Express Validator
- Axios

### Database
- Supabase PostgreSQL

### Email Service
- MSG91

## Project Structure

```
.
├── public/
├── server/
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   └── auth.ts
│   ├── lib/
│   ├── middleware/
│   │   └── jwt.ts
│   ├── routes/
│   │   └── auth.ts
│   ├── services/
│   │   └── msg91.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts
│   └── index.ts
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── VerifyOTP.tsx
│   │   └── Dashboard.tsx
│   ├── services/
│   │   └── api.ts
│   └── types/
│       └── auth.ts
├── supabase/
│   └── migrations/
├── .env.example
└── package.json
```

## Installation & Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account
- MSG91 account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project at [https://supabase.com
2. Go to Project Settings → API
3. Copy your `Project URL` and `service_role key`
4. Apply the database migration located at `supabase/migrations/20260717000000_create_users_table.sql`

### 4. MSG91 Setup

1. Sign up at [https://msg91.com](https://msg91.com)
2. Create a new email template for OTP
3. Get your `Auth Key`, `Template ID`, and `Email Domain`

### 5. Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Now update the variables in `.env` with your own:

```env
# Frontend
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:3001/api

# Backend
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_TEMPLATE_ID=your-msg91-email-template-id
MSG91_EMAIL_DOMAIN=your-email-domain
```

### 6. Run the Application

#### Start both frontend and backend in development:

```bash
npm run dev:all
```

Or start them separately:

**Backend:**
```bash
npm run dev:server
```

**Frontend:**
```bash
npm run dev
```

## API Routes

### Authentication Endpoints

| Endpoint               | Method | Description                          |
|------------------------|--------|----------------------------------------|
| `/api/auth/send-email-otp | POST   | Sends OTP to email                   |
| `/api/auth/verify-email-otp` | POST | Verifies OTP and creates user        |
| `/api/auth/me`        | GET    | Gets authenticated user               |
| `/api/auth/logout`     | POST   | Logs user out                 |

## Database Schema

### users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

1. **Login/Register Flow
   - Go to `/login`
   - Enter your email
   - Click "Send OTP"
   - Check your email for the OTP
   - Enter the OTP in the `/verify-otp` page
   - You will be logged in automatically!

2. **Dashboard**
   - Accessible at `/dashboard` only for authenticated users
   - Shows user information
   - Has logout button

## Security

- Helmet for security headers
- CORS properly configured
- Rate limiting for OTP requests
- JWT token-based authentication
- Input validation with Zod and express-validator
- MSG91 API key only exposed only on backend

## Production Deployment

### Build frontend:
```bash
npm run build
```

Build backend:
```bash
npm run build:server
```

Start backend:
```bash
npm run start:server
```

## License

MIT
