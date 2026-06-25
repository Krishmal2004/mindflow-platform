import { createSupabaseMock, mockResponse } from './helpers/supabaseMock';

const supabaseMock = createSupabaseMock();
jest.mock('../src/config/supabase', () => ({ supabase: supabaseMock }));

import { requireAuth, requireAdmin, AuthenticatedRequest } from '../src/middlewares/authMiddleware';

describe('requireAuth', () => {
    it('rejects requests without an Authorization header', async () => {
        const req: any = { headers: {} };
        const res = mockResponse();
        const next = jest.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an invalid token', async () => {
        supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
        const req: any = { headers: { authorization: 'Bearer bad-token' } };
        const res = mockResponse();
        const next = jest.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches the user and calls next on a valid token', async () => {
        supabaseMock.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-1', email: 'jane@example.com' } },
            error: null,
        });
        const req: any = { headers: { authorization: 'Bearer good-token' } };
        const res = mockResponse();
        const next = jest.fn();

        await requireAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect((req as AuthenticatedRequest).user).toEqual({ id: 'user-1', email: 'jane@example.com' });
    });
});

describe('requireAdmin', () => {
    it('returns 401 when no authenticated user is present', async () => {
        const req: any = {};
        const res = mockResponse();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when the user is not in the admins table', async () => {
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'not found' } }) }) }),
        }));
        const req: any = { user: { id: 'user-1' } };
        const res = mockResponse();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the user is an admin', async () => {
        (supabaseMock.from as jest.Mock).mockImplementation(() => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'user-1' }, error: null }) }) }),
        }));
        const req: any = { user: { id: 'user-1' } };
        const res = mockResponse();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
