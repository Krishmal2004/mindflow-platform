import React from 'react';

// Dashboard Icon
export const DashboardIcon = ({ active = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" 
      fill={active ? "#64C59A" : "#B8D9B0"}
    />
  </svg>
);

// Tables Icon
export const TablesIcon = ({ active = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 3H21V21H3V3ZM5 5V19H19V5H5ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" 
      fill={active ? "#64C59A" : "#B8D9B0"}
    />
  </svg>
);

// Reports Icon
export const ReportsIcon = ({ active = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" 
      fill={active ? "#64C59A" : "#B8D9B0"}
    />
  </svg>
);

// Logout Icon
export const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" 
      fill="#E74C3C"
    />
  </svg>
);

// Collapse Icon
export const CollapseIcon = ({ collapsed = false }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {collapsed ? (
      <path 
        d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" 
        fill="#B8D9B0"
      />
    ) : (
      <path 
        d="M10.59 7.41L12 6L18 12L12 18L10.59 16.59L15.17 12L10.59 7.41Z" 
        fill="#B8D9B0"
      />
    )}
  </svg>
);