import { createSupabaseMock, mockResponse } from './helpers/supabaseMock';

const supabaseMock = createSupabaseMock();
jest.mock('../src/config/supabase', () => ({ supabase: supabaseMock }));

import { signup, login } from '../src/controllers/authController';

describe('signup', () => {
    it('rejects invalid input before calling supabase', async () => {
        const req: any = { body: { email: 'not-an-email', password: 'short' } };
        const res = mockResponse();

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
    });

    it('creates a profile row using full_name as the username when provided', async () => {
        supabaseMock.auth.signUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
        const upsert = jest.fn(() => ({ error: null }));
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({ upsert }));

        const req: any = { body: { email: 'jane@example.com', password: 'password123', full_name: 'Jane Doe' } };
        const res = mockResponse();

        await signup(req, res);

        expect(supabaseMock.from).toHaveBeenCalledWith('profiles');
        expect(upsert).toHaveBeenCalledWith({ id: 'user-1', username: 'Jane Doe' });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('still creates a profile row with a derived username when full_name is omitted', async () => {
        supabaseMock.auth.signUp.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null });
        const upsert = jest.fn(() => ({ error: null }));
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({ upsert }));

        const req: any = { body: { email: 'bob@example.com', password: 'password123' } };
        const res = mockResponse();

        await signup(req, res);

        expect(upsert).toHaveBeenCalledWith({ id: 'user-2', username: 'Bob' });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('logs but does not fail signup when the profile upsert errors', async () => {
        supabaseMock.auth.signUp.mockResolvedValue({ data: { user: { id: 'user-3' } }, error: null });
        const upsert = jest.fn(() => ({ error: { message: 'duplicate username' } }));
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({ upsert }));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const req: any = { body: { email: 'carl@example.com', password: 'password123' } };
        const res = mockResponse();

        await signup(req, res);

        expect(consoleSpy).toHaveBeenCalledWith('Signup profile upsert error:', 'duplicate username');
        expect(res.status).toHaveBeenCalledWith(201);
        consoleSpy.mockRestore();
    });

    it('returns 500 when supabase auth signUp errors', async () => {
        supabaseMock.auth.signUp.mockResolvedValue({ data: {}, error: { message: 'email already registered' } });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const req: any = { body: { email: 'dup@example.com', password: 'password123' } };
        const res = mockResponse();

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        consoleSpy.mockRestore();
    });
});

describe('login', () => {
    it('returns the stored username as display_name when a profile exists', async () => {
        supabaseMock.auth.signInWithPassword.mockResolvedValue({
            data: { user: { id: 'user-1', user_metadata: {} }, session: { access_token: 'tok' } },
            error: null,
        });
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { username: 'Jane Doe' } }) }) }),
        }));

        const req: any = { body: { email: 'jane@example.com', password: 'password123' } };
        const res = mockResponse();

        await login(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ user: expect.objectContaining({ display_name: 'Jane Doe' }) })
        );
    });

    it('falls back to a derived display name when no profile username exists', async () => {
        supabaseMock.auth.signInWithPassword.mockResolvedValue({
            data: { user: { id: 'user-2', user_metadata: {} }, session: { access_token: 'tok' } },
            error: null,
        });
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
        }));

        const req: any = { body: { email: 'bob@example.com', password: 'password123' } };
        const res = mockResponse();

        await login(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ user: expect.objectContaining({ display_name: 'Bob' }) })
        );
    });

    it('returns 403 when the email is not confirmed', async () => {
        supabaseMock.auth.signInWithPassword.mockResolvedValue({
            data: {},
            error: { message: 'Email not confirmed' },
        });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const req: any = { body: { email: 'unverified@example.com', password: 'password123' } };
        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        consoleSpy.mockRestore();
    });

    it('returns 401 for invalid credentials', async () => {
        supabaseMock.auth.signInWithPassword.mockResolvedValue({
            data: {},
            error: { message: 'Invalid login credentials' },
        });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const req: any = { body: { email: 'jane@example.com', password: 'wrong' } };
        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        consoleSpy.mockRestore();
    });
});
