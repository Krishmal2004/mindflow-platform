/** Shared helpers for mocking the chainable supabase-js query builder in tests. */

export type MockResult = { data?: any; error?: any; count?: number };

const CHAIN_METHODS = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'gte', 'lte', 'not', 'order', 'limit'];

/** Builds a thenable chain that resolves to `result` however many methods are chained off it. */
export function chainable(result: MockResult) {
    const chain: any = {};
    for (const method of CHAIN_METHODS) {
        chain[method] = jest.fn(() => chain);
    }
    chain.single = jest.fn(() => Promise.resolve(result));
    chain.then = (onFulfilled: any, onRejected?: any) => Promise.resolve(result).then(onFulfilled, onRejected);
    chain.catch = (onRejected: any) => Promise.resolve(result).catch(onRejected);
    return chain;
}

/** A mock `supabase` client whose `.from(table)` result can be configured per table name. */
export function createSupabaseMock(tableResults: Record<string, MockResult> = {}) {
    return {
        from: jest.fn((table: string) => chainable(tableResults[table] ?? { data: null, error: null })),
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            verifyOtp: jest.fn(),
            resend: jest.fn(),
            resetPasswordForEmail: jest.fn(),
            getUser: jest.fn(),
        },
    };
}

export function mockResponse() {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}
