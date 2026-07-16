import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Intercepts the Android hardware back button while `active` (e.g. actively recording,
// or a questionnaire has unsaved answers) and confirms before discarding — otherwise
// hardware back silently exits the screen with no confirmation (no iOS equivalent gap,
// since iOS has no hardware back button).
export function useConfirmExitOnBack(
    active: boolean,
    onConfirmExit: () => void,
    message = 'You have unsaved progress. Are you sure you want to leave?',
) {
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (!active) return false;
                Alert.alert('Discard progress?', message, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: onConfirmExit },
                ]);
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [active, onConfirmExit, message])
    );
}
