import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Matches CustomTabBar's own layout math in TabNavigator.tsx (barOuter.paddingTop 4 +
// barInner.paddingTop 8 + tabItem.minHeight 56 + barInner.paddingBottom 4 = 72), kept
// here as the single source of truth so scrollable screens can reserve exactly enough
// room to clear the floating tab bar instead of guessing a flat pixel value that only
// happens to work on some devices' safe-area inset.
export const TAB_BAR_BASE_HEIGHT = 72;

// Same bottom-inset floor CustomTabBar applies, so the returned height always matches
// what's actually rendered on screen (0 on most Android devices without a gesture
// bar/home indicator still gets the 6px minimum breathing room).
export function useTabBarHeight() {
    const insets = useSafeAreaInsets();
    return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
}
