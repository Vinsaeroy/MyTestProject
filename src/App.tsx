import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/PageTransition';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BottomSheet } from './components/BottomSheet';
import {
    LoginPage,
    OverviewPage,
    ProductsPage,
    AddProductPage,
    TransactionsPage,
    TransactionDetailPage,
    UsersPage,
    StockPage,
    CategoriesPage
} from './pages';
import { useDashboard } from './hooks/useDashboard';
import { useAuth } from './context/AuthContext';
import { productApi } from './lib/api';
import type { Product } from './types';
import './index.css';

// App Component
function App() {
    const { isAuthenticated, logout } = useAuth();
    const { products, productViews, stats, recentTransactions, loading, refetch } = useDashboard();
    const location = useLocation();

    // Modal states
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState({ id: '', name: '', price: '', desc: '', snk: '' });

    // Handle Loading & Auth
    if (isAuthenticated === null) {
        return <div className="loader" style={{ marginTop: '100px' }} />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Edit Handlers
    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            id: product.id,
            name: product.name,
            price: product.price.toString(),
            desc: product.desc,
            snk: product.snk || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;

        const res = await productApi.update(editingProduct.id, {
            id: editForm.id,
            name: editForm.name,
            price: parseInt(editForm.price) || 0,
            desc: editForm.desc,
            snk: editForm.snk,
        });

        if (res.success) {
            setEditingProduct(null);
            refetch();
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        const productName = products[productId]?.name || productId;
        if (!confirm(`Yakin ingin menghapus "${productName}"?`)) return;

        const res = await productApi.delete(productId);
        if (res.success) {
            refetch();
        }
    };

    return (
        <div className="app">
            <Header onLogout={logout} />

            <main className="main-content">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route
                            path="/"
                            element={
                                <PageTransition>
                                    <OverviewPage
                                        stats={stats}
                                        recentTransactions={recentTransactions}
                                        products={products}
                                        loading={loading}
                                    />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/products"
                            element={
                                <PageTransition>
                                    <ProductsPage
                                        products={products}
                                        productViews={productViews}
                                        loading={loading}
                                        onEdit={handleEditProduct}
                                        onDelete={handleDeleteProduct}
                                        onViewDetails={setViewingProduct}
                                    />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/add-product"
                            element={
                                <PageTransition>
                                    <AddProductPage onSuccess={refetch} />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/transactions"
                            element={
                                <PageTransition>
                                    <TransactionsPage />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/trx"
                            element={
                                <PageTransition>
                                    <TransactionDetailPage />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <PageTransition>
                                    <UsersPage />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/stock"
                            element={
                                <PageTransition>
                                    <StockPage products={products} onSuccess={refetch} />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/categories"
                            element={
                                <PageTransition>
                                    <CategoriesPage
                                        products={products}
                                        productViews={productViews}
                                        onSuccess={refetch}
                                    />
                                </PageTransition>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AnimatePresence>
            </main>

            <BottomNav />

            {/* Edit Product Sheet */}
            <BottomSheet
                isOpen={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                title="Edit Produk"
            >
                <div className="form-group">
                    <label>ID Produk</label>
                    <input
                        type="text"
                        className="input"
                        value={editForm.id}
                        disabled
                        style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }}
                    />
                </div>
                <div className="form-group">
                    <label>Nama Produk</label>
                    <input
                        type="text"
                        className="input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Harga</label>
                    <input
                        type="number"
                        className="input"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea
                        className="input"
                        value={editForm.desc}
                        onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                        rows={3}
                    />
                </div>
                <div className="form-group">
                    <label>Syarat & Ketentuan</label>
                    <textarea
                        className="input"
                        value={editForm.snk}
                        onChange={(e) => setEditForm({ ...editForm, snk: e.target.value })}
                        rows={3}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setEditingProduct(null)}
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

            {/* Detail Product Sheet */}
            <BottomSheet
                isOpen={!!viewingProduct}
                onClose={() => setViewingProduct(null)}
                title={viewingProduct?.name || 'Detail'}
            >
                {viewingProduct && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
                                Rp{viewingProduct.price.toLocaleString('id-ID')}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                                {viewingProduct.id}
                            </div>
                        </div>

                        <div className="card" style={{ background: 'var(--bg-container)', border: 'none' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '8px' }}>
                                DESKRIPSI
                            </h4>
                            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                {viewingProduct.desc || '-'}
                            </p>
                        </div>

                        <div className="card" style={{ background: 'var(--bg-container)', border: 'none' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '8px' }}>
                                SYARAT & KETENTUAN
                            </h4>
                            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                {viewingProduct.snk || '-'}
                            </p>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)' }}>Stok Tersedia</span>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{viewingProduct.account.length}</span>
                            </div>
                            {viewingProduct.account.length > 0 && (
                                <div style={{
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--gray-200)'
                                }}>
                                    {viewingProduct.account.map((acc, i) => (
                                        <div key={i} style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid var(--gray-100)',
                                            fontSize: '12px',
                                            fontFamily: 'var(--font-mono)',
                                            background: i % 2 === 0 ? 'var(--white)' : 'var(--gray-50)'
                                        }}>
                                            {acc}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => setViewingProduct(null)}
                            >
                                Tutup
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setViewingProduct(null);
                                    handleEditProduct(viewingProduct);
                                }}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </div>
    );
}

export default App;
