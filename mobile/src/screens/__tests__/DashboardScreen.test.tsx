import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';
import { apiFetch } from '../../lib/apiClient';

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (callback: () => void) => {
        const React = require('react');
        React.useEffect(callback, []);
    },
}));

jest.mock('../../lib/apiClient', () => ({ apiFetch: jest.fn() }));
jest.mock('../../lib/notifications', () => ({ registerForPushNotificationsAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockedApiFetch = apiFetch as jest.Mock;

function mockApi(group: string) {
    mockedApiFetch.mockImplementation((path: string) => {
        if (path.includes('/api/dashboard/summary')) {
            return Promise.resolve({ ok: true, status: 200, data: { group } });
        }
        return Promise.resolve({ ok: true, status: 200, data: {} });
    });
}

describe('DashboardScreen mindfulness quotes visibility', () => {
    it('hides the mindfulness quotes card for the control group (.cg)', async () => {
        mockApi('cg');
        const { queryByText } = await render(<DashboardScreen />);

        await waitFor(() => expect(mockedApiFetch).toHaveBeenCalled());
        await waitFor(() => expect(queryByText(/Breathe in peace/i)).toBeNull());
    });

    it('shows a non-mindfulness fun fact card for the control group (.cg)', async () => {
        mockApi('cg');
        const { findByText } = await render(<DashboardScreen />);

        expect(await findByText(/Honey never spoils/i)).toBeTruthy();
    });

    it('shows the mindfulness quotes card for the experimental group (.ex)', async () => {
        mockApi('ex');
        const { findByText } = await render(<DashboardScreen />);

        expect(await findByText(/Breathe in peace/i)).toBeTruthy();
    });

    it('shows the mindfulness quotes card by default when no group is assigned', async () => {
        mockApi('');
        const { findByText } = await render(<DashboardScreen />);

        expect(await findByText(/Breathe in peace/i)).toBeTruthy();
    });

    it('never renders the removed Breathing Exercise / Yoga cards', async () => {
        mockApi('ex');
        const { queryByText } = await render(<DashboardScreen />);

        await waitFor(() => expect(mockedApiFetch).toHaveBeenCalled());
        expect(queryByText('MEDITATION')).toBeNull();
        expect(queryByText('YOGA')).toBeNull();
    });
});
