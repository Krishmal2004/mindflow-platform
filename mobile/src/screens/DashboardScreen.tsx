import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api'; import LoadingScreen from '../components/LoadingScreen';

// Note check path for api and LoadingScreen

export default function DashboardScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Artificial delay to show off the animation
        const timer = setTimeout(async () => {
            try {
                const response = await api.get('/dashboard/summary');
                setData(response.data);
            } catch (err: any) {
                if (err.response) {
                    setError(`Server Error: ${err.response.status} ${err.response.data.error || ''}`);
                } else {
                    setError(`Connection Error: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        }, 3000); // 3 seconds loading

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>MindFlow V2</Text>
            <Text style={styles.subtitle}>Enterprise Edition</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Backend Connection Status</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : (
                    <Text style={styles.success}>{JSON.stringify(data, null, 2)}</Text>
                )}
            </View>
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 40
    },
    card: {
        width: '100%',
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        alignItems: 'center'
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10
    },
    error: {
        color: 'red',
        textAlign: 'center'
    },
    success: {
        color: 'green',
        textAlign: 'center'
    }
});
