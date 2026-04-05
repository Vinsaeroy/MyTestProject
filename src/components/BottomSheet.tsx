import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    const [dragY, setDragY] = useState(0);
    const [startY, setStartY] = useState(0);
    const [shouldRender, setShouldRender] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimateIn(true);
                });
            });
        } else {
            setAnimateIn(false);
            document.body.style.overflow = '';
            const timer = setTimeout(() => {
                setShouldRender(false);
                setDragY(0);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            if (contentRef.current && contentRef.current.contains(e.target as Node)) {
                // Tunggu sebentar agar keyboard muncul sepenuhnya
                setTimeout(() => {
                    (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        };

        const element = contentRef.current;
        if (element) {
            element.addEventListener('focusin', handleFocus);
        }

        return () => {
            if (element) {
                element.removeEventListener('focusin', handleFocus);
            }
        };
    }, []);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleTouchStart = (e: React.TouchEvent) => {
        const scrollTop = contentRef.current?.scrollTop || 0;

        if (scrollTop <= 0) {
            isDragging.current = true;
            setStartY(e.touches[0].clientY);
        } else {
            isDragging.current = false;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            const scrollTop = contentRef.current?.scrollTop || 0;
            if (scrollTop <= 0) {
                const resistance = 1 + (diff / 500);
                setDragY(diff / resistance);
            }
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (dragY > 120) {
            handleClose();
        } else {
            setDragY(0);
        }
    };

    if (!shouldRender) return null;

    // Use Portal to render outside of any transform context
    return createPortal(
        <>
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 2000,
                    opacity: animateIn ? Math.max(0, 1 - (dragY / 400)) : 0,
                    transition: isDragging.current ? 'none' : 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
            />

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
                    borderRadius: '16px 16px 0 0',
                    maxHeight: '90dvh', // Gunakan dvh agar responsif terhadap viewport dinamis (keyboard)
                    zIndex: 2001,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: animateIn ? `translateY(${dragY}px)` : 'translateY(100%)',
                    transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
                }}
            >
                <div
                    style={{
                        padding: '12px 20px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexShrink: 0,
                        cursor: 'grab',
                    }}
                >
                    <div style={{
                        width: '36px',
                        height: '4px',
                        background: 'var(--gray-300)',
                        borderRadius: '3px',
                        marginBottom: '16px',
                        opacity: 0.8,
                    }} />

                    {title && (
                        <h3 style={{
                            fontSize: '17px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                            margin: '0 0 16px 0',
                            textAlign: 'center',
                        }}>
                            {title}
                        </h3>
                    )}
                </div>

                <div
                    ref={contentRef}
                    style={{
                        padding: '0 20px calc(240px + env(safe-area-inset-bottom, 0px))', // Tambah padding bawah extra besar untuk keyboard buffer
                        overflowY: 'auto',
                        flex: 1,
                        overscrollBehaviorY: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth',
                    }}
                >
                    {children}
                </div>

                {/* Safe area spacer untuk iPhone home indicator */}
                <div style={{
                    height: 'env(safe-area-inset-bottom, 0px)',
                    background: 'var(--bg-elevated)',
                    flexShrink: 0,
                }} />
            </div>
        </>,
        document.body
    );
}
