# Admin Dashboard

This is the admin dashboard for the MindFlow research application. It provides administrators with tools to manage the database and view reports.

## Features

- **Authentication**: Secure login for administrators
- **Database Management**: View and manage all database tables
- **Reports & Analytics**: View various reports on user engagement and data trends
- **Responsive Design**: Works on desktop and tablet devices

## Pages

1. **Login Page**: Secure authentication for administrators
2. **Dashboard**: Overview of key metrics and recent activity
3. **Tables**: View and manage database tables with CRUD operations
4. **Reports**: Analyze data with various reports and visualizations

## Tech Stack

- React.js
- React Router
- CSS3
- Vite (Build tool)

## Getting Started

1. Navigate to the admin dashboard directory:
   ```bash
   cd web/admin-dashboard
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

## Deployment

To build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Authentication

Default admin credentials:
- Username: admin
- Password: password

*Note: In a production environment, you should implement proper authentication with a backend service.*

## Folder Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # API services
├── utils/          # Utility functions
├── contexts/       # React contexts
├── App.jsx         # Main app component
└── main.jsx        # Entry point
```