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
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { Colors } from '../constants/colors';
import { PopupModal } from '../components/PopupModal';
import { JourneyIcons } from '../components/JourneyIcons';
import { LeavesDecoration } from '../components/LeavesDecoration';

const { width } = Dimensions.get('window');

// Types
interface AboutMeData {
    university_id: string;
    education_level: string;
    faculty: string;
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

const livingSituations = [
    "Living at Home (Commuting)",
    "University Hostel / Dormitory",
    "Private Boarding / Room Rentals",
    "Private Apartment / Studio Living",
    "Living with Relatives (Guardian Setup)"
];

const culturalBackgrounds = ["Buddhism", "Islam", "Hindu", "Christian", "Other"];

const hobbiesOptions = [
    "Reading", "Sports & Fitness", "Music", "Travel", "Cooking & Baking",
    "Video Gaming", "Art & Crafts", "Hiking & Outdoors", "Watching Movies/TV", "Photography", "Other"
];

const faculties = [
    "Faculty of Computing",
    "Faculty of Engineering",
    "SLIIT Business School",
    "Faculty of Humanities & Sciences",
    "School of Architecture"
];

const facultyMajors: Record<string, string[]> = {
    "Faculty of Computing": [
        "Artificial Intelligence", "Software Engineering", "Information Technology", "Data Science", 
        "Cyber Security", "Information Systems Engineering", "Interactive Media", "Computer Systems Engineering", 
        "Computer Systems and Network Engineering", "Computer Science"
    ],
    "Faculty of Engineering": [
        "Civil Engineering", "Mechanical Engineering", "Mechanical Engineering (Mechatronics Specialisation)", 
        "Mechatronic Engineering", "Materials Engineering", "Electrical Engineering", "Electrical & Electronic Engineering", 
        "Quantity Surveying"
    ],
    "SLIIT Business School": [
        "Business Analytics", "Business Administration", "Business Management", "Commerce", "Economics", 
        "Fashion Business & Management", "Marketing Management", "Human Capital Management", 
        "Logistics and Supply Chain Management", "Management Information Systems", "Accounting & Finance", 
        "Quality Management"
    ],
    "Faculty of Humanities & Sciences": [
        "Psychology", "Nursing (Higher National Diploma / NVQ Level 6)", "Physical Sciences (BEd Hons)", 
        "Biological Sciences (BEd Hons)", "Social Sciences (BEd Hons)", "English (BEd Hons)", 
        "English Studies (BA Hons)", "Law (LLB / Bachelor of Laws)", "Biomedical Science", "Biotechnology", 
        "Financial Mathematics and Applied Statistics"
    ],
    "School of Architecture": [
        "Architecture", "Interior Design", "Heritage and Cultural Tourism"
    ]
};

export default function AboutMeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form inputs state
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const [data, setData] = useState<AboutMeData>({
        university_id: '',
        education_level: '',
        faculty: '',
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
        // Validation
        if (!data.university_id.trim()) {
            Alert.alert("Required Field", "Please enter your University ID.");
            return;
        }
        if (!data.education_level) {
            Alert.alert("Required Field", "Please select your Education Level.");
            return;
        }
        if (!data.faculty) {
            Alert.alert("Required Field", "Please select your Faculty.");
            return;
        }
        if (!data.major_field_of_study) {
            Alert.alert("Required Field", "Please select your Major.");
            return;
        }
        if (!data.age || isNaN(data.age) || data.age <= 0) {
            Alert.alert("Required Field", "Please enter a valid Age.");
            return;
        }
        if (!data.living_situation) {
            Alert.alert("Required Field", "Please select your Living Situation.");
            return;
        }
        if (!data.family_background.trim()) {
            Alert.alert("Required Field", "Please describe your Family Background.");
            return;
        }
        if (!data.cultural_background) {
            Alert.alert("Required Field", "Please select your Cultural Background.");
            return;
        }
        if (selectedHobbies.length === 0) {
            Alert.alert("Required Field", "Please select at least one Hobby.");
            return;
        }
        if (!data.why_mindflow.trim()) {
            Alert.alert("Required Field", "Please share your Previous Experience.");
            return;
        }
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

            const payload = {
                ...data,
                hobbies_interests: hobbiesToSave,
                cultural_background: culturalBgToSave,
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
                setShowSuccessModal(true);
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
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LeavesDecoration width={width} height={width * 0.7} />

            <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                            }
                        }}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.headerTitle}>About Me</Text>
                        <Text style={styles.headerSubtitle}>Your research profile</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {data.is_completed && !showSuccessModal ? (
                    <View style={styles.readOnlyContainer}>
                        <View style={styles.successBanner}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                            <Text style={styles.successBannerText}>Profile Completed</Text>
                        </View>

                        {/* Card 1: Academic Profile */}
                        <View style={styles.groupedCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIconContainer}>
                                    <JourneyIcons.Academic width={18} height={18} color={Colors.primary} />
                                </View>
                                <Text style={styles.cardHeaderText}>Academic Profile</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>University ID</Text>
                                    <Text style={styles.infoFieldValue}>{data.university_id || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Education Level</Text>
                                    <Text style={styles.infoFieldValue}>{data.education_level || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Faculty</Text>
                                    <Text style={styles.infoFieldValue}>{data.faculty || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Major / Field of Study</Text>
                                    <Text style={styles.infoFieldValue}>{data.major_field_of_study || 'Not Specified'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Card 2: Personal Profile */}
                        <View style={styles.groupedCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIconContainer}>
                                    <JourneyIcons.Person width={18} height={18} color={Colors.primary} />
                                </View>
                                <Text style={styles.cardHeaderText}>Personal Profile</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Age</Text>
                                    <Text style={styles.infoFieldValue}>{data.age?.toString() || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Living Situation</Text>
                                    <Text style={styles.infoFieldValue}>{data.living_situation || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Cultural Background</Text>
                                    <Text style={styles.infoFieldValue}>{data.cultural_background || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Family Background</Text>
                                    <Text style={styles.infoFieldValueText}>{data.family_background || 'Not Specified'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Card 3: Interests & MindFlow Journey */}
                        <View style={styles.groupedCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderIconContainer}>
                                    <JourneyIcons.Star width={18} height={18} color={Colors.primary} />
                                </View>
                                <Text style={styles.cardHeaderText}>Interests & Experience</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Hobbies & Interests</Text>
                                    <Text style={styles.infoFieldValueText}>{data.hobbies_interests || 'None Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Personal Goals</Text>
                                    <Text style={styles.infoFieldValueText}>{data.personal_goals || 'Not Specified'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoField}>
                                    <Text style={styles.infoFieldLabel}>Previous Experience</Text>
                                    <Text style={styles.infoFieldValueText}>{data.why_mindflow || 'Not Specified'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.helpCard}>
                            <View style={styles.helpCardIcon}>
                                <Ionicons name="information-circle" size={22} color="#0284C7" />
                            </View>
                            <View style={styles.helpCardContent}>
                                <Text style={styles.helpTitle}>Help us know you better</Text>
                                <Text style={styles.helpText}>
                                    Please provide accurate and truthful information. This helps us personalise your MindFlow experience.
                                </Text>
                            </View>
                        </View>

                        {/* CARD 1: ACADEMIC DETAILS */}
                        <View style={styles.groupedFormCard}>
                            <View style={styles.formCardHeader}>
                                <View style={styles.formCardIconWrap}>
                                    <JourneyIcons.Academic width={20} height={20} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formCardHeaderText}>Academic Details</Text>
                                    <Text style={styles.formCardHeaderSubtext}>Your university and area of study</Text>
                                </View>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>1 / 3</Text>
                                </View>
                            </View>
                            
                            <View style={styles.formCardBody}>
                                {/* University ID */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>University ID <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, focusedInput === 'university_id' && styles.inputFocused]}
                                        value={data.university_id}
                                        onChangeText={t => update('university_id', t)}
                                        placeholder="Your official student ID"
                                        placeholderTextColor="#94A3B8"
                                        editable={!data.is_completed}
                                        onFocus={() => setFocusedInput('university_id')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>

                                {/* Education Level */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Education Level <Text style={styles.required}>*</Text></Text>
                                    <View style={styles.pillContainer}>
                                        {educationLevels.map(level => (
                                            <TouchableOpacity
                                                key={level}
                                                style={[styles.pill, data.education_level === level && styles.pillActive]}
                                                onPress={() => update('education_level', level)}
                                                disabled={data.is_completed}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.pillText, data.education_level === level && styles.pillTextActive]}>{level}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Faculty Selection */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Faculty <Text style={styles.required}>*</Text></Text>
                                    <View style={styles.pillContainer}>
                                        {faculties.map(fac => (
                                            <TouchableOpacity
                                                key={fac}
                                                style={[styles.pill, data.faculty === fac && styles.pillActive]}
                                                onPress={() => {
                                                    update('faculty', fac);
                                                    update('major_field_of_study', ''); // Reset major on faculty change
                                                }}
                                                disabled={data.is_completed}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.pillText, data.faculty === fac && styles.pillTextActive]}>{fac}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Major Selection */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Major / Field of Study <Text style={styles.required}>*</Text></Text>
                                    {data.faculty ? (
                                        <View style={styles.pillContainer}>
                                            {facultyMajors[data.faculty]?.map(major => (
                                                <TouchableOpacity
                                                    key={major}
                                                    style={[styles.pill, data.major_field_of_study === major && styles.pillActive]}
                                                    onPress={() => update('major_field_of_study', major)}
                                                    disabled={data.is_completed}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.pillText, data.major_field_of_study === major && styles.pillTextActive]}>{major}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={styles.placeholderBox}>
                                            <Ionicons name="school-outline" size={20} color="#94A3B8" />
                                            <Text style={styles.placeholderText}>Please select a Faculty above first to choose a Major.</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* CARD 2: PERSONAL CONTEXT */}
                        <View style={styles.groupedFormCard}>
                            <View style={styles.formCardHeader}>
                                <View style={styles.formCardIconWrap}>
                                    <JourneyIcons.Person width={20} height={20} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formCardHeaderText}>Personal Profile</Text>
                                    <Text style={styles.formCardHeaderSubtext}>Background and living details</Text>
                                </View>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>2 / 3</Text>
                                </View>
                            </View>
                            
                            <View style={styles.formCardBody}>
                                {/* Age */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Age <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, { width: 100 }, focusedInput === 'age' && styles.inputFocused]}
                                        value={data.age?.toString() || ''}
                                        onChangeText={t => update('age', t ? parseInt(t) : null)}
                                        placeholder="e.g. 21"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="numeric"
                                        maxLength={3}
                                        editable={!data.is_completed}
                                        onFocus={() => setFocusedInput('age')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>

                                {/* Living Situation */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Living Situation <Text style={styles.required}>*</Text></Text>
                                    <View style={styles.selectionGroup}>
                                        {livingSituations.map(sit => {
                                            const isActive = data.living_situation === sit;
                                            return (
                                                <TouchableOpacity
                                                    key={sit}
                                                    style={[styles.selectRow, isActive && styles.selectRowActive]}
                                                    onPress={() => update('living_situation', sit)}
                                                    disabled={data.is_completed}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                                                        {isActive && <View style={styles.radioInnerCircle} />}
                                                    </View>
                                                    <Text style={[styles.selectRowText, isActive && styles.selectRowTextActive]}>{sit}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Cultural Background */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Cultural Background <Text style={styles.required}>*</Text></Text>
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
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{bg}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    {(data.cultural_background === 'Other' || (!culturalBackgrounds.slice(0, -1).includes(data.cultural_background) && data.cultural_background !== '')) && (
                                        <TextInput
                                            style={[styles.input, { marginTop: 12 }, focusedInput === 'otherCultural' && styles.inputFocused]}
                                            value={otherCultural}
                                            onChangeText={setOtherCultural}
                                            placeholder="Specify cultural background..."
                                            placeholderTextColor="#94A3B8"
                                            editable={!data.is_completed}
                                            onFocus={() => setFocusedInput('otherCultural')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                    )}
                                </View>

                                {/* Family Background */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Family Background <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, focusedInput === 'family_background' && styles.inputFocused]}
                                        value={data.family_background}
                                        onChangeText={t => update('family_background', t)}
                                        placeholder="Tell us about your family..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        editable={!data.is_completed}
                                        onFocus={() => setFocusedInput('family_background')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* CARD 3: GOALS & MINDFLOW JOURNEY */}
                        <View style={styles.groupedFormCard}>
                            <View style={styles.formCardHeader}>
                                <View style={styles.formCardIconWrap}>
                                    <JourneyIcons.Star width={20} height={20} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formCardHeaderText}>Goals & Hobbies</Text>
                                    <Text style={styles.formCardHeaderSubtext}>Your interests and previous experience</Text>
                                </View>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>3 / 3</Text>
                                </View>
                            </View>
                            
                            <View style={styles.formCardBody}>
                                {/* Hobbies */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Hobbies & Interests <Text style={styles.required}>*</Text></Text>
                                    <View style={styles.pillContainer}>
                                        {hobbiesOptions.map(hobby => (
                                            <TouchableOpacity
                                                key={hobby}
                                                style={[styles.pill, selectedHobbies.includes(hobby) && styles.pillActive]}
                                                onPress={() => toggleHobby(hobby)}
                                                disabled={data.is_completed}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.pillText, selectedHobbies.includes(hobby) && styles.pillTextActive]}>{hobby}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {selectedHobbies.includes('Other') && (
                                        <TextInput
                                            style={[styles.input, { marginTop: 12 }, focusedInput === 'otherHobby' && styles.inputFocused]}
                                            value={otherHobby}
                                            onChangeText={setOtherHobby}
                                            placeholder="Specify other hobbies..."
                                            placeholderTextColor="#94A3B8"
                                            editable={!data.is_completed}
                                            onFocus={() => setFocusedInput('otherHobby')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                    )}
                                </View>

                                {/* Personal Goals */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Personal Goals</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, focusedInput === 'personal_goals' && styles.inputFocused]}
                                        value={data.personal_goals}
                                        onChangeText={t => update('personal_goals', t)}
                                        placeholder="What are you working towards?"
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        editable={!data.is_completed}
                                        onFocus={() => setFocusedInput('personal_goals')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>

                                {/* Previous Experience */}
                                <View style={styles.formField}>
                                    <Text style={styles.fieldLabel}>Previous Experience <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, focusedInput === 'why_mindflow' && styles.inputFocused]}
                                        value={data.why_mindflow}
                                        onChangeText={t => update('why_mindflow', t)}
                                        placeholder="Have you done any mindfulness practices?"
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        editable={!data.is_completed}
                                        onFocus={() => setFocusedInput('why_mindflow')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Declaration Checkbox */}
                        <TouchableOpacity
                            style={[styles.checkboxContainer, declarationChecked && styles.checkboxChecked]}
                            onPress={() => setDeclarationChecked(!declarationChecked)}
                            disabled={data.is_completed}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, declarationChecked && styles.checkboxActive]}>
                                {declarationChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                I hereby confirm that all information provided above is true, accurate, and complete.
                            </Text>
                        </TouchableOpacity>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={save}
                            disabled={saving || !declarationChecked || data.is_completed}
                            style={[styles.saveButton, (saving || !declarationChecked || data.is_completed) && styles.saveButtonDisabled]}
                            activeOpacity={0.8}
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
                    themeColor={Colors.primary}
                    title="Profile Completed!"
                    message="Thank you for sharing your information. Your profile is now set up."
                    buttonText="Continue"
                    onClose={() => {
                        setShowSuccessModal(false);
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                        }
                    }}
                />

            </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8F9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerArea: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerTitleBlock: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    content: {
        padding: 16,
        paddingBottom: 60,
    },
    helpCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    helpCardIcon: {
        marginTop: 1,
    },
    helpCardContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1D4ED8',
        marginBottom: 3,
    },
    helpText: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 18,
    },
    
    // Grouped Card styles for Read Only & Forms
    groupedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    cardHeaderIconContainer: {
        backgroundColor: '#E6F4EA',
        padding: 8,
        borderRadius: 10,
    },
    cardHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    cardBody: {
        padding: 20,
    },
    infoField: {
        marginVertical: 4,
    },
    infoFieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    infoFieldValue: {
        fontSize: 15,
        color: '#2D3436',
        fontWeight: '600',
    },
    infoFieldValueText: {
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '500',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },

    // Form styling
    groupedFormCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EEF2F7',
    },
    formCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
        backgroundColor: '#FAFBFD',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    formCardIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E6F4EA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formCardHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    formCardHeaderSubtext: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    stepBadge: {
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stepBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    formCardBody: {
        padding: 16,
        paddingTop: 8,
    },
    formField: {
        marginTop: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 8,
        letterSpacing: 0.1,
    },
    required: {
        color: '#EF4444',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#2D3436',
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF',
    },
    textArea: {
        minHeight: 100,
        borderRadius: 14,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    pillActive: {
        backgroundColor: '#E6F4EA',
        borderColor: Colors.primary,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#334155',
    },
    pillTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },

    // Living situation selection
    selectionGroup: {
        gap: 10,
    },
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    selectRowActive: {
        backgroundColor: '#E6F4EA',
        borderColor: Colors.primary,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: Colors.primary,
    },
    radioInnerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    selectRowText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
        flex: 1,
    },
    selectRowTextActive: {
        color: '#1A1A2E',
        fontWeight: '700',
    },

    // Placeholder box when major is disabled
    placeholderBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 16,
        gap: 10,
    },
    placeholderText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
        flex: 1,
    },

    // Checkbox and submission
    checkboxContainer: {
        flexDirection: 'row',
        marginTop: 20,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    checkboxChecked: {
        borderColor: Colors.primary,
        backgroundColor: '#F8FAFC',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: '#1A1A2E',
        lineHeight: 18,
        fontWeight: '500',
    },
    saveButton: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
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

    readOnlyContainer: {
        width: '100%',
    },
    // Read only success banner
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4EA',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        gap: 12,
    },
    successBannerText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
});
