import { NavLink } from 'react-router-dom';
import { Home, Package, PlusCircle, Receipt, MoreHorizontal, Users, Database, Folder } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

export function BottomNav() {
    const [showMore, setShowMore] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [startY, setStartY] = useState(0);
    const [animateIn, setAnimateIn] = useState(false);
    const isDragging = useRef(false);

    useEffect(() => {
        if (showMore) {
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimateIn(true);
                });
            });
        } else {
            setAnimateIn(false);
            document.body.style.overflow = '';
            setDragY(0);
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showMore]);

    const handleClose = useCallback(() => {
        setAnimateIn(false);
        setTimeout(() => {
            setShowMore(false);
            setDragY(0);
        }, 250);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            const resistance = 1 + (diff / 400);
            setDragY(diff / resistance);
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (dragY > 80) {
            handleClose();
        } else {
            setDragY(0);
        }
    };

    const menuItems = [
        { icon: Users, label: 'Users', path: '/users', color: '#722ed1' },
        { icon: Database, label: 'Kelola Stok', path: '/stock', color: '#f5222d' },
        { icon: Folder, label: 'Kategori', path: '/categories', color: '#fa8c16' },
    ];

    return (
        <>
            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                    <Home size={24} />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Package size={24} />
                    <span>Produk</span>
                </NavLink>
                <NavLink to="/add-product" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PlusCircle size={24} />
                    <span>Tambah</span>
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Receipt size={24} />
                    <span>Transaksi</span>
                </NavLink>
                <button
                    className={`nav-item ${showMore ? 'active' : ''}`}
                    onClick={() => setShowMore(!showMore)}
                >
                    <MoreHorizontal size={24} />
                    <span>Lainnya</span>
                </button>
            </nav>

            {/* Overlay + Menu */}
            {showMore && (
                <>
                    {/* Backdrop overlay */}
                    <div
                        onClick={handleClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.4)',
                            zIndex: 1500,
                            opacity: animateIn ? Math.max(0, 1 - (dragY / 200)) : 0,
                            transition: isDragging.current ? 'none' : 'opacity 0.25s ease',
                        }}
                    />

                    {/* Menu Bottom Sheet */}
                    <div
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'var(--bg-elevated)',
                            borderRadius: '20px 20px 0 0',
                            zIndex: 1501,
                            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                            transform: animateIn ? `translateY(${dragY}px)` : 'translateY(100%)',
                            transition: isDragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
                            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.15)',
                        }}
                    >
                        {/* Handle bar - drag area */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: '14px 0 10px',
                                cursor: 'grab',
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '5px',
                                borderRadius: '3px',
                                background: 'var(--gray-300)',
                            }} />
                        </div>

                        {/* Header */}
                        <div style={{
                            padding: '0 20px 12px',
                        }}>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: 'var(--gray-900)',
                                margin: 0,
                            }}>
                                Menu Lainnya
                            </h3>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: '4px 16px 16px' }}>
                            {menuItems.map((item, index) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => {
                                        setShowMore(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '12px',
                                        color: 'var(--gray-800)',
                                        textDecoration: 'none',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        transition: 'background 0.15s ease',
                                        animation: animateIn ? `fadeInUp 0.3s ease ${index * 0.05}s backwards` : 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--gray-50)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: `${item.color}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: item.color,
                                    }}>
                                        <item.icon size={20} />
                                    </div>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
