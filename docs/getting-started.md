# Getting Started Guide (V2)

This guide explains how to set up and run the current **MindFlow** application components: the **Mobile App (V2)** and the **Backend Server**.

> **Note**: The `app/` directory contains the deprecated V1 prototype and should be ignored.

## Prerequisites
- **Node.js**: v20.x (LTS)
- **npm** or **Yarn**
- **Git**
- **PostgreSQL**: A running instance (local or hosted) created with the schema in `project_db.sql`.
- **Expo CLI**: `npm install -g expo-cli` (optional, can use npx)
- **Mobile Environment**:
    - **Android**: Android Studio (Emulator) or a physical device.
    - **iOS**: Xcode (Simulator) - macOS only.

---

## 1. Backend Setup (`/backend`)

The backend is a Node.js/Express server that manages data and business logic.

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in `backend/` based on `.env.example`. Ensure you start your PostgreSQL database and provide the connection string:
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/mindflow_db
    PORT=3000
    ```

4.  **Start the Server**:
    ```bash
    npm run dev
    ```
    The server typically runs on `http://localhost:3000`.

---

## 2. Mobile App Setup (`/mobile`)

The mobile app is built with React Native and Expo.

1.  **Navigate to the mobile directory**:
    ```bash
    cd mobile
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Development Server**:
    We recommend starting with the clear cache flag to avoid Metro bundler issues.
    ```bash
    npx expo start -c
    ```

4.  **Run on Device/Emulator**:
    - **Android**: Press `a` in the terminal (ensure Emulator is running or USB debugging is on).
    - **iOS**: Press `i` in the terminal (ensure Simulator is running).
    - **QR Code**: Scan the QR code with the **Expo Go** app on your physical device (requires being on the same Wi-Fi network).

---

## Troubleshooting

### Common Mobile Issues
- **Network Error**: Ensure your phone/emulator can reach the backend. If running locally, you may need to use your computer's local IP (e.g., `192.168.1.x`) instead of `localhost` in the mobile app's API configuration.
- **Cache Issues**: Always try `npx expo start -c` if you see strange errors after adding new assets or packages.

### Common Backend Issues
- **Database Connection**: Verify your PostgreSQL credentials and ensure the service is running. Use `psql` to test the connection manually.