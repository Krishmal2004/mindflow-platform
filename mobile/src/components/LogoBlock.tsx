import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../constants/colors';

// Sampled from assets/app-icon.png's gradient: teal ring/leaf -> lime-green head.
const LOGO_TEAL = '#0EA5A6';
const LOGO_GREEN = '#4CAF32';

// Shared brand mark: "MindFlow" wordmark + tagline. Used as the hero block on
// Login/Signup/OtpVerification/ForgotPassword/ResetOtp and the compact Dashboard header.
export function LogoBlock() {
    return (
        <View style={styles.logoBlock}>
            <View style={styles.logoRow}>
                <Text style={styles.logoThin}>Mind</Text>
                <Text style={styles.logoBold}>Flow</Text>
            </View>
            <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.tagline}>Find your inner peace</Text>
                <View style={styles.taglineLine} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    logoBlock: { alignItems: 'center', marginBottom: 4 },
    logoRow: { flexDirection: 'row', alignItems: 'baseline' },
    logoThin: { fontSize: 26, fontWeight: '300', color: LOGO_TEAL, letterSpacing: 2 },
    logoBold: { fontSize: 26, fontWeight: '800', color: LOGO_GREEN, letterSpacing: 2 },
    taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    taglineLine: { width: 14, height: 1, backgroundColor: Colors.border },
    tagline: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600' },
});
