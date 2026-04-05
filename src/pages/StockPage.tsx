import { useState, useEffect } from 'react';
import { Database, Package, Plus, CheckCircle, AlertCircle, ClipboardList, Trash, Check } from 'lucide-react';
import { productApi, transactionApi } from '../lib/api';
import { SearchableSelect } from '../components/SearchableSelect';
import type { Products } from '../types';

interface StockPageProps {
    products: Products;
    onSuccess: () => void;
}

export function StockPage({ products, onSuccess }: StockPageProps) {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [accounts, setAccounts] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [productStockList, setProductStockList] = useState<{ id: string; accountData: string; createdAt: string }[]>([]);
    const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const productList = Object.values(products);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !accounts.trim()) {
            setMessage({ type: 'error', text: 'Pilih produk dan masukkan akun' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const accountList = accounts
            .split('\n')
            .map(a => a.trim())
            .filter(a => a.length > 0);

        try {
            const res = await productApi.addStock(selectedProduct, accountList);
            if (res.success) {
                setMessage({ type: 'success', text: `${accountList.length} stok berhasil ditambahkan!` });
                setAccounts('');
                onSuccess();
            } else {
                setMessage({ type: 'error', text: res.error || 'Gagal menambahkan stok' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setLoading(false);
        }
    };

    const selectedProductData = products[selectedProduct];
    const accountLines = accounts.split('\n').filter(a => a.trim().length > 0).length;

    useEffect(() => {
        async function fetchStock() {
            if (!selectedProduct) {
                setProductStockList([]);
                return;
            }
            setLoadingStock(true);
            try {
                const res = await productApi.getStockList(selectedProduct);
                if (res.success && res.data) {
                    setProductStockList(res.data);
                } else {
                    setProductStockList([]);
                }
            } catch (e) {
                setProductStockList([]);
            } finally {
                setLoadingStock(false);
            }
        }
        fetchStock();
    }, [selectedProduct]);

    const toggleStockSelection = (id: string) => {
        setSelectedStockIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            return [...prev, id];
        });
    };

    const selectAllStocks = () => {
        setSelectedStockIds(productStockList.map(s => s.id));
    };

    const clearSelection = () => {
        setSelectedStockIds([]);
    };

    const handleDeleteSelected = async () => {
        if (selectedStockIds.length === 0 || !selectedProduct) return;
        setActionLoading(true);
        setMessage(null);
        try {
            const res = await productApi.deleteStockByIds(selectedProduct, selectedStockIds);
            if (res.success) {
                setMessage({ type: 'success', text: `${selectedStockIds.length} stok berhasil dihapus.` });
                clearSelection();
                onSuccess();
                // refresh
                const list = await productApi.getStockList(selectedProduct);
                setProductStockList(list.success && list.data ? list.data : []);
            } else {
                setMessage({ type: 'error', text: res.error || 'Gagal menghapus stok' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkSoldSelected = async () => {
        if (selectedStockIds.length === 0 || !selectedProduct) return;
        setActionLoading(true);
        setMessage(null);
        try {
            // Generate a unique reference id to tie transaction and stock
            const reffId = `manual-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

            // Build transaction payload (userId 0 => system/fake transaction)
            const trxPayload = {
                userId: 0,
                productId: selectedProduct,
                productName: selectedProductData?.name || selectedProduct,
                quantity: selectedStockIds.length,
                price: selectedProductData?.price || 0,
                status: 'completed',
                paymentMethod: 'balance',
                snk: selectedProductData?.snk || '',
                reffId,
            };

            // Create transaction first
            const trxRes = await transactionApi.create(trxPayload);
            if (!trxRes.success) {
                setMessage({ type: 'error', text: trxRes.error || 'Gagal membuat transaksi' });
                return;
            }

            // Now mark the selected stocks as sold using the same reference id
            const markRes = await productApi.markStockSold(selectedProduct, selectedStockIds, reffId);
            if (markRes.success) {
                setMessage({ type: 'success', text: `${selectedStockIds.length} stok ditandai sebagai terjual.` });
                clearSelection();
                onSuccess();
                // refresh
                const list = await productApi.getStockList(selectedProduct);
                setProductStockList(list.success && list.data ? list.data : []);
            } else {
                setMessage({ type: 'error', text: markRes.error || 'Gagal menandai stok' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h1 className="section-title">
                <Database size={20} />
                Kelola Stok
            </h1>

            {message && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    fontSize: '13px',
                    animation: 'fadeInUp 0.2s ease',
                }}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="card">
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package size={14} />
                            Pilih Produk
                        </label>
                        <SearchableSelect
                            options={productList.map(p => ({
                                value: p.id,
                                label: p.name,
                                sublabel: `Stok: ${p.account.length} • Rp${p.price.toLocaleString('id-ID')}`,
                            }))}
                            value={selectedProduct}
                            onChange={(v) => setSelectedProduct(v as string)}
                            placeholder="Cari dan pilih produk..."
                        />
                    </div>

                    {selectedProductData && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: 'var(--primary-bg)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '16px',
                            animation: 'fadeIn 0.2s ease',
                        }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' }}>
                                    {selectedProductData.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                                    Stok saat ini: {selectedProductData.account.length}
                                </div>
                            </div>
                            <div style={{
                                fontSize: '15px',
                                fontWeight: '700',
                                color: 'var(--primary)',
                            }}>
                                Rp{selectedProductData.price.toLocaleString('id-ID')}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ClipboardList size={14} />
                                Daftar Akun
                            </span>
                            {accountLines > 0 && (
                                <span style={{
                                    fontSize: '11px',
                                    background: 'var(--success-bg)',
                                    color: 'var(--success)',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                }}>
                                    {accountLines} akun
                                </span>
                            )}
                        </label>
                        <textarea
                            className="input"
                            value={accounts}
                            onChange={(e) => setAccounts(e.target.value)}
                            placeholder="Masukkan akun (satu per baris)&#10;email1@gmail.com:password1&#10;email2@gmail.com:password2"
                            rows={6}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading || !selectedProduct || accountLines === 0}
                    >
                        {loading ? (
                            <div className="loader" style={{ width: '16px', height: '16px', margin: 0, borderWidth: '2px' }} />
                        ) : (
                            <>
                                <Plus size={14} />
                                Tambah {accountLines > 0 ? `${accountLines} ` : ''}Stok
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* NEW: Manage existing stocks */}
            {selectedProduct && (
                <div className="card">
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Package size={14} />
                                Stok Produk
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={selectAllStocks} disabled={loadingStock || productStockList.length===0}>Pilih Semua</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={clearSelection} disabled={loadingStock || selectedStockIds.length===0}>Bersihkan</button>
                            </div>
                        </label>

                        <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--gray-100)', marginTop: 8 }}>
                            {loadingStock ? (
                                <div style={{ padding: 16 }} className="loader" />
                            ) : productStockList.length === 0 ? (
                                <div style={{ padding: 12, color: 'var(--gray-400)' }}>Belum ada stok</div>
                            ) : (
                                productStockList.map((s) => (
                                    <div key={s.id} onClick={() => toggleStockSelection(s.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--gray-50)', fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedStockIds.includes(s.id)}
                                                onClick={(e) => { e.stopPropagation(); toggleStockSelection(s.id); }}
                                                onChange={() => { /* controlled via onClick */ }}
                                            />
                                            <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.accountData}</div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(s.createdAt).toLocaleString('id-ID')}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="button" className="btn btn-danger" onClick={handleDeleteSelected} disabled={actionLoading || selectedStockIds.length===0}>
                                {actionLoading ? <div className="loader" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <><Trash size={14}/> Hapus Terpilih</>}
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleMarkSoldSelected} disabled={actionLoading || selectedStockIds.length===0}>
                                {actionLoading ? <div className="loader" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <><Check size={14}/> Tandai Terjual</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
