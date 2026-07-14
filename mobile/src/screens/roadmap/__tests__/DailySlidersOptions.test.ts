import { PRACTICE_LOCATIONS, INFLUENCING_FACTORS } from '../DailySlidersScreen';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

describe('Mindfulness Practice location options', () => {
    it('offers exactly At University and Outside University', () => {
        expect(PRACTICE_LOCATIONS).toEqual(['At University', 'Outside University']);
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
