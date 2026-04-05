import { useState } from 'react';
import { PlusCircle, Package, FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { productApi } from '../lib/api';

interface AddProductPageProps {
    onSuccess: () => void;
}

export function AddProductPage({ onSuccess }: AddProductPageProps) {
    const [form, setForm] = useState({
        id: '',
        name: '',
        price: '',
        desc: '',
        snk: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.id || !form.name || !form.price) {
            setMessage({ type: 'error', text: 'ID, Nama, dan Harga wajib diisi' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await productApi.create({
                id: form.id,
                name: form.name,
                price: parseInt(form.price) || 0,
                desc: form.desc,
                snk: form.snk,
            });

            if (res.success) {
                setMessage({ type: 'success', text: 'Produk berhasil ditambahkan!' });
                setForm({ id: '', name: '', price: '', desc: '', snk: '' });
                onSuccess();
            } else {
                setMessage({ type: 'error', text: res.error || 'Gagal menambahkan produk' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h1 className="section-title">
                <PlusCircle size={20} />
                Tambah Produk
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
                            ID Produk
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={form.id}
                            onChange={(e) => setForm({ ...form, id: e.target.value })}
                            placeholder="contoh: netflix_1bulan"
                            required
                        />
                        <span style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px', display: 'block' }}>
                            ID unik tanpa spasi, gunakan underscore
                        </span>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} />
                            Nama Produk
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Netflix Premium 1 Bulan"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <DollarSign size={14} />
                            Harga (Rupiah)
                        </label>
                        <input
                            type="number"
                            className="input"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="25000"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Deskripsi</label>
                        <textarea
                            className="input"
                            value={form.desc}
                            onChange={(e) => setForm({ ...form, desc: e.target.value })}
                            placeholder="Deskripsi produk..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Syarat & Ketentuan</label>
                        <textarea
                            className="input"
                            value={form.snk}
                            onChange={(e) => setForm({ ...form, snk: e.target.value })}
                            placeholder="Syarat dan ketentuan..."
                            rows={3}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loader" style={{ width: '16px', height: '16px', margin: 0, borderWidth: '2px' }} />
                        ) : (
                            <>
                                <PlusCircle size={14} />
                                Tambah Produk
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
