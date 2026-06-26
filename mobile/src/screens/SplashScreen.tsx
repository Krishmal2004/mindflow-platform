import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Animated, Easing as NativeEasing, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated2, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { RootStackParamList } from '../types/navigation';
import { API_URL } from '../config/api';
import { getPostAuthRoute } from '../lib/postAuthRoute';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AppIcon = require('../../assets/app-icon.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BrainLabsLogo = require('../../assets/brainlabs_logo.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SLIITLogo = require('../../assets/Logo_SLIIT.png');

const P = {
    primary:  '#7EA889',
    mint:     '#7FD9D1',
    green2:   '#98C67A',
    aqua:     '#63C9D9',
    wave1:    '#A7D7C5',
    charcoal: '#3A3A3A',
    textGray: '#7A8285',
    divider:  '#E2E7EA',
};

const { width: SW } = Dimensions.get('window');

// ── Upper birds + leaves decoration ───────────────────────────────────────────
function UpperDecorations() {
    return (
        <Svg
            width={SW} height={360}
            viewBox={`0 0 ${SW} 360`}
            style={{ position: 'absolute', top: 0, left: 0 }}
            pointerEvents="none"
        >
            {/* Large leaf — top left */}
            <Path
                d={`M 18 160 C 2 105 55 52 98 78 C 128 95 118 158 86 170 C 58 180 24 174 18 160`}
                fill={P.primary} opacity={0.07}
            />
            <Path d={`M 60 170 Q 74 138 90 105`} stroke={P.primary} strokeWidth="1.5" fill="none" opacity={0.06} />

            {/* Smaller leaf — top right */}
            <Path
                d={`M ${SW-22} 110 C ${SW-12} 68 ${SW-68} 32 ${SW-100} 58 C ${SW-122} 76 ${SW-106} 115 ${SW-76} 126 C ${SW-50} 135 ${SW-26} 124 ${SW-22} 110`}
                fill={P.green2} opacity={0.06}
            />
            <Path d={`M ${SW-62} 124 Q ${SW-72} 95 ${SW-84} 68`} stroke={P.green2} strokeWidth="1.2" fill="none" opacity={0.05} />

            {/* Tiny leaf — top center */}
            <Path
                d={`M ${SW*0.6} 55 C ${SW*0.65} 25 ${SW*0.78} 18 ${SW*0.82} 40 C ${SW*0.84} 56 ${SW*0.73} 72 ${SW*0.62} 70 C ${SW*0.56} 68 ${SW*0.56} 60 ${SW*0.6} 55`}
                fill={P.mint} opacity={0.06}
            />

            {/* Bird group 1 — upper center */}
            <Path d={`M ${SW*0.36} 55 Q ${SW*0.41} 43 ${SW*0.46} 55`} stroke={P.primary} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.10} />
            <Path d={`M ${SW*0.47} 53 Q ${SW*0.52} 41 ${SW*0.57} 53`} stroke={P.primary} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.10} />

            {/* Bird group 2 — upper right */}
            <Path d={`M ${SW*0.63} 32 Q ${SW*0.67} 22 ${SW*0.71} 32`} stroke={P.green2} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.09} />
            <Path d={`M ${SW*0.72} 31 Q ${SW*0.76} 21 ${SW*0.80} 31`} stroke={P.green2} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.09} />

            {/* Bird group 3 — upper left */}
            <Path d={`M ${SW*0.14} 82 Q ${SW*0.18} 71 ${SW*0.22} 82`} stroke={P.mint} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.08} />
            <Path d={`M ${SW*0.23} 80 Q ${SW*0.27} 69 ${SW*0.31} 80`} stroke={P.mint} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.08} />
        </Svg>
    );
}

// ── ECG pulse ─────────────────────────────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);
const ECG = 'M 0 19 L 48 19 L 55 13 L 60 25 L 65 3 L 71 35 L 77 19 L 118 19 L 124 13 L 130 25 L 135 19 L 220 19';
const DASH = 360;

function PulseWave() {
    const offset = useRef(new Animated.Value(DASH)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(offset, { toValue: 0, duration: 2200, easing: NativeEasing.linear, useNativeDriver: false }),
                Animated.delay(350),
                Animated.timing(offset, { toValue: DASH, duration: 0, useNativeDriver: false }),
                Animated.delay(250),
            ])
        ).start();
    }, []);
    return (
        <Svg width={220} height={38} viewBox="0 0 220 38">
            <AnimatedPath
                d={ECG} stroke={P.mint} strokeWidth="1.8" fill="none"
                strokeDasharray={`${DASH}`} strokeDashoffset={offset}
                strokeLinecap="round" strokeLinejoin="round" opacity={0.85}
            />
        </Svg>
    );
}

// ── Bottom wave ────────────────────────────────────────────────────────────────
function BottomWave() {
    const h = 220; const w = SW;
    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Defs>
                <SvgGradient id="wg" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0"   stopColor={P.wave1} stopOpacity="1" />
                    <Stop offset="0.5" stopColor={P.mint}  stopOpacity="1" />
                    <Stop offset="1"   stopColor={P.aqua}  stopOpacity="1" />
                </SvgGradient>
            </Defs>
            <Path d={`M0 ${h*0.42} C${w*0.25} ${h*0.18} ${w*0.5} ${h*0.62} ${w*0.75} ${h*0.33} C${w*0.88} ${h*0.16} ${w} ${h*0.38} ${w} ${h*0.38} L${w} ${h} L0 ${h} Z`} fill="url(#wg)" opacity={0.14} />
            <Path d={`M0 ${h*0.56} C${w*0.22} ${h*0.36} ${w*0.5} ${h*0.74} ${w*0.72} ${h*0.48} C${w*0.86} ${h*0.3} ${w} ${h*0.53} ${w} ${h*0.53} L${w} ${h} L0 ${h} Z`} fill="url(#wg)" opacity={0.10} />
            <Path d={`M0 ${h*0.7} C${w*0.3} ${h*0.5} ${w*0.6} ${h*0.84} ${w*0.85} ${h*0.63} C${w*0.93} ${h*0.55} ${w} ${h*0.68} ${w} ${h*0.68} L${w} ${h} L0 ${h} Z`} fill="url(#wg)" opacity={0.07} />
        </Svg>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SplashScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const logoOpacity    = useSharedValue(0);
    const logoScale      = useSharedValue(0.82);
    const titleOpacity   = useSharedValue(0);
    const titleY         = useSharedValue(28);
    const partnerOpacity = useSharedValue(0);
    const partnerY       = useSharedValue(16);

    useEffect(() => {
        logoOpacity.value    = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
        logoScale.value      = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
        titleOpacity.value   = withDelay(320, withTiming(1, { duration: 750 }));
        titleY.value         = withDelay(320, withTiming(0, { duration: 750, easing: Easing.out(Easing.quad) }));
        partnerOpacity.value = withDelay(700, withTiming(1, { duration: 700 }));
        partnerY.value       = withDelay(700, withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }));

        const validateSession = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const isLoggedIn      = await AsyncStorage.getItem('isLoggedIn');
                const token           = await AsyncStorage.getItem('authToken');
                const alreadyLaunched = await AsyncStorage.getItem('alreadyLaunched');

                if (isLoggedIn === 'true' && token) {
                    try {
                        const res = await fetch(`${API_URL}/api/profile`, {
                            method: 'GET', headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                            navigation.replace(await getPostAuthRoute());
                        } else {
                            await AsyncStorage.multiRemove(['isLoggedIn', 'authToken', 'user']);
                            navigation.replace('Login');
                        }
                    } catch { navigation.replace('Login'); }
                } else if (alreadyLaunched === null) {
                    navigation.replace('Onboarding');
                } else {
                    navigation.replace('Login');
                }
            } catch (err) {
                console.error('Splash Error', err);
                navigation.replace('Login');
            }
        };
        validateSession();
    }, []);

    const logoStyle    = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
    const titleStyle   = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
    const partnerStyle = useAnimatedStyle(() => ({ opacity: partnerOpacity.value, transform: [{ translateY: partnerY.value }] }));

    return (
        <LinearGradient colors={['#FFFFFF', '#F7FBF9', '#EEF8F7', '#EAF4FF']} style={styles.container} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
            <StatusBar style="dark" />

            {/* Birds + leaves in upper section */}
            <UpperDecorations />

            {/* Faint concentric rings */}
            <View style={[styles.ring, { width: 340, height: 340, borderRadius: 170, opacity: 0.04 }]} />
            <View style={[styles.ring, { width: 280, height: 280, borderRadius: 140, opacity: 0.05 }]} />
            <View style={[styles.ring, { width: 220, height: 220, borderRadius: 110, opacity: 0.06 }]} />
            <View style={[styles.ring, { width: 160, height: 160, borderRadius: 80,  opacity: 0.05 }]} />

            {/* App icon */}
            <Animated2.View style={[styles.iconWrap, logoStyle]}>
                <Image source={AppIcon} style={styles.icon} resizeMode="contain" />
            </Animated2.View>

            {/* Title + tagline + ECG */}
            <Animated2.View style={[styles.textBlock, titleStyle]}>
                <View style={styles.titleRow}>
                    <Text style={styles.titleThin}>Mind</Text>
                    <Text style={styles.titleBold}>Flow</Text>
                </View>
                <View style={styles.taglineRow}>
                    <View style={styles.taglineDot} />
                    <Text style={styles.tagline}>Find your inner peace</Text>
                    <View style={styles.taglineDot} />
                </View>
                <View style={styles.pulseWrap}>
                    <PulseWave />
                </View>
            </Animated2.View>

            {/* Bottom wave */}
            <View style={styles.waveContainer}>
                <BottomWave />
            </View>

            {/* Footer */}
            <Animated2.View style={[styles.footer, partnerStyle]}>
                <View style={styles.footerDivider} />
                <View style={styles.footerRow}>
                    <View style={styles.footerItem}>
                        <Image source={BrainLabsLogo} style={styles.brandLogo} resizeMode="contain" />
                        <View>
                            <Text style={styles.footerRole}>Built by</Text>
                            <Text style={styles.footerName}>BrainLabs Inc.</Text>
                        </View>
                    </View>
                    <View style={styles.footerSep} />
                    <View style={styles.footerItem}>
                        <Image source={SLIITLogo} style={styles.sliitLogo} resizeMode="contain" />
                        <View>
                            <Text style={styles.footerRole}>Research by</Text>
                            <Text style={styles.footerName}>SLIIT</Text>
                        </View>
                    </View>
                </View>
            </Animated2.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    ring: { position: 'absolute', borderWidth: 1, borderColor: P.primary, backgroundColor: 'transparent' },
    iconWrap: { width: 180, height: 180, marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
    icon: { width: '100%', height: '100%' },
    textBlock: { alignItems: 'center' },
    titleRow: { flexDirection: 'row', marginBottom: 10 },
    titleThin: { fontSize: 42, fontWeight: '300', color: P.charcoal, letterSpacing: 2 },
    titleBold: { fontSize: 42, fontWeight: '800', color: P.primary, letterSpacing: 2 },
    taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: P.mint, opacity: 0.7 },
    tagline: { fontSize: 12, color: P.textGray, letterSpacing: 3.5, textTransform: 'uppercase', fontWeight: '600' },
    pulseWrap: { marginTop: 2 },
    waveContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
    footer: { position: 'absolute', bottom: 44, alignItems: 'center', gap: 14, width: '80%' },
    footerDivider: { width: '100%', height: 1, backgroundColor: P.divider },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandLogo: { width: 52, height: 52 },
    sliitLogo:  { width: 70, height: 70 },
    footerRole: { fontSize: 9, color: P.textGray, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    footerName: { fontSize: 13, color: P.charcoal, fontWeight: '700', letterSpacing: 0.3 },
    footerSep:  { width: 1, height: 40, backgroundColor: P.divider },
});
