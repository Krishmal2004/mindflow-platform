import React from 'react';
import { render } from '@testing-library/react-native';
import CompleteTaskScreen from '../CompleteTaskScreen';

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ reset: jest.fn() }),
    RouteProp: {},
    useRoute: () => ({
        params: {
            title: 'Great Job Today!',
            message: 'You have successfully done the Daily Task. See you tomorrow again!',
            isDaily: true,
        },
    }),
}));

describe('CompleteTaskScreen', () => {
    it('no longer renders the "Your Progress" section', async () => {
        const { queryByText, getByText } = await render(<CompleteTaskScreen />);

        expect(getByText('Great Job Today!')).toBeTruthy();
        expect(queryByText(/Your Progress/i)).toBeNull();
        expect(queryByText(/stats-chart|Stress Level|Mood Level|Sleep Quality|Relaxation Level/i)).toBeNull();
    });
});
