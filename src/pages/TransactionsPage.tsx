import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Search, Calendar, CheckCircle, Clock3, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { transactionApi } from '../lib/api';
import type { Transaction } from '../types';

function formatRupiah(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function TransactionsPage() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [limit, setLimit] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (limit === 20) setLoading(true);
            else setLoadingMore(true);

            try {
                const res = await transactionApi.getAll(limit);
                if (res.success && res.data) {
                    setTransactions(res.data);
                    if (res.data.length < limit) {
                        setHasMore(false);
                    }
                } else {
                    setHasMore(false);
                }
            } catch (e) {
                console.error('Failed to fetch transactions:', e);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [limit]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !searchTerm) {
                    setLimit(prev => prev + 20);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading, loadingMore, searchTerm]);

    const normalizeSearchText = (value: unknown): string => String(value ?? '').toLowerCase();
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            normalizeSearchText(tx.productName).includes(normalizedSearchTerm) ||
            normalizeSearchText(tx.userId).includes(normalizedSearchTerm);
        const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const groupedByDate: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
        const date = new Date(tx.createdAt).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
        if (!groupedByDate[date]) groupedByDate[date] = [];
        groupedByDate[date].push(tx);
    });

    const handleClick = (tx: Transaction) => {
        navigate(`/trx?userId=${tx.userId}&ref_id=${tx.reffId}`);
    };

    if (loading && limit === 20) {
        return <div className="loader" style={{ marginTop: '100px' }} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 className="section-title">
                    <Receipt size={20} />
                    Transaksi
                    <span style={{
                        fontSize: '12px',
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600',
                    }}>
                        {transactions.length}{hasMore ? '+' : ''}
                    </span>
                </h1>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--gray-400)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        className="input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '38px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                {[
                    { value: 'all', label: 'Semua' },
                    { value: 'completed', label: 'Sukses' },
                    { value: 'pending', label: 'Pending' },
                ].map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value as any)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '16px',

                            background: statusFilter === filter.value ? 'var(--primary)' : 'var(--bg-elevated)',
                            color: statusFilter === filter.value ? 'white' : 'var(--gray-600)',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: statusFilter === filter.value ? 'none' : '1px solid var(--gray-100)',
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {Object.entries(groupedByDate).length === 0 ? (
                <div className="empty-state">
                    <Receipt size={40} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                    <p>{searchTerm ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}</p>
                </div>
            ) : (
                <>
                    {Object.entries(groupedByDate).map(([date, txs]) => (
                        <div key={date}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 0',
                                color: 'var(--gray-500)',
                                fontSize: '12px',
                                fontWeight: '500',
                            }}>
                                <Calendar size={14} />
                                {date}
                            </div>

                            <div style={{
                                background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--gray-100)',
                                overflow: 'hidden',
                            }}>
                                {txs.map((tx, i) => (
                                    <motion.div
                                        key={tx.reffId}
                                        onClick={() => handleClick(tx)}
                                        layout
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px',
                                            borderBottom: i < txs.length - 1 ? '1px solid var(--gray-50)' : 'none',
                                            cursor: 'pointer',
                                        }}
                                        className="hover-card"
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: tx.status === 'completed' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {tx.status === 'completed' ? (
                                                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                            ) : (
                                                <Clock3 size={18} style={{ color: 'var(--warning)' }} />
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: 'var(--gray-800)',
                                                marginBottom: '2px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {tx.productName}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'var(--gray-400)',
                                                display: 'flex',
                                                gap: '8px',
                                            }}>
                                                <span>{tx.userId}</span>
                                                <span>•</span>
                                                <span>{tx.quantity} pcs</span>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: 'var(--primary)',
                                                marginBottom: '2px',
                                            }}>
                                                {formatRupiah(tx.totalAmount)}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                                                {formatDate(tx.createdAt).split(',')[1]}
                                            </div>
                                        </div>

                                        <ArrowRight size={14} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {hasMore && !searchTerm && (
                        <div ref={observerTarget} style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: 'var(--gray-400)',
                            fontSize: '12px'
                        }}>
                            {loadingMore ? (
                                <div className="loader" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                            ) : (
                                <span>Scroll untuk memuat lebih banyak...</span>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
