import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    Dashboard: undefined; // Or whatever the main app route is
};

export default function LoginScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        // Mock login logic
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // Verify inputs (mock)
            if (email && password) {
                // Navigate to Main App (need to define this route later, assume 'Dashboard' or similar)
                // For now, let's just log and maybe alert nicely
                Alert.alert('Success', 'Logged in successfully!');
                navigation.replace('Dashboard');
            } else {
                Alert.alert('Error', 'Please enter email and password');
            }
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LinearGradient
                colors={['#F8FDFC', '#F0F7F4']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.subtitleText}>Sign in to continue your journey</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#2E8A66', '#64C59A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.loginButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 40,
        alignItems: 'flex-start',
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1B5E45',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: '#62656b',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#1B5E45',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#2E8A66',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        shadowColor: "#2E8A66",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    gradientButton: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    signupText: {
        color: '#2E8A66',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
