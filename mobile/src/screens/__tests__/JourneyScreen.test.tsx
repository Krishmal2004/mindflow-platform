import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import JourneyScreen from '../JourneyScreen';
import { apiFetch } from '../../lib/apiClient';

jest.mock('@react-navigation/native', () => ({
    useFocusEffect: (callback: () => void) => {
        const React = require('react');
        React.useEffect(callback, []);
    },
}));

jest.mock('../../lib/apiClient', () => ({
    apiFetch: jest.fn(),
    clearApiCache: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;

const journeyData = {
    daily: [],
    weekly: [
        { week_number: 5, year: 2026, created_at: '2026-02-01T10:00:00.000Z' },
        { week_number: 4, year: 2026, created_at: '2026-01-25T10:00:00.000Z' },
    ],
    research: {
        pss10: [{ id: 1, created_at: '2026-01-10T10:00:00.000Z' }],
        ffmq15: [],
        wemwbs14: [],
    },
};

beforeEach(() => {
    mockedApiFetch.mockResolvedValue({ ok: true, status: 200, data: journeyData });
});

describe('JourneyScreen Weekly tab', () => {
    it('shows a summary card with the entry count and latest week instead of a per-entry list', async () => {
        const { getByText, queryByText } = await render(<JourneyScreen />);

        await waitFor(() => expect(mockedApiFetch).toHaveBeenCalled());
        fireEvent.press(getByText('Weekly'));

        await waitFor(() => expect(getByText('2 submissions')).toBeTruthy());
        expect(getByText(/Week 5, 2026/)).toBeTruthy();
        // No long per-entry list — the older week should not appear as its own row
        expect(queryByText(/Week 4, 2026/)).toBeNull();
    });
});

describe('JourneyScreen Surveys tab', () => {
    it('shows submission-count summaries instead of a per-submission list', async () => {
        const { getByText, getAllByText } = await render(<JourneyScreen />);

        await waitFor(() => expect(mockedApiFetch).toHaveBeenCalled());
        fireEvent.press(getByText('Surveys'));

        await waitFor(() => expect(getByText('Perceived Stress Scale (PSS-10)')).toBeTruthy());
        expect(getByText('1 submission')).toBeTruthy();
        expect(getAllByText('No submissions yet').length).toBe(2); // FFMQ-15 and WEMWBS-14
    });
});
