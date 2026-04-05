import { useState } from 'react';
import { Package, Search, Edit, Trash2, ChevronDown, ChevronUp, Box } from 'lucide-react';
import type { Products, ProductViews, Product } from '../types';

interface ProductsPageProps {
    products: Products;
    productViews: ProductViews;
    loading: boolean;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    onViewDetails: (product: Product) => void;
}

function formatRupiah(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

export function ProductsPage({
    products,
    productViews,
    loading,
    onEdit,
    onDelete,
    onViewDetails
}: ProductsPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const productList = Object.values(products);
    const normalizeSearchText = (value: unknown): string => String(value ?? '').toLowerCase();
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredProducts = productList.filter(product =>
        normalizeSearchText(product.name).includes(normalizedSearchTerm) ||
        normalizeSearchText(product.id).includes(normalizedSearchTerm)
    );

    const groupedProducts: Record<string, Product[]> = {};
    Object.entries(productViews).forEach(([category, view]) => {
        groupedProducts[category] = view.id
            .map(id => products[id])
            .filter((p): p is Product => !!p && (
                normalizeSearchText(p.name).includes(normalizedSearchTerm) ||
                normalizeSearchText(p.id).includes(normalizedSearchTerm)
            ));
    });

    const categorizedIds = new Set(Object.values(productViews).flatMap(v => v.id));
    const uncategorized = filteredProducts.filter(p => !categorizedIds.has(p.id));
    if (uncategorized.length > 0) {
        groupedProducts['Lainnya'] = uncategorized;
    }

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    if (loading) {
        return <div className="loader" />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
            }}>
                <h1 className="section-title">
                    <Package size={20} />
                    Produk
                    <span style={{
                        fontSize: '12px',
                        background: 'var(--primary-bg)',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600',
                    }}>
                        {productList.length}
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
                    placeholder="Cari produk..."
                    className="input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                />
            </div>

            {Object.entries(groupedProducts).map(([category, prods], catIndex) => {
                if (prods.length === 0) return null;
                const isCollapsed = collapsedCategories[category];
                const isExpanded = !isCollapsed;

                return (
                    <div
                        key={category}
                        className="card"
                        style={{
                            padding: 0,
                            overflow: 'hidden',
                            animation: `fadeInUp 0.3s ease ${catIndex * 0.05}s backwards`,
                        }}
                    >
                        <button
                            onClick={() => toggleCategory(category)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: 'var(--bg-container)',
                                border: 'none',
                                cursor: 'pointer',
                                borderBottom: isExpanded ? '1px solid var(--gray-100)' : 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Box size={16} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-800)' }}>
                                    {category}
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    background: 'var(--gray-100)',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    color: 'var(--gray-500)',
                                }}>
                                    {prods.length}
                                </span>
                            </div>
                            {isExpanded ? (
                                <ChevronUp size={16} style={{ color: 'var(--gray-400)' }} />
                            ) : (
                                <ChevronDown size={16} style={{ color: 'var(--gray-400)' }} />
                            )}
                        </button>

                        {isExpanded && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '8px',
                                padding: '12px',
                            }}>
                                {prods.map((product, i) => (
                                    <div
                                        key={product.id}
                                        onClick={() => onViewDetails(product)}
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--gray-100)',
                                            borderRadius: 'var(--radius)',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            animation: `fadeInUp 0.25s ease ${i * 0.03}s backwards`,
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: 'var(--gray-800)',
                                            marginBottom: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {product.name}
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            color: 'var(--primary)',
                                            marginBottom: '8px',
                                        }}>
                                            {formatRupiah(product.price)}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}>
                                            <span style={{
                                                fontSize: '11px',
                                                color: product.account.length > 0 ? 'var(--success)' : 'var(--danger)',
                                                background: product.account.length > 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                            }}>
                                                {product.account.length} stok
                                            </span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    className="btn-icon"
                                                    onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                                    title="Edit"
                                                    style={{ width: '24px', height: '24px' }}
                                                >
                                                    <Edit size={12} />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                                                    title="Hapus"
                                                    style={{ width: '24px', height: '24px', color: 'var(--danger)' }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {filteredProducts.length === 0 && (
                <div className="empty-state">
                    <Package size={40} style={{ color: 'var(--gray-300)', marginBottom: '8px' }} />
                    <p>{searchTerm ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
                </div>
            )}
        </div>
    );
}
