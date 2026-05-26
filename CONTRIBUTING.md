# Contributing to MindFlow

Thank you for your interest in contributing to the MindFlow Mindfulness Research Application. As an academic research platform, we welcome contributions that improve user experience, security, and data integrity.

Please review the following guidelines to ensure a smooth contribution process.

---

## Code of Conduct

By participating in this project, you agree to maintain a professional, respectful, and collaborative environment. All communication should be constructive and focused on research and engineering excellence.

---

## How to Contribute

### 1. Reporting Bugs or Requesting Features
- Search the issue tracker to ensure the bug or feature request has not already been reported.
- Open a new issue with a clear title, description, steps to reproduce (if applicable), and your environment specifications (Node.js version, Expo version, OS).

### 2. Pull Request Process
1. Fork the repository and create your feature branch from the active development branch (e.g., `release/v2.0` or `main`).
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Implement your changes. Ensure you adhere to the technology stack and architectural patterns described in the technical documentation.
3. Test your changes locally:
   - **Backend**: Run `npm run dev` and test API responses.
   - **Mobile**: Launch with `npx expo start -c` and verify layouts on an emulator or physical device.
   - **Web Admin**: Verify build succeeds with `npm run build`.
4. Ensure your code passes TypeScript compilation:
   ```bash
   # Run in mobile, backend, and web-admin folders
   npx tsc --noEmit
   ```
5. Commit your changes with clear, descriptive commit messages.
6. Push to your fork and submit a Pull Request to the upstream repository.
7. Provide a summary of your changes, the motivation behind them, and any related issue numbers in the PR description.

---

## Coding Standards

- **TypeScript**: All new code must be fully typed. Avoid using `any` unless absolutely necessary.
- **Styling**: Standard React Native `StyleSheet` rules for the mobile app, and Tailwind CSS for the web admin portal. Maintain color consistency with the primary Sage Green palette.
- **Validation**: Validate all backend request payloads using Zod schemas.
- **Security**: Never commit sensitive credentials or environment files (.env).
