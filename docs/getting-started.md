# Getting Started Guide

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android/iOS development environment (for native builds)

## Installation

### Mobile Application

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mindfulness-research-app/app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the `app/` directory with the following keys:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_R2_ACCOUNT_ID=your_cloudflare_account_id
   EXPO_PUBLIC_R2_ACCESS_KEY_ID=your_r2_access_key
   EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your_r2_secret_key
   EXPO_PUBLIC_R2_BUCKET_NAME=your_bucket_name
   EXPO_PUBLIC_R2_PUBLIC_URL=your_r2_public_url
   ```

4. Run the mobile application:
   ```bash
   npm start
   # or
   expo start
   ```

### Admin Dashboard

1. Navigate to the admin dashboard directory:
   ```bash
   cd ../web/admin-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Development Commands

### Mobile App
- `npm start` - Start the development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

### Admin Dashboard
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally

## Building for Production

### Mobile App (Android)
The project uses Expo EAS Build for Android deployments:
1. Install EAS CLI globally: `npm install -g eas-cli`
2. Log in to your Expo account: `eas login`
3. Configure EAS build: `eas build:configure`
4. Build APK: `eas build --platform android`

### Admin Dashboard
To build the admin dashboard for production:
```bash
cd web/admin-dashboard
npm run build
```
The built files will be in the `dist` directory.