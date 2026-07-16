import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { cardShadow } from '../../styles/shared';

// Light blue identity for the whole About Me flow (matches the intro/wizard
// panel's #E3F2FD tone) instead of the app's default sage green.
export const ABOUT_ME_ACCENT = '#3B82F6';
export const ABOUT_ME_ACCENT_TINT = '#E8F1FE';
export const ABOUT_ME_PANEL_BG = '#E3F2FD';

export interface AboutMeData {
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

export const EMPTY_ABOUT_ME_DATA: AboutMeData = {
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
};

export const educationLevels = ["First Year", "Second Year", "Third Year", "Fourth Year", "Graduate Student", "Other"];

export const livingSituations = [
    "Living at Home (Commuting)",
    "University Hostel / Dormitory",
    "Private Boarding / Room Rentals",
    "Private Apartment / Studio Living",
    "Living with Relatives (Guardian Setup)"
];

export const culturalBackgrounds = ["Buddhism", "Islam", "Hindu", "Christian", "Other"];

export const hobbiesOptions = [
    "Reading", "Sports & Fitness", "Music", "Travel", "Cooking & Baking",
    "Video Gaming", "Art & Crafts", "Hiking & Outdoors", "Watching Movies/TV", "Photography", "Other"
];

export const faculties = [
    "Faculty of Computing",
    "Faculty of Engineering",
    "SLIIT Business School",
    "Faculty of Humanities & Sciences",
    "School of Architecture"
];

export const facultyMajors: Record<string, string[]> = {
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

// Shared "Signup-style" shell — hero illustration above a rounded blue panel —
// reused by both AboutMe-Front (info + Fill Form CTA) and AboutMe-Questionnaire
// (the step wizard), so the two screens read as one continuous flow.
export const panelStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
        paddingBottom: 60,
    },
    // Makes the scroll content fill at least the full viewport height so
    // introWrap/introPanel's flex: 1 has something to grow into — otherwise
    // the panel would only be as tall as its own content.
    contentFullHeight: {
        flexGrow: 1,
        paddingBottom: 0,
    },
    introWrap: {
        flex: 1,
        marginHorizontal: -16, // bleeds the panel to the screen edges like Signup's bottomPanel
        alignItems: 'center',
    },
    introIllustrationWrap: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    introPanel: {
        flex: 1, // stretches the panel down to the bottom of the screen
        backgroundColor: ABOUT_ME_PANEL_BG,
        width: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 24,
        paddingBottom: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 6,
    },
    introPanelTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 2,
        marginBottom: 2,
    },
    introPanelSubtitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        letterSpacing: 1,
        marginBottom: 20,
    },
    introCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        width: '100%',
        marginBottom: 20,
        ...cardShadow,
    },
});
