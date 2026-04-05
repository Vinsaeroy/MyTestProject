import { useState, useMemo } from 'react';
import { Folder, Plus, Edit, Trash2, CheckCircle, AlertCircle, Package, GripVertical } from 'lucide-react';
import { categoryApi } from '../lib/api';
import { SearchableSelect } from '../components/SearchableSelect';
import { BottomSheet } from '../components/BottomSheet';
import type { Products, ProductViews } from '../types';

interface CategoriesPageProps {
    products: Products;
    productViews: ProductViews;
    onSuccess: () => void;
}

export function CategoriesPage({ products, productViews, onSuccess }: CategoriesPageProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ category: string; products: string[] } | null>(null);
    const [form, setForm] = useState({ category: '', products: [] as string[] });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const productList = Object.values(products);

    const categoriesList = useMemo(() => {
        return Object.entries(productViews).map(([category, view]) => ({
            category,
            products: view.id
        }));
    }, [productViews]);

    const handleSubmit = async () => {
        if (!form.category.trim()) {
            setMessage({ type: 'error', text: 'Nama kategori wajib diisi' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            let success = false;
            let errorMsg = '';

            if (editingCategory && editingCategory.category !== form.category) {
                await categoryApi.delete(editingCategory.category);
            }

            const res = await categoryApi.create(form.category, form.products);

            if (res.success) {
                success = true;
            } else {
                errorMsg = res.error || 'Gagal menyimpan kategori';
            }

            if (success) {
                setMessage({ type: 'success', text: editingCategory ? 'Kategori berhasil diperbarui!' : 'Kategori berhasil ditambahkan!' });
                setForm({ category: '', products: [] });
                setShowForm(false);
                setEditingCategory(null);
                onSuccess();
            } else {
                setMessage({ type: 'error', text: errorMsg });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (view: { category: string; products: string[] }) => {
        setEditingCategory(view);
        setForm({ category: view.category, products: view.products });
        setShowForm(true);
    };

    const handleDelete = async (category: string) => {
        if (!confirm(`Hapus kategori "${category}"?`)) return;

        setLoading(true);
        try {
            const res = await categoryApi.delete(category);
            if (res.success) {
                setMessage({ type: 'success', text: 'Kategori berhasil dihapus!' });
                onSuccess();
            } else {
                setMessage({ type: 'error', text: res.error || 'Gagal menghapus kategori' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Gagal menghapus kategori' });
        } finally {
            setLoading(false);
        }
    };

    const openNewForm = () => {
        setEditingCategory(null);
        setForm({ category: '', products: [] });
        setShowForm(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 className="section-title">
                    <Folder size={20} />
                    Kategori
                    <span style={{
                        fontSize: '12px',
                        background: 'var(--primary-bg)',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600',
                    }}>
                        {categoriesList.length}
                    </span>
                </h1>
                <button className="btn btn-primary btn-sm" onClick={openNewForm}>
                    <Plus size={12} /> Tambah
                </button>
            </div>

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

            {categoriesList.length === 0 ? (
                <div className="empty-state">
                    <Folder size={40} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                    <p>Belum ada kategori</p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={openNewForm}>
                        <Plus size={12} /> Buat Kategori
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categoriesList.map((view, i) => (
                        <div
                            key={view.category}
                            className="card"
                            style={{
                                padding: '12px',
                                animation: `fadeInUp 0.3s ease ${i * 0.03}s backwards`,
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GripVertical size={14} style={{ color: 'var(--gray-300)' }} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-800)' }}>
                                            {view.category}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                                            {view.products.length} produk
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleEdit(view)}
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleDelete(view.category)}
                                        title="Hapus"
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {view.products.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '4px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid var(--gray-50)',
                                }}>
                                    {view.products.slice(0, 5).map(pid => {
                                        const product = products[pid];
                                        if (!product) return null;
                                        return (
                                            <span
                                                key={pid}
                                                style={{
                                                    fontSize: '11px',
                                                    background: 'var(--gray-100)',
                                                    color: 'var(--gray-600)',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                }}
                                            >
                                                {product.name}
                                            </span>
                                        );
                                    })}
                                    {view.products.length > 5 && (
                                        <span style={{
                                            fontSize: '11px',
                                            background: 'var(--primary-bg)',
                                            color: 'var(--primary)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                        }}>
                                            +{view.products.length - 5} lagi
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <BottomSheet
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingCategory(null); }}
                title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Nama Kategori</label>
                        <input
                            type="text"
                            className="input"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            placeholder="contoh: Streaming"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package size={14} />
                            Produk dalam Kategori
                        </label>
                        <SearchableSelect
                            options={productList.map(p => ({
                                value: p.id,
                                label: p.name,
                                sublabel: `Rp${p.price.toLocaleString('id-ID')}`,
                            }))}
                            value={form.products}
                            onChange={(v) => setForm({ ...form, products: v as string[] })}
                            placeholder="Pilih produk..."
                            multiple
                        />
                    </div>

                    {form.products.length > 0 && (
                        <div style={{
                            padding: '10px 12px',
                            background: 'var(--success-bg)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
                                {form.products.length} produk dipilih
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={() => { setShowForm(false); setEditingCategory(null); }}
                        >
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
}
