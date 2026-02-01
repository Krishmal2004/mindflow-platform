import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { Colors } from '../constants/colors';
import { PopupModal } from '../components/PopupModal';
import { JourneyIcons } from '../components/JourneyIcons';

const DASHBOARD_GRADIENT: [string, string, string] = ['#F0FDF4', '#F8FAFC', '#FFFFFF'];

// Types
interface AboutMeData {
    university_id: string;
    education_level: string;
    major_field_of_study: string;
    age: number | null;
    living_situation: string;
    family_background: string;
    cultural_background: string;
    hobbies_interests: string;
    personal_goals: string;
    why_mindflow: string;
    is_completed?: boolean;
}

const educationLevels = ["First Year", "Second Year", "Third Year", "Fourth Year", "Graduate Student", "Other"];
const livingSituations = ["Dorm", "Off-campus housing", "With family", "Other"];
const culturalBackgrounds = ["Buddhism", "Islam", "Hindu", "Christian", "Other"];
const hobbiesOptions = [
    "Reading", "Sports & Fitness", "Music", "Travel", "Cooking & Baking",
    "Video Gaming", "Art & Crafts", "Hiking & Outdoors", "Watching Movies/TV", "Photography", "Other"
];

export default function AboutMeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Success Modal State

    const [data, setData] = useState<AboutMeData>({
        university_id: '',
        education_level: '',
        major_field_of_study: '',
        age: null,
        living_situation: '',
        family_background: '',
        cultural_background: '',
        hobbies_interests: '',
        personal_goals: '',
        why_mindflow: '',
    });

    const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
    const [otherHobby, setOtherHobby] = useState('');
    const [otherCultural, setOtherCultural] = useState('');
    const [otherLivingSituation, setOtherLivingSituation] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    // Sync hobbies string with selection state
    useEffect(() => {
        const hobbiesStr = data.hobbies_interests || '';
        if (hobbiesStr) {
            const hobbies = hobbiesStr.split(', ').filter(h => h.trim());
            const predefinedSet = new Set(hobbiesOptions.slice(0, -1));
            const predefined = hobbies.filter(h => predefinedSet.has(h));
            const others = hobbies.filter(h => !predefinedSet.has(h));

            if (others.length > 0) {
                setSelectedHobbies([...predefined, 'Other']);
                setOtherHobby(others.join(', '));
            } else {
                setSelectedHobbies(predefined);
                setOtherHobby('');
            }
        } else {
            setSelectedHobbies([]);
            setOtherHobby('');
        }
    }, [data.hobbies_interests]);

    const getAuthToken = async () => {
        return await AsyncStorage.getItem('authToken');
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/api/profile/about-me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const profile = await response.json();
                if (profile) {
                    // Handle cultural background special logic
                    if (profile.cultural_background && !culturalBackgrounds.includes(profile.cultural_background)) {
                        setOtherCultural(profile.cultural_background);
                    }
                    // Handle living situation special logic
                    if (profile.living_situation && !livingSituations.includes(profile.living_situation)) {
                        setOtherLivingSituation(profile.living_situation);
                    }

                    setData(prev => ({
                        ...prev,
                        ...profile,
                        age: profile.age ? Number(profile.age) : null
                    }));
                    if (profile.is_completed) setDeclarationChecked(true);
                }
            }
        } catch (error) {
            console.log('Error fetching about me', error);
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        if (!declarationChecked) {
            Alert.alert("Declaration Required", "Please confirm that your information is accurate before submitting.");
            return;
        }

        try {
            setSaving(true);
            const token = await getAuthToken();

            // Prepare Data
            const hobbiesToSave = [...selectedHobbies.filter(h => h !== 'Other'), ...(otherHobby.trim() ? [otherHobby.trim()] : [])].join(', ');

            let culturalBgToSave = data.cultural_background;
            if (data.cultural_background === 'Other') {
                culturalBgToSave = otherCultural.trim();
            } else if (!culturalBackgrounds.includes(data.cultural_background) && data.cultural_background) {
                culturalBgToSave = data.cultural_background;
            }

            let livingSitToSave = data.living_situation;
            if (data.living_situation === 'Other') {
                livingSitToSave = otherLivingSituation.trim();
            } else if (!livingSituations.includes(data.living_situation) && data.living_situation) {
                livingSitToSave = data.living_situation;
            }

            const payload = {
                ...data,
                hobbies_interests: hobbiesToSave,
                cultural_background: culturalBgToSave,
                living_situation: livingSitToSave,
                is_completed: true
            };

            const response = await fetch(`${API_URL}/api/profile/about-me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Alert.alert("Success", "Profile updated successfully!");
                // navigation.goBack();
                setShowSuccessModal(true); // Show modal instead of alert
                // Update local state to reflect completion immediately
                setData(prev => ({ ...prev, is_completed: true }));
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update');
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const update = (key: keyof AboutMeData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const toggleHobby = (hobby: string) => {
        setSelectedHobbies(prev => {
            if (prev.includes(hobby)) {
                return prev.filter(h => h !== hobby);
            } else {
                return [...prev, hobby];
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={DASHBOARD_GRADIENT}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>About Me</Text>
                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Content - Conditionally Render Form or Read-Only View */}
                {data.is_completed && !showSuccessModal ? (
                    <View style={styles.readOnlyContainer}>
                        <View style={styles.successBanner}>
                            <Ionicons name="checkmark-circle" size={24} color="#059669" />
                            <Text style={styles.successBannerText}>Profile Completed</Text>
                        </View>

                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Academic width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>University ID</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.university_id}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Academic width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Education Level</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.education_level}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Book width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Major</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.major_field_of_study}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Person width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Age</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.age?.toString()}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Home width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Living Situation</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.living_situation}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Globe width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Cultural Background</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.cultural_background}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Family width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Family Background</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.family_background}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Star width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Hobbies</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.hobbies_interests}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.Target width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Personal Goals</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.personal_goals || 'Not specified'}</Text>
                        </View>
                        <View style={styles.readOnlySection}>
                            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                                <JourneyIcons.History width={18} height={18} color={Colors.primary} />
                                <Text style={[styles.readOnlyLabel, { marginBottom: 0 }]}>Previous Experience</Text>
                            </View>
                            <Text style={styles.readOnlyValue}>{data.why_mindflow || 'Not specified'}</Text>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.helpCard}>
                            <Ionicons name="information-circle-outline" size={24} color="#0EA5E9" style={{ marginBottom: 8 }} />
                            <Text style={styles.helpTitle}>Help us know you better</Text>
                            <Text style={styles.helpText}>
                                Please provide accurate and truthful information. This helps us personalize your MindFlow experience.
                            </Text>
                        </View>

                        {/* University ID */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Academic width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>University ID <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={data.university_id}
                                onChangeText={t => update('university_id', t)}
                                placeholder="Your official student ID"
                                placeholderTextColor="#94A3B8"
                                editable={!data.is_completed}
                            />
                        </View>

                        {/* Education Level */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Academic width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Education Level <Text style={styles.required}>*</Text></Text>
                            </View>
                            <View style={styles.pillContainer}>
                                {educationLevels.map(level => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[styles.pill, data.education_level === level && styles.pillActive]}
                                        onPress={() => update('education_level', level)}
                                        disabled={data.is_completed}
                                    >
                                        <Text style={[styles.pillText, data.education_level === level && styles.pillTextActive]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Major */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Book width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Major / Field of Study <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={data.major_field_of_study}
                                onChangeText={t => update('major_field_of_study', t)}
                                placeholder="e.g. Computer Science"
                                placeholderTextColor="#94A3B8"
                                editable={!data.is_completed}
                            />
                        </View>

                        {/* Age */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Person width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Age <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={data.age?.toString() || ''}
                                onChangeText={t => update('age', t ? parseInt(t) : null)}
                                placeholder="e.g. 21"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                editable={!data.is_completed}
                            />
                        </View>

                        {/* Living Situation */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Home width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Living Situation <Text style={styles.required}>*</Text></Text>
                            </View>
                            <View style={styles.pillContainer}>
                                {livingSituations.map(sit => {
                                    const isCustom = !livingSituations.slice(0, -1).includes(data.living_situation) && data.living_situation !== '' && sit === 'Other';
                                    const isActive = data.living_situation === sit || isCustom;
                                    return (
                                        <TouchableOpacity
                                            key={sit}
                                            style={[styles.pill, isActive && styles.pillActive]}
                                            onPress={() => update('living_situation', sit)}
                                            disabled={data.is_completed}
                                        >
                                            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{sit}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                            {(data.living_situation === 'Other' || (!livingSituations.slice(0, -1).includes(data.living_situation) && data.living_situation !== '')) && (
                                <TextInput
                                    style={[styles.input, { marginTop: 12 }]}
                                    value={otherLivingSituation}
                                    onChangeText={setOtherLivingSituation}
                                    placeholder="Specify living situation..."
                                    placeholderTextColor="#94A3B8"
                                    editable={!data.is_completed}
                                />
                            )}
                        </View>

                        {/* Family Background */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Family width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Family Background <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={data.family_background}
                                onChangeText={t => update('family_background', t)}
                                placeholder="Tell us about your family..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                editable={!data.is_completed}
                            />
                        </View>

                        {/* Cultural Background */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Globe width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Cultural Background <Text style={styles.required}>*</Text></Text>
                            </View>
                            <View style={styles.pillContainer}>
                                {culturalBackgrounds.map(bg => {
                                    const isCustom = !culturalBackgrounds.slice(0, -1).includes(data.cultural_background) && data.cultural_background !== '' && bg === 'Other';
                                    const isActive = data.cultural_background === bg || isCustom;
                                    return (
                                        <TouchableOpacity
                                            key={bg}
                                            style={[styles.pill, isActive && styles.pillActive]}
                                            onPress={() => update('cultural_background', bg)}
                                            disabled={data.is_completed}
                                        >
                                            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{bg}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {(data.cultural_background === 'Other' || (!culturalBackgrounds.slice(0, -1).includes(data.cultural_background) && data.cultural_background !== '')) && (
                                <TextInput
                                    style={[styles.input, { marginTop: 12 }]}
                                    value={otherCultural}
                                    onChangeText={setOtherCultural}
                                    placeholder="Specify cultural background..."
                                    placeholderTextColor="#94A3B8"
                                    editable={!data.is_completed}
                                />
                            )}
                        </View>

                        {/* Hobbies */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Star width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Hobbies & Interests <Text style={styles.required}>*</Text></Text>
                            </View>
                            <View style={styles.pillContainer}>
                                {hobbiesOptions.map(hobby => (
                                    <TouchableOpacity
                                        key={hobby}
                                        style={[styles.pill, selectedHobbies.includes(hobby) && styles.pillActive]}
                                        onPress={() => toggleHobby(hobby)}
                                        disabled={data.is_completed}
                                    >
                                        <Text style={[styles.pillText, selectedHobbies.includes(hobby) && styles.pillTextActive]}>{hobby}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {selectedHobbies.includes('Other') && (
                                <TextInput
                                    style={[styles.input, { marginTop: 12 }]}
                                    value={otherHobby}
                                    onChangeText={setOtherHobby}
                                    placeholder="Specify other hobbies..."
                                    placeholderTextColor="#94A3B8"
                                    editable={!data.is_completed}
                                />
                            )}
                        </View>

                        {/* Personal Goals */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.Target width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Personal Goals</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={data.personal_goals}
                                onChangeText={t => update('personal_goals', t)}
                                placeholder="What are you working towards?"
                                placeholderTextColor="#94A3B8"
                                multiline
                                editable={!data.is_completed}
                            />
                        </View>

                        {/* Why Mindflow */}
                        <View style={styles.section}>
                            <View style={styles.labelRow}>
                                <JourneyIcons.History width={20} height={20} color={Colors.primary} />
                                <Text style={styles.labelWithIcon}>Previous Experience <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={data.why_mindflow}
                                onChangeText={t => update('why_mindflow', t)}
                                placeholder="Have you done any mindfulness practices?"
                                placeholderTextColor="#94A3B8"
                                multiline
                                editable={!data.is_completed}
                            />
                        </View>

                        {/* Declaration */}
                        <TouchableOpacity
                            style={[styles.checkboxContainer, declarationChecked && styles.checkboxChecked]}
                            onPress={() => setDeclarationChecked(!declarationChecked)}
                            disabled={data.is_completed}
                        >
                            <View style={[styles.checkbox, declarationChecked && styles.checkboxActive]}>
                                {declarationChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                I hereby confirm that all information provided above is true, accurate, and complete.
                            </Text>
                        </TouchableOpacity>

                        {/* Submit */}
                        <TouchableOpacity
                            onPress={save}
                            disabled={saving || !declarationChecked || data.is_completed}
                            style={[styles.saveButton, (saving || !declarationChecked || data.is_completed) && styles.saveButtonDisabled]}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Submit My Profile</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                {/* Success Modal */}
                <PopupModal
                    visible={showSuccessModal}
                    type="success"
                    title="Profile Completed!"
                    message="Thank you for sharing your information. Your profile is now set up."
                    buttonText="Continue"
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigation.goBack();
                    }}
                />

            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background handled by LinearGradient
    },
    gradientHeader: {
        // Removed
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    helpCard: {
        backgroundColor: '#E0F2FE',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0284C7',
        marginBottom: 6,
    },
    helpText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
    },
    section: {
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    labelWithIcon: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    required: {
        color: '#EF4444',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1E293B',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pillActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    pillTextActive: {
        color: '#059669',
        fontWeight: '700',
    },
    checkboxContainer: {
        flexDirection: 'row',
        marginTop: 32,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    checkboxChecked: {
        borderColor: '#10B981',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    saveButton: {
        marginTop: 24,
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#64C59A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#64C59A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    successButton: {
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    successButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    readOnlyContainer: {
        paddingTop: 8,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    successBannerText: {
        color: '#065F46',
        fontWeight: '700',
        fontSize: 16,
    },
    readOnlySection: {
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    readOnlyLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    readOnlyValue: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
        lineHeight: 24,
    },
});
