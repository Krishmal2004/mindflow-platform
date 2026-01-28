import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function BreathingInhalerScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.content}>
                <Ionicons name="medical-outline" size={80} color={Colors.primary} style={styles.icon} />
                <Text style={styles.title}>Breathing Inhaler</Text>
                <Text style={styles.subtitle}>Relax & Breathe</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>COMING SOON</Text>
                </View>
                <Text style={styles.description}>
                    We are crafting a unique breathing experience just for you. creating a immersive experience. Stay tuned!
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
        zIndex: 10,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    description: {
        textAlign: 'center',
        color: '#666',
        lineHeight: 24,
    },
});
