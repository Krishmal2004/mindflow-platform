import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSession } from '../src/contexts/SessionContext';
import AboutMe from '../src/components/AboutMe';
import { Redirect, useRouter, Stack } from 'expo-router';

export default function AboutMeScreen() {
    const { session, loading } = useSession();
    const router = useRouter();

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#64C59A" />
            </View>
        );
    }

    if (!session) {
        return <Redirect href="/" />;
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
            <AboutMe session={session} onBack={() => router.back()} />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FDFC',
    },
});
