import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Package, Calendar, CreditCard, CheckCircle, Clock3, Copy, Hash, Wallet } from 'lucide-react';
import { transactionApi } from '../lib/api';
import type { Transaction } from '../types';

function formatRupiah(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function TransactionDetailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const userId = searchParams.get('userId');
    const refId = searchParams.get('ref_id');

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!userId || !refId) {
                setError('Parameter tidak lengkap');
                setLoading(false);
                return;
            }

            try {
                const res = await transactionApi.getByUser(userId);
                if (res.success && res.data) {
                    const tx = res.data.find(t => t.reffId === refId);
                    if (tx) {
                        setTransaction(tx);
                    } else {
                        setError('Transaksi tidak ditemukan');
                    }
                } else {
                    setError('Gagal memuat transaksi');
                }
            } catch (e) {
                setError('Terjadi kesalahan');
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [userId, refId]);

    const copyRefId = async () => {
        if (transaction?.reffId) {
            await navigator.clipboard.writeText(transaction.reffId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return <div className="loader" />;
    }

    if (error || !transaction) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(-1)}
                    style={{ alignSelf: 'flex-start' }}
                >
                    <ArrowLeft size={14} /> Kembali
                </button>
                <div className="empty-state">
                    <Package size={40} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                    <p>{error || 'Transaksi tidak ditemukan'}</p>
                </div>
            </div>
        );
    }

    const isCompleted = transaction.status === 'completed';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    className="btn-icon"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>
                        Detail Transaksi
                    </h1>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={10} />
                        {transaction.reffId.substring(0, 20)}...
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                background: isCompleted ? 'var(--success-bg)' : 'var(--warning-bg)',
                borderRadius: 'var(--radius)',
                animation: 'fadeInUp 0.3s ease',
            }}>
                {isCompleted ? (
                    <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                ) : (
                    <Clock3 size={24} style={{ color: 'var(--warning)' }} />
                )}
                <div>
                    <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: isCompleted ? 'var(--success)' : 'var(--warning)',
                    }}>
                        {isCompleted ? 'Transaksi Berhasil' : 'Menunggu Pembayaran'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                        {formatDate(transaction.createdAt)}
                    </div>
                </div>
            </div>

            <div className="card" style={{ animation: 'fadeInUp 0.3s ease 0.05s backwards' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'var(--primary-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Package size={20} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)' }}>
                            {transaction.productName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                            {transaction.quantity} x item
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--bg-container)',
                    borderRadius: 'var(--radius-sm)',
                }}>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Total Pembayaran</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
                        {formatRupiah(transaction.totalAmount)}
                    </span>
                </div>
            </div>

            <div className="card" style={{ animation: 'fadeInUp 0.3s ease 0.1s backwards' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '12px' }}>
                    INFORMASI TRANSAKSI
                </div>

                {[
                    { icon: User, label: 'User ID', value: transaction.userId },
                    { icon: CreditCard, label: 'Metode Pembayaran', value: transaction.paymentMethod },
                    { icon: Calendar, label: 'Tanggal', value: formatDate(transaction.createdAt) },
                ].map((item, i) => (
                    <div
                        key={item.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 0',
                            borderBottom: i < 2 ? '1px solid var(--gray-50)' : 'none',
                        }}
                    >
                        <item.icon size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{item.label}</div>
                            <div style={{ fontSize: '13px', color: 'var(--gray-800)', fontWeight: '500' }}>
                                {item.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ animation: 'fadeInUp 0.3s ease 0.15s backwards' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Reference ID</div>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--gray-700)',
                            fontFamily: 'var(--font-mono)',
                            wordBreak: 'break-all',
                        }}>
                            {transaction.reffId}
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={copyRefId}
                    >
                        <Copy size={12} />
                        {copied ? 'Tersalin!' : 'Copy'}
                    </button>
                </div>
            </div>

            {transaction.accountData && transaction.accountData.length > 0 && (
                <div className="card" style={{ animation: 'fadeInUp 0.3s ease 0.2s backwards' }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--gray-500)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <Wallet size={14} />
                        DATA AKUN
                    </div>
                    <div style={{
                        background: 'var(--bg-container)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--gray-800)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                    }}>
                        {transaction.accountData.join('\n')}
                    </div>
                </div>
            )}
        </div>
    );
}
