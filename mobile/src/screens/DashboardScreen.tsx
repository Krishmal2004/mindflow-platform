import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../types/navigation';
import { Colors } from '../constants/colors';
import { LeavesDecoration } from '../components/LeavesDecoration';
import { MeditationSmall, YogaSmall, LeafIcon } from '../components/DashboardIllustrations';

const { width } = Dimensions.get('window');

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
    const navigation = useNavigation<DashboardNavProp>();
    const [userName, setUserName] = useState('Anna'); // Default backup

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedName = await AsyncStorage.getItem('userName');
                if (storedName) {
                    setUserName(storedName);
                }
            } catch (e) {
                // ignore
            }
        };
        loadUser();
    }, []);

    const CategoryCard = ({ title, icon: Icon, color1, color2, onPress }: any) => (
        <TouchableOpacity style={styles.gridCard} onPress={onPress}>
            <LinearGradient colors={[color1, color2]} style={styles.gridGradient}>
                <View style={styles.gridContent}>
                    <Text style={styles.gridTitle}>{title}</Text>
                    <View style={styles.playIconContainer}>
                        <Ionicons name="play" size={16} color="#333" />
                    </View>
                </View>
                <View style={styles.gridDecoration}>
                    <Icon color="rgba(255,255,255,0.2)" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Top Leaves Decoration */}
            <View style={styles.topDecoration}>
                <LeavesDecoration width={200} height={200} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greetingText}>HELLO, {userName.toUpperCase()} !</Text>
                    <Text style={styles.questionText}>WHAT WOULD YOU{'\n'}LIKE TO DO?</Text>
                </View>

                {/* Next Session Pill */}
                <View style={styles.sectionHeader}>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>NEXT SESSION</Text>
                    </View>
                </View>

                {/* Large Cards Area */}
                <View style={styles.largeCardsContainer}>
                    {/* Meditation Card */}
                    <TouchableOpacity style={[styles.largeCard, { backgroundColor: '#E3F2FD' }]}>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>MEDITATION</Text>
                            <Text style={styles.cardSubtitle}>Basics</Text>
                            <Text style={styles.cardDescription}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            </Text>
                            <Text style={styles.cardMeta}>10 steps | 10-15 min</Text>
                        </View>
                        <View style={styles.cardImageContainer}>
                            <MeditationSmall />
                        </View>
                    </TouchableOpacity>

                    {/* Yoga Card */}
                    <TouchableOpacity style={[styles.largeCard, { backgroundColor: '#F3E5F5' }]}>
                        <View style={styles.cardImageContainer}>
                            <YogaSmall />
                        </View>
                        <View style={[styles.cardTextContainer, { alignItems: 'flex-end' }]}>
                            <Text style={styles.cardTitle}>YOGA</Text>
                            <Text style={styles.cardSubtitle}>Motivation</Text>
                            <Text style={[styles.cardDescription, { textAlign: 'right' }]}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            </Text>
                            <Text style={styles.cardMeta}>Daily yoga</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Grid Area */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <CategoryCard title="Concentrate" icon={LeafIcon} color1="#5A607C" color2="#45485E" />
                        <CategoryCard title="Relax" icon={LeafIcon} color1="#5A607C" color2="#45485E" />
                    </View>
                    <View style={styles.gridRow}>
                        <CategoryCard title="Happiness" icon={LeafIcon} color1="#5A607C" color2="#45485E" />
                        <CategoryCard title="Creativity" icon={LeafIcon} color1="#5A607C" color2="#45485E" />
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        zIndex: 0,
        transform: [{ rotate: '90deg' }]
    },
    scrollContent: {
        paddingTop: 80,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
        zIndex: 1,
    },
    greetingText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        lineHeight: 34,
    },
    sectionHeader: {
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    pill: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pillText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    largeCardsContainer: {
        marginBottom: 30,
        gap: 20,
    },
    largeCard: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 24,
        height: 160,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardImageContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B4E6D',
        marginBottom: 4,
        letterSpacing: 1,
    },
    cardSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    cardDescription: {
        fontSize: 10,
        color: '#636E72',
        marginBottom: 10,
        lineHeight: 14,
    },
    cardMeta: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4B4E6D',
    },
    gridContainer: {
        gap: 16,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 16,
    },
    gridCard: {
        flex: 1,
        height: 100,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    gridGradient: {
        flex: 1,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridContent: {
        flex: 1,
    },
    gridTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 12,
    },
    playIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 2, // Center play triangle
    },
    gridDecoration: {
        opacity: 0.5,
        transform: [{ scale: 1.5 }],
    },
});
