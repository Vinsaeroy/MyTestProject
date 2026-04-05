import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp, Edit, Receipt, Copy, Search } from 'lucide-react';
import { userApi, transactionApi } from '../lib/api';
import { BottomSheet } from '../components/BottomSheet';
import { SearchableSelect } from '../components/SearchableSelect';
import type { User, Transaction } from '../types';

function formatRupiah(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

function normalizeRole(roleInput: unknown): 'member' | 'vip' | 'admin' {
    const value = String(roleInput ?? '').trim().toLowerCase();

    if (['admin', 'administrator', 'owner', 'superadmin', 'super_admin'].includes(value)) {
        return 'admin';
    }

    if (['vip', 'premium', 'gold'].includes(value)) {
        return 'vip';
    }

    return 'member';
}

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [userTransactions, setUserTransactions] = useState<Record<string, Transaction[]>>({});
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: '', balance: '', username: '' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await userApi.getAll();
                if (res.success && res.data) {
                    setUsers(res.data);
                }
            } catch (e) {
                console.error('Failed to fetch users:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const toggleUser = async (userId: string) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
        } else {
            setExpandedUser(userId);
            if (!userTransactions[userId]) {
                try {
                    const res = await transactionApi.getByUser(userId);
                    if (res.success && res.data) {
                        setUserTransactions(prev => ({ ...prev, [userId]: res.data as Transaction[] }));
                    }
                } catch (e) {
                    console.error('Failed to fetch user transactions:', e);
                }
            }
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name || '',
            role: normalizeRole(user.role),
            balance: user.balance?.toString() || '0',
            username: (user as any).username || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        const editingUserId = String(editingUser.id ?? '');
        if (!editingUserId) return;

        const normalizedRole = normalizeRole(editForm.role);
        const nextBalance = parseInt(editForm.balance, 10) || 0;

        const res = await userApi.update(editingUserId, {
            name: editForm.name.trim(),
            role: normalizedRole,
            balance: nextBalance,
            username: editForm.username.trim() || undefined,
        });

        if (res.success) {
            const serverUser = res.data as Partial<User> & { username?: string };

            setUsers(prev => prev.map(u => {
                if (String(u.id ?? '') !== editingUserId) {
                    return u;
                }

                return {
                    ...u,
                    ...(serverUser || {}),
                    role: normalizeRole(serverUser?.role ?? normalizedRole),
                    balance: Number(serverUser?.balance ?? nextBalance),
                    username: (serverUser?.username ?? editForm.username.trim()) || undefined,
                };
            }));
            setEditingUser(null);
            return;
        }

        alert(res.error || 'Gagal menyimpan perubahan user.');
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    const normalizeSearchText = (value: unknown): string => String(value ?? '').toLowerCase();
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredUsers = users.filter((user) => {
        const userName = normalizeSearchText(user.name);
        const userId = normalizeSearchText(user.id);
        const username = normalizeSearchText((user as any).username);

        return (
            userName.includes(normalizedSearchTerm) ||
            userId.includes(normalizedSearchTerm) ||
            username.includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return <div className="loader" />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 className="section-title">
                    <Users size={20} />
                    Users
                    <span style={{
                        fontSize: '12px',
                        background: 'var(--primary-bg)',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600',
                    }}>
                        {users.length}
                    </span>
                </h1>
            </div>

            <div style={{ position: 'relative' }}>
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
                    placeholder="Cari user..."
                    className="input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                />
            </div>

            {filteredUsers.length === 0 ? (
                <div className="empty-state">
                    <Users size={40} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                    <p>{searchTerm ? 'User tidak ditemukan' : 'Belum ada user'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredUsers.map((user, i) => {
                        const userId = String(user.id ?? '');
                        const displayName = String(user.name ?? '').trim();
                        const avatarLabel = (displayName || userId || '?').charAt(0).toUpperCase();
                        const userRole = normalizeRole(user.role);

                        return (
                            <div
                                key={userId || `user-${i}`}
                                className="card"
                                style={{
                                    padding: 0,
                                    overflow: 'hidden',
                                    animation: `fadeInUp 0.3s ease ${i * 0.02}s backwards`,
                                }}
                            >
                                <div
                                    onClick={() => userId && toggleUser(userId)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        flexShrink: 0,
                                    }}>
                                        {avatarLabel}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: 'var(--gray-800)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}>
                                            {displayName || 'Unnamed'}
                                            {userRole === 'vip' && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    background: 'var(--warning-bg)',
                                                    color: 'var(--warning)',
                                                    padding: '1px 5px',
                                                    borderRadius: '4px',
                                                }}>VIP</span>
                                            )}
                                            {userRole === 'admin' && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    background: 'var(--danger-bg)',
                                                    color: 'var(--danger)',
                                                    padding: '1px 5px',
                                                    borderRadius: '4px',
                                                }}>Admin</span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'var(--gray-400)',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {userId || '-'} {user?.username ? `• @${user.username}` : ''}
                                        </div>
                                    </div>

                                    <div style={{
                                        textAlign: 'right',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}>
                                        <div>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: 'var(--success)',
                                            }}>
                                                {formatRupiah(user.balance || 0)}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                                                Saldo
                                            </div>
                                        </div>
                                        {expandedUser === userId ? (
                                            <ChevronUp size={16} style={{ color: 'var(--gray-400)' }} />
                                        ) : (
                                            <ChevronDown size={16} style={{ color: 'var(--gray-400)' }} />
                                        )}
                                    </div>
                                </div>

                                {expandedUser === userId && (
                                    <div style={{
                                        padding: '12px',
                                        borderTop: '1px solid var(--gray-100)',
                                        background: 'var(--bg-container)',
                                        animation: 'fadeIn 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => copyToClipboard(userId)}
                                            >
                                                <Copy size={12} /> Copy ID
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Edit size={12} /> Edit
                                            </button>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                        }}>
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: 'var(--gray-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                <Receipt size={14} /> Riwayat Transaksi
                                            </span>
                                            {userTransactions[userId] && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    background: 'var(--gray-100)',
                                                    padding: '2px 6px',
                                                    borderRadius: '8px',
                                                    color: 'var(--gray-500)',
                                                }}>
                                                    {userTransactions[userId].length}
                                                </span>
                                            )}
                                        </div>

                                        {userTransactions[userId] ? (
                                            userTransactions[userId].length > 0 ? (
                                                <div style={{
                                                    maxHeight: '180px',
                                                    overflowY: 'auto',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--gray-100)',
                                                }}>
                                                    {userTransactions[userId].slice(0, 10).map((tx, idx) => (
                                                        <div
                                                            key={tx.reffId}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '10px 12px',
                                                                background: idx % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-container)',
                                                                borderBottom: idx < userTransactions[userId].length - 1 ? '1px solid var(--gray-50)' : 'none',
                                                            }}
                                                        >
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-800)' }}>
                                                                    {tx.productName}
                                                                </div>
                                                                <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                                                                    {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>
                                                                    {formatRupiah(tx.totalAmount)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    color: 'var(--gray-400)',
                                                    fontSize: '12px',
                                                    background: 'var(--bg-elevated)',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}>
                                                    Belum ada transaksi
                                                </div>
                                            )
                                        ) : (
                                            <div style={{
                                                padding: '16px',
                                                textAlign: 'center',
                                            }}>
                                                <div className="loader" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <BottomSheet
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title="Edit User"
            >
                <div className="form-group">
                    <label>User ID</label>
                    <input
                        type="text"
                        className="input"
                        value={editingUser?.id || ''}
                        disabled
                        style={{ background: 'var(--gray-100)', color: 'var(--gray-500)' }}
                    />
                </div>

                <div className="form-group">
                    <label>Nama</label>
                    <input
                        type="text"
                        className="input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Masukkan nama"
                    />
                </div>

                <div className="form-group">
                    <label>Role</label>
                    <SearchableSelect
                        options={[
                            { value: 'member', label: 'Member', sublabel: 'User biasa' },
                            { value: 'vip', label: 'VIP', sublabel: 'User premium' },
                            { value: 'admin', label: 'Admin', sublabel: 'Administrator' },
                        ]}
                        value={editForm.role}
                        onChange={(val) => setEditForm({ ...editForm, role: normalizeRole(val as string) })}
                        placeholder="Pilih role..."
                        searchable={false}
                    />
                </div>

                <div className="form-group">
                    <label>Saldo</label>
                    <input
                        type="number"
                        className="input"
                        value={editForm.balance}
                        onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                        placeholder="0"
                    />
                </div>

                <div className="form-group">
                    <label>Username Telegram</label>
                    <input
                        type="text"
                        className="input"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="@username"
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setEditingUser(null)}
                    >
                        Batal
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleSaveEdit}
                    >
                        Simpan
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
}
