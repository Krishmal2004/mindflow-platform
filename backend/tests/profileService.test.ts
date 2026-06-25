import { createSupabaseMock } from './helpers/supabaseMock';

const supabaseMock = createSupabaseMock();
jest.mock('../src/config/supabase', () => ({ supabase: supabaseMock }));

import { ProfileService } from '../src/services/profileService';

describe('ProfileService.getAboutMe', () => {
    it('returns the about_me_profiles row, including is_completed', async () => {
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: { id: 'user-1', is_completed: true }, error: null }),
                }),
            }),
        }));

        const result = await new ProfileService().getAboutMe('user-1');

        expect(result).toEqual({ id: 'user-1', is_completed: true });
    });

    it('returns null when no row exists yet (PGRST116)', async () => {
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'no rows' } }),
                }),
            }),
        }));

        const result = await new ProfileService().getAboutMe('user-2');

        expect(result).toBeNull();
    });
});

describe('ProfileService.updateAboutMe', () => {
    it('only forwards allowlisted fields to the upsert', async () => {
        const upsert = jest.fn((_arg: Record<string, any>) => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'user-1' }, error: null }) }) }));
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({ upsert }));

        await new ProfileService().updateAboutMe('user-1', {
            education_level: 'Second Year',
            is_completed: true,
            not_a_real_field: 'should be dropped',
        });

        const upsertArg = upsert.mock.calls[0][0];
        expect(upsertArg.education_level).toBe('Second Year');
        expect(upsertArg.is_completed).toBe(true);
        expect(upsertArg.not_a_real_field).toBeUndefined();
    });
});
