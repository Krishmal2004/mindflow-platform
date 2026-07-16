import { ViewStyle } from 'react-native';

// The card shadow recipe repeated (with copy-paste drift — 0.03 vs 0.04 opacity,
// 10 vs 12 vs 16 radius) across Journey/Calendar/Profile/Dashboard. Two named
// variants instead: a resting card and a slightly more elevated one (hero/profile
// cards), so any future drift is a deliberate choice, not a typo.
export const cardShadow: ViewStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
};

export const cardShadowElevated: ViewStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
};
