import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../constants/colors';

export function LogoBlock() {
    return (
        <View style={styles.logoBlock}>
            <View style={styles.logoRow}>
                <Text style={styles.logoThin}>Mind</Text>
                <Text style={styles.logoBold}>Flow</Text>
            </View>
            <View style={styles.taglineRow}>
                <View style={styles.taglineDot} />
                <Text style={styles.tagline}>Find your inner peace</Text>
                <View style={styles.taglineDot} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    logoBlock: { alignItems: 'center', marginBottom: 4 },
    logoRow: { flexDirection: 'row', alignItems: 'baseline' },
    logoThin: { fontSize: 26, fontWeight: '300', color: '#3A3A3A', letterSpacing: 2 },
    logoBold: { fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
    taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7FD9D1', opacity: 0.80 },
    tagline: { fontSize: 9, color: '#7A8285', letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600' },
});
