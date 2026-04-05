import { useState, useEffect, useCallback } from 'react';
import { botApi, statsApi, transactionApi, userApi } from '../lib/api';
import type { Products, ProductViews, Stats, Transaction, User } from '../types';

interface DashboardData {
    products: Products;
    productViews: ProductViews;
    stats: Stats | null;
    recentTransactions: Transaction[];
    users: User[];
    loading: boolean;
    error: string | null;
}

export function useDashboard() {
    const [data, setData] = useState<DashboardData>({
        products: {},
        productViews: {},
        stats: null,
        recentTransactions: [],
        users: [],
        loading: true,
        error: null,
    });

    const fetchData = useCallback(async () => {
        setData(prev => ({ ...prev, loading: true, error: null }));

        try {
            const botRes = await botApi.getData();
            if (botRes.success && botRes.data) {
                setData(prev => ({
                    ...prev,
                    products: botRes.data.product || {},
                    productViews: botRes.data.product_view || {},
                }));
            }

            const statsRes = await statsApi.get();
            if (statsRes.success && statsRes.data) {
                setData(prev => ({ ...prev, stats: statsRes.data }));
            }

            const txRes = await transactionApi.getRecent(5);
            if (txRes.success && txRes.data) {
                setData(prev => ({ ...prev, recentTransactions: txRes.data || [] }));
            }

            const usersRes = await userApi.getAll();
            if (usersRes.success && usersRes.data) {
                setData(prev => ({ ...prev, users: usersRes.data || [] }));
            }

            setData(prev => ({ ...prev, loading: false }));
        } catch (error) {
            setData(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to fetch data'
            }));
        }
    }, []);

    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { ...data, refetch };
}
