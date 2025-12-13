// Icons.jsx (new file with custom mindfulness-themed SVGs)
import React from 'react';

export const DashboardIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C7 8 3 12 3 16C3 20 7 22 12 22C17 22 21 20 21 16C21 12 17 8 12 3Z" fill={active ? '#2196F3' : '#B8D9B0'} opacity="0.6" />
    <circle cx="12" cy="12" r="4" fill={active ? '#FFFFFF' : '#F5FCFF'} />
  </svg>
);

export const TablesIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" stroke={active ? '#2196F3' : '#B8D9B0'} strokeWidth="2" />
    <line x1="4" y1="10" x2="20" y2="10" stroke={active ? '#2196F3' : '#B8D9B0'} strokeWidth="2" />
    <line x1="10" y1="4" x2="10" y2="20" stroke={active ? '#2196F3' : '#B8D9B0'} strokeWidth="2" />
  </svg>
);

export const ReportsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15V18C4 19.1 4.9 20 6 20H8C9.1 20 10 19.1 10 18V15H4Z" fill={active ? '#2196F3' : '#B8D9B0'} />
    <path d="M10 12V18C10 19.1 10.9 20 12 20H14C15.1 20 16 19.1 16 18V12H10Z" fill={active ? '#2196F3' : '#B8D9B0'} />
    <path d="M16 9V18C16 19.1 16.9 20 18 20H20C21.1 20 22 19.1 22 18V9H16Z" fill={active ? '#2196F3' : '#B8D9B0'} />
    <path d="M2 4H22V6H2V4Z" stroke={active ? '#2196F3' : '#B8D9B0'} strokeWidth="2" />
  </svg>
);

export const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.45 21 4 20.55 4 20V4C4 3.45 4.45 3 5 3H9" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17L21 12L16 7" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12H9" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CollapseIcon = ({ collapsed }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
    <path d="M15 18L9 12L15 6" stroke="#F5FCFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UsersIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="12" r="8" fill="#4CAF50" opacity="0.8" />
    <path d="M8 32C8 26 12 22 20 22C28 22 32 26 32 32" fill="#2196F3" opacity="0.6" />
  </svg>
);

export const EntriesIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10H30V30H10V10Z" stroke="#4CAF50" strokeWidth="3" />
    <line x1="10" y1="18" x2="30" y2="18" stroke="#2196F3" strokeWidth="3" />
  </svg>
);

export const ResponsesIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="20" width="24" height="12" rx="2" fill="#4CAF50" opacity="0.8" />
    <rect x="12" y="8" width="16" height="8" rx="2" fill="#2196F3" opacity="0.6" />
  </svg>
);

export const QuestionnairesIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10L30 10L30 30L10 30L10 10Z" fill="#2196F3" opacity="0.6" />
    <circle cx="20" cy="20" r="6" fill="#4CAF50" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4L6 11L3 8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);