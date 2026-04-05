import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wallet, Package, ArrowRight, CheckCircle, Clock3, Users } from 'lucide-react';
import type { Stats, Transaction, Products } from '../types';

interface OverviewPageProps {
    stats: Stats | null;
    recentTransactions: Transaction[];
    products: Products;
    loading: boolean;
}

function formatRupiah(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

function formatCompactNumber(number: number): string {
    return new Intl.NumberFormat('id-ID', {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1
    }).format(number);
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
}

export function OverviewPage({ stats, recentTransactions, products, loading }: OverviewPageProps) {
    const navigate = useNavigate();

    const handleTransactionClick = (tx: Transaction) => {
        navigate(`/trx?userId=${tx.userId}&ref_id=${tx.reffId}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <Package size={18} />
                    </div>
                    <div className="stat-info">
                        <h3>Penjualan</h3>
                        <p>{loading ? '...' : `${formatCompactNumber(stats?.totalPcs || 0)} pcs`}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success">
                        <Wallet size={18} />
                    </div>
                    <div className="stat-info">
                        <h3>Pendapatan</h3>
                        <p>{loading ? '...' : `Rp${formatCompactNumber(stats?.totalPendapatan || 0)}`}</p>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
            }}>
                {[
                    { icon: Package, label: 'Produk', path: '/products', color: '#1677ff' },
                    { icon: TrendingUp, label: 'Transaksi', path: '/transactions', color: '#52c41a' },
                    { icon: Wallet, label: 'Stok', path: '/stock', color: '#faad14' },
                    { icon: Users, label: 'Users', path: '/users', color: '#722ed1' },
                ].map((item, i) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '12px 8px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--gray-100)',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            animation: `fadeInUp 0.3s ease ${i * 0.05}s backwards`,
                        }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: `${item.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.color,
                        }}>
                            <item.icon size={18} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--gray-600)', fontWeight: '500' }}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">
                        <TrendingUp size={18} />
                        Transaksi Terbaru
                    </h2>
                    <button
                        className="btn btn-link"
                        onClick={() => navigate('/transactions')}
                    >
                        Semua <ArrowRight size={12} />
                    </button>
                </div>

                {loading ? (
                    <div className="loader" />
                ) : recentTransactions.length === 0 ? (
                    <div className="empty-state">
                        <TrendingUp size={32} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                        <p>Belum ada transaksi</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {recentTransactions.slice(0, 5).map((tx, i) => (
                            <div
                                key={tx.reffId}
                                onClick={() => handleTransactionClick(tx)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    background: 'var(--bg-container)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    animation: `fadeInUp 0.3s ease ${i * 0.05}s backwards`,
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: tx.status === 'completed' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {tx.status === 'completed' ? (
                                        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                    ) : (
                                        <Clock3 size={16} style={{ color: 'var(--warning)' }} />
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        color: 'var(--gray-800)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {tx.productName}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                                        {formatTimeAgo(tx.createdAt)}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: 'var(--primary)',
                                    flexShrink: 0,
                                }}>
                                    {formatRupiah(tx.totalAmount)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">
                        <Package size={18} />
                        Produk
                    </h2>
                    <button
                        className="btn btn-link"
                        onClick={() => navigate('/products')}
                    >
                        Lihat <ArrowRight size={12} />
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--primary-bg)',
                    borderRadius: 'var(--radius)',
                }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
                            {Object.keys(products).length}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                            Total Produk
                        </div>
                    </div>
                    <Package size={40} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                </div>
            </div>
        </div>
    );
}
