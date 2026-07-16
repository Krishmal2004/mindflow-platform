import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Colors } from '../constants/colors';

const AppIcon = require('../../assets/app-icon.png') as number;

// Shared brand mark: icon badge + "MindFlow" wordmark + tagline. Used as the hero
// block on Login/Signup/OtpVerification and as the compact Dashboard header.
export function LogoBlock() {
    return (
        <View style={styles.logoBlock}>
            {/* <View style={styles.iconBadge}>
                <Image source={AppIcon} style={styles.icon} resizeMode="contain" />
            </View> */}
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
    iconBadge: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 4,
    },
    icon: { width: 36, height: 36 },
    logoRow: { flexDirection: 'row', alignItems: 'baseline' },
    logoThin: { fontSize: 26, fontWeight: '300', color: Colors.textPrimary, letterSpacing: 2 },
    logoBold: { fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
    taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    taglineLine: { width: 14, height: 1, backgroundColor: Colors.border },
    tagline: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600' },
});
