import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { API_URL } from '../../config/api';
import { apiFetch, clearApiCache, getAuthToken } from '../../lib/apiClient';
import { Colors } from '../../constants/colors';
import { PopupModal } from '../../components/PopupModal';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PanelWave } from '../../components/PanelWave';
import { useConfirmExitOnBack } from '../../lib/useConfirmExitOnBack';
import {
    ABOUT_ME_ACCENT, ABOUT_ME_ACCENT_TINT, panelStyles,
    AboutMeData, EMPTY_ABOUT_ME_DATA,
    educationLevels, livingSituations, culturalBackgrounds, hobbiesOptions, faculties, facultyMajors,
} from './shared';

const AcademicIllustration = require('../../../assets/academic.png') as number;
const ProfileIllustration = require('../../../assets/profile.png') as number;
const GoalsIllustration = require('../../../assets/goals.png') as number;

// One themed illustration per wizard step, matching each section's topic.
const STEP_ILLUSTRATIONS = [AcademicIllustration, ProfileIllustration, GoalsIllustration];
const STEP_TITLES = ['ACADEMIC DETAILS', 'PERSONAL PROFILE', 'GOALS & HOBBIES'];
const TOTAL_STEPS = STEP_TITLES.length;

// 3-step wizard (Signup-style: illustration + one blue panel showing only the
// current step's fields) — Next validates the current step before advancing,
// so a required field can't be skipped; all data is only sent to the server
// once, from the Submit button on the final step (with the declaration checkbox).
export default function AboutMeQuestionnaireScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formStep, setFormStep] = useState(0);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const [data, setData] = useState<AboutMeData>(EMPTY_ABOUT_ME_DATA);
    const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
    const [otherHobby, setOtherHobby] = useState('');
    const [otherCultural, setOtherCultural] = useState('');

    // Validation/error popup — same PopupModal-driven pattern as the roadmap screens,
    // instead of the plain OS Alert.alert.
    const [popup, setPopup] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ visible: false, type: 'warning', title: '', message: '' });

    const showPopup = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setPopup({ visible: true, type, title, message, onConfirm });
    };

    const hidePopup = () => setPopup(prev => ({ ...prev, visible: false }));

    // Android hardware back would otherwise silently discard in-progress answers.
    const hasUnsavedProgress = JSON.stringify(data) !== JSON.stringify(EMPTY_ABOUT_ME_DATA) || selectedHobbies.length > 0;
    const exitWithoutSaving = useCallback(() => navigation.goBack(), [navigation]);
    useConfirmExitOnBack(hasUnsavedProgress, exitWithoutSaving);

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

    const fetchData = async () => {
        try {
            setLoading(true);
            const { ok, data: profile } = await apiFetch<Record<string, any>>('/api/profile/about-me');

            if (ok && profile) {
                if (profile.cultural_background && !culturalBackgrounds.includes(profile.cultural_background)) {
                    setOtherCultural(profile.cultural_background);
                }
                setData(prev => {
                    const merged: AboutMeData = {
                        ...prev,
                        ...profile,
                        age: profile.age ? Number(profile.age) : null,
                    };
                    // The DB row is created with NULL columns (signup trigger, before the
                    // user fills anything in), and `profile` above is an untyped API
                    // response — any not-yet-filled text field can come back as `null`,
                    // not `''`. Normalize those back to the empty string so every string
                    // field is always a real string, matching AboutMeData's type and
                    // keeping .trim()/TextInput usage below safe.
                    (Object.keys(EMPTY_ABOUT_ME_DATA) as (keyof AboutMeData)[]).forEach((key) => {
                        if (key === 'age' || key === 'is_completed') return;
                        if (merged[key] == null) {
                            (merged as any)[key] = '';
                        }
                    });
                    return merged;
                });
                if (profile.is_completed) setDeclarationChecked(true);
            }
        } catch (error) {
            console.log('Error fetching about me', error);
        } finally {
            setLoading(false);
        }
    };

    // Single source of truth for "is this step's required data filled in" — used both
    // to gray out Next/Submit live as the user types/selects, and (via validateStep
    // below) to surface a specific message if pressed anyway right as it goes invalid.
    const getStepError = (step: number): { title: string; message: string } | null => {
        if (step === 0) {
            if (!data.university_id.trim()) return { title: "Required Field", message: "Please enter your University ID." };
            if (!data.education_level) return { title: "Required Field", message: "Please select your Education Level." };
            if (!data.faculty) return { title: "Required Field", message: "Please select your Faculty." };
            if (!data.major_field_of_study) return { title: "Required Field", message: "Please select your Major." };
        } else if (step === 1) {
            if (!data.age || isNaN(data.age) || data.age <= 0 || data.age > 120) return { title: "Required Field", message: "Please enter a valid Age." };
            if (!data.living_situation) return { title: "Required Field", message: "Please select your Living Situation." };
            if (!data.family_background.trim()) return { title: "Required Field", message: "Please describe your Family Background." };
            if (!data.cultural_background) return { title: "Required Field", message: "Please select your Cultural Background." };
        } else if (step === 2) {
            if (selectedHobbies.length === 0) return { title: "Required Field", message: "Please select at least one Hobby." };
            if (!data.why_mindflow.trim()) return { title: "Required Field", message: "Please share your Previous Experience." };
            if (!declarationChecked) return { title: "Declaration Required", message: "Please confirm that your information is accurate before submitting." };
        }
        return null;
    };

    const isStepValid = (step: number): boolean => getStepError(step) === null;

    // Validates only the fields belonging to one wizard step, so Next can catch a
    // missing answer before moving on instead of only surfacing it at final submit.
    const validateStep = (step: number): boolean => {
        const error = getStepError(step);
        if (error) {
            showPopup('warning', error.title, error.message);
            return false;
        }
        return true;
    };

    const goNext = () => {
        if (!validateStep(formStep)) return;
        setFormStep(step => Math.min(step + 1, TOTAL_STEPS - 1));
    };

    const goBack = () => setFormStep(step => Math.max(step - 1, 0));

    // Single network call, fired only from Submit on the last step once the
    // declaration checkbox is agreed — every step's data goes up together.
    const save = async () => {
        if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;

        try {
            setSaving(true);
            const token = await getAuthToken();

            if (!token) {
                showPopup('error', 'Session Expired', 'Please login again to continue.', () => {
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                });
                return;
            }

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
                clearApiCache('/api/profile/about-me');
                setShowSuccessModal(true);
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update');
            }
        } catch (error: any) {
            showPopup('error', 'Error', error.message || 'Failed to submit. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const update = (key: keyof AboutMeData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const toggleHobby = (hobby: string) => {
        setSelectedHobbies(prev => prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]);
    };

    const goBackToPreviousScreen = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
    };

    if (loading) {
        return (
            <View style={panelStyles.loadingContainer}>
                <ActivityIndicator size="large" color={ABOUT_ME_ACCENT} />
            </View>
        );
    }

    return (
        <View style={panelStyles.container}>
            <StatusBar style="dark" />
            <ScreenHeader title="About Me" onBack={goBackToPreviousScreen} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[panelStyles.content, panelStyles.contentFullHeight, styles.content]}>
                    <View style={panelStyles.introWrap}>
                        <View style={styles.illustrationWrap}>
                            <Image source={STEP_ILLUSTRATIONS[formStep]} style={styles.wizardIllustration} resizeMode="contain" />
                        </View>

                        <View style={panelStyles.introPanel}>
                            <View style={styles.stepDots}>
                                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                    <View key={i} style={[styles.stepDot, formStep === i && styles.stepDotActive]} />
                                ))}
                            </View>
                            <Text style={panelStyles.introPanelTitle}>STEP {formStep + 1} OF {TOTAL_STEPS}</Text>
                            <Text style={panelStyles.introPanelSubtitle}>{STEP_TITLES[formStep]}</Text>

                            {formStep === 0 && (
                                <View style={styles.stepBody}>
                                    {/* University ID */}
                                    <View style={styles.formField}>
                                        <Text style={styles.fieldLabel}>University ID <Text style={styles.required}>*</Text></Text>
                                        <TextInput
                                            style={[styles.input, focusedInput === 'university_id' && styles.inputFocused]}
                                            value={data.university_id}
                                            onChangeText={t => update('university_id', t)}
                                            placeholder="Your official student ID"
                                            placeholderTextColor={Colors.textMuted}
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
                                                <Ionicons name="school-outline" size={20} color={Colors.textMuted} />
                                                <Text style={styles.placeholderText}>Please select a Faculty above first to choose a Major.</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {formStep === 1 && (
                                <View style={styles.stepBody}>
                                    {/* Age */}
                                    <View style={styles.formField}>
                                        <Text style={styles.fieldLabel}>Age <Text style={styles.required}>*</Text></Text>
                                        <TextInput
                                            style={[styles.input, { width: 100 }, focusedInput === 'age' && styles.inputFocused]}
                                            value={data.age?.toString() || ''}
                                            onChangeText={t => {
                                                // Strips non-digits before parsing so a stray character can't produce NaN and render back as the literal text "NaN".
                                                const digits = t.replace(/[^0-9]/g, '');
                                                update('age', digits ? parseInt(digits, 10) : null);
                                            }}
                                            placeholder="e.g. 21"
                                            placeholderTextColor={Colors.textMuted}
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
                                                placeholderTextColor={Colors.textMuted}
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
                                            placeholderTextColor={Colors.textMuted}
                                            multiline
                                            editable={!data.is_completed}
                                            onFocus={() => setFocusedInput('family_background')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                    </View>
                                </View>
                            )}

                            {formStep === 2 && (
                                <View style={styles.stepBody}>
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
                                                placeholderTextColor={Colors.textMuted}
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
                                            placeholderTextColor={Colors.textMuted}
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
                                            placeholderTextColor={Colors.textMuted}
                                            multiline
                                            editable={!data.is_completed}
                                            onFocus={() => setFocusedInput('why_mindflow')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                    </View>

                                    {/* Declaration Checkbox — only on the final step, right before Submit */}
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
                                </View>
                            )}

                            {/* Back / Next / Submit navigation */}
                            <View style={styles.navRow}>
                                {formStep > 0 && (
                                    <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
                                        <Ionicons name="arrow-back" size={18} color={ABOUT_ME_ACCENT} />
                                        <Text style={styles.backButtonText}>Back</Text>
                                    </TouchableOpacity>
                                )}
                                {formStep < TOTAL_STEPS - 1 ? (
                                    <TouchableOpacity
                                        style={[styles.nextButton, !isStepValid(formStep) && styles.nextButtonDisabled]}
                                        onPress={goNext}
                                        disabled={!isStepValid(formStep)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.nextButtonText}>Next</Text>
                                        <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={save}
                                        disabled={saving || data.is_completed || !isStepValid(2)}
                                        style={[styles.nextButton, (saving || data.is_completed || !isStepValid(2)) && styles.nextButtonDisabled]}
                                        activeOpacity={0.8}
                                    >
                                        {saving ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.nextButtonText}>Submit</Text>
                                                <Ionicons name="checkmark-done" size={18} color={Colors.surface} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            <PanelWave />
                        </View>
                    </View>

                    <PopupModal
                        visible={showSuccessModal}
                        type="success"
                        themeColor={ABOUT_ME_ACCENT}
                        title="Profile Completed!"
                        message="Thank you for sharing your information. Your profile is now set up."
                        buttonText="Continue"
                        onClose={() => {
                            setShowSuccessModal(false);
                            navigation.replace('AboutMeView');
                        }}
                    />

                    <PopupModal
                        visible={popup.visible}
                        type={popup.type}
                        themeColor={ABOUT_ME_ACCENT}
                        title={popup.title}
                        message={popup.message}
                        onClose={hidePopup}
                        onConfirm={popup.onConfirm}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Trims the gap between the (subtitle-less) header and the illustration —
    // panelStyles.content/introIllustrationWrap add top padding/margin meant
    // for the taller Front screen header, which is excessive here.
    content: {
        paddingTop: 0,
    },
    illustrationWrap: {
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 4,
    },
    wizardIllustration: {
        width: 180,
        height: 180,
    },
    stepDots: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#BFDBFE',
    },
    stepDotActive: {
        backgroundColor: ABOUT_ME_ACCENT,
        width: 20,
    },
    stepBody: {
        width: '100%',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        marginTop: 24,
        marginBottom: 40, 
        zIndex: 1, 
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: ABOUT_ME_ACCENT,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: ABOUT_ME_ACCENT,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 24,
        backgroundColor: ABOUT_ME_ACCENT,
        shadowColor: ABOUT_ME_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    nextButtonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.surface,
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
        borderColor: Colors.borderLight,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    inputFocused: {
        borderColor: ABOUT_ME_ACCENT,
        backgroundColor: Colors.surface,
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
        backgroundColor: Colors.surfaceMuted,
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
    },
    pillActive: {
        backgroundColor: ABOUT_ME_ACCENT_TINT,
        borderColor: ABOUT_ME_ACCENT,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#334155',
    },
    pillTextActive: {
        color: ABOUT_ME_ACCENT,
        fontWeight: '700',
    },
    selectionGroup: {
        gap: 10,
    },
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    selectRowActive: {
        backgroundColor: ABOUT_ME_ACCENT_TINT,
        borderColor: ABOUT_ME_ACCENT,
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
        borderColor: ABOUT_ME_ACCENT,
    },
    radioInnerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: ABOUT_ME_ACCENT,
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
    placeholderBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
        borderRadius: 14,
        padding: 16,
        gap: 10,
    },
    placeholderText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
        flex: 1,
    },
    checkboxContainer: {
        flexDirection: 'row',
        marginTop: 20,
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
        alignItems: 'center',
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    checkboxChecked: {
        borderColor: ABOUT_ME_ACCENT,
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
        backgroundColor: ABOUT_ME_ACCENT,
        borderColor: ABOUT_ME_ACCENT,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: '#1A1A2E',
        lineHeight: 18,
        fontWeight: '500',
    },
});
