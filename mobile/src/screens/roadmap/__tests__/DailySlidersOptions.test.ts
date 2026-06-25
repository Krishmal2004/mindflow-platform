import { PRACTICE_TYPES, INFLUENCING_FACTORS } from '../DailySlidersScreen';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

describe('Mindfulness Practice options', () => {
    it('offers "Physical Session" instead of "Breathing Exercise"', () => {
        expect(PRACTICE_TYPES).toContain('Physical Session');
        expect(PRACTICE_TYPES).not.toContain('Breathing Exercise');
    });
});

describe('Primary Influencing Factor categories', () => {
    it('collapses to exactly Education, Personal, and Environment', () => {
        expect(INFLUENCING_FACTORS.map((f) => f.label)).toEqual(['Education', 'Personal', 'Environment']);
    });

    it('no longer exposes the old 7-option categories', () => {
        const labels = INFLUENCING_FACTORS.map((f) => f.label);
        for (const removed of ['Academics', 'Social Interactions', 'Work/Career', 'Health & Vitality', 'Personal Care', 'Nothing Specific']) {
            expect(labels).not.toContain(removed);
        }
    });
});
