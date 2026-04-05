const API_BASE = '/api';

async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Network error' };
    }
}

export const authApi = {
    check: (password: string) =>
        fetchApi<{ valid: boolean }>('/auth/check', {
            method: 'POST',
            body: JSON.stringify({ password }),
        }),
};

export const botApi = {
    getData: () => fetchApi<any>('/bot'),
};

export const productApi = {
    create: (product: { id: string; name: string; price: number; desc: string; snk: string }) =>
        fetchApi<any>('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        }),
    update: (oldId: string, product: { id: string; name: string; price: number; desc: string; snk: string }) =>
        fetchApi<any>(`/products/${oldId}`, {
            method: 'PUT',
            body: JSON.stringify(product),
        }),
    delete: (id: string) =>
        fetchApi<any>(`/products/${id}`, { method: 'DELETE' }),
    addStock: (id: string, accounts: string[]) =>
        fetchApi<any>(`/products/${id}/stock`, {
            method: 'POST',
            body: JSON.stringify({ accounts }),
        }),
    // Delete by account list (backwards compatible) or use deleteStockByIds
    deleteStock: (id: string, accounts: string[]) =>
        fetchApi<any>(`/products/${id}/stock`, {
            method: 'DELETE',
            body: JSON.stringify({ accounts }),
        }),
    // New: fetch stock list for a product
    getStockList: (id: string) => fetchApi<any[]>(`/products/${id}/stock`),
    // New: mark selected stock items as sold
    markStockSold: (id: string, ids: string[], trxRefId?: string) =>
        fetchApi<any>(`/products/${id}/stock/mark-sold`, {
            method: 'POST',
            body: JSON.stringify({ ids, trxRefId }),
        }),
    // New: delete by array of ids
    deleteStockByIds: (id: string, ids: string[]) =>
        fetchApi<any>(`/products/${id}/stock`, {
            method: 'DELETE',
            body: JSON.stringify({ ids }),
        }),
};

export const transactionApi = {
    getRecent: (limit = 5) => fetchApi<any[]>(`/transactions?limit=${limit}`),
    getAll: (limit = 0) => fetchApi<any[]>(`/transactions?limit=${limit}`),
    getByUser: (userId: string, limit = 0) =>
        fetchApi<any[]>(`/transactions/user/${userId}?limit=${limit}`),
    getDetail: (refId: string) =>
        fetchApi<any>(`/transactions/ref/${encodeURIComponent(refId)}`),
    // Create a manual transaction (used by dashboard to mark stock as sold)
    create: (payload: { userId?: number | string; productId: string; productName: string; quantity: number; price: number; status?: string; paymentMethod?: string; snk?: string; reffId: string }) =>
        fetchApi<any>('/transactions', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
};

export const userApi = {
    getAll: () => fetchApi<any[]>('/users'),
    search: (userId: string) => fetchApi<any>(`/users/search/${userId}`),
    update: (userId: string, data: { name?: string; role?: string; balance?: number; username?: string }) =>
        fetchApi<any>(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

export const categoryApi = {
    create: (title: string, productIds: string[]) =>
        fetchApi<any>('/product-view', {
            method: 'POST',
            body: JSON.stringify({ title, productIds }),
        }),
    delete: (title: string) =>
        fetchApi<any>(`/product-view/${encodeURIComponent(title)}`, { method: 'DELETE' }),
    removeProduct: (title: string, productId: string) =>
        fetchApi<any>(`/product-view/${encodeURIComponent(title)}/products/${productId}`, {
            method: 'DELETE',
        }),
};

export const statsApi = {
    get: () => fetchApi<any>('/stats'),
};
