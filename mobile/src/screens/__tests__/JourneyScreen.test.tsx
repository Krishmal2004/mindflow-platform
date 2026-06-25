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
        { id: 1, created_at: '2026-02-01T10:00:00.000Z' },
        { id: 2, created_at: '2026-01-25T10:00:00.000Z' },
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

describe('JourneyScreen Surveys tab', () => {
    it('shows submission-count summaries instead of a per-submission list', async () => {
        const { getByText, getAllByText, getByTestId } = await render(<JourneyScreen />);

        await waitFor(() => expect(mockedApiFetch).toHaveBeenCalled());
        fireEvent.press(getByTestId('journey-tab-questionnaire'));

        await waitFor(() => expect(getByText('Perceived Stress Scale (PSS-10)')).toBeTruthy());
        expect(getByText('1 submission')).toBeTruthy();
        expect(getAllByText('No submissions yet').length).toBe(2); // FFMQ-15 and WEMWBS-14
    });

    it('shows a Weekly Whispers recording summary card alongside the questionnaires', async () => {
        const { getByText, getByTestId } = await render(<JourneyScreen />);

        await waitFor(() => expect(mockedApiFetch).toHaveBeenCalled());
        fireEvent.press(getByTestId('journey-tab-questionnaire'));

        await waitFor(() => expect(getByText('Weekly Whispers')).toBeTruthy());
        expect(getByText('2 submissions')).toBeTruthy();
    });
});
