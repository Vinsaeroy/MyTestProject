import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | string[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    multiple?: boolean;
    searchable?: boolean;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    multiple = false,
    searchable = true,
    disabled = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const normalizeSearchText = (value: unknown): string => String(value ?? '').toLowerCase();
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen, searchable]);

    const filteredOptions = normalizedSearchTerm
        ? options.filter(opt =>
            normalizeSearchText(opt.label).includes(normalizedSearchTerm) ||
            normalizeSearchText(opt.value).includes(normalizedSearchTerm) ||
            normalizeSearchText(opt.sublabel).includes(normalizedSearchTerm)
        )
        : options;

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    const getDisplayText = () => {
        if (selectedValues.length === 0) return placeholder;
        if (multiple) {
            if (selectedValues.length === 1) {
                const opt = options.find(o => o.value === selectedValues[0]);
                return opt?.label || selectedValues[0];
            }
            return `${selectedValues.length} item dipilih`;
        }
        const opt = options.find(o => o.value === selectedValues[0]);
        return opt?.label || selectedValues[0];
    };

    const handleSelect = (optValue: string) => {
        if (multiple) {
            const current = Array.isArray(value) ? value : [];
            if (current.includes(optValue)) {
                onChange(current.filter(v => v !== optValue));
            } else {
                onChange([...current, optValue]);
            }
        } else {
            onChange(optValue);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(multiple ? [] : '');
    };

    const isSelected = (optValue: string) => selectedValues.includes(optValue);
    const hasValue = selectedValues.length > 0;

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative' }}
        >
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: disabled ? 'var(--gray-100)' : 'var(--bg-elevated)',
                    border: `2px solid ${isOpen ? 'var(--primary)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 3px var(--primary-bg)' : 'none',
                }}
            >
                <span style={{
                    color: hasValue ? 'var(--gray-800)' : 'var(--gray-400)',
                    fontSize: '15px',
                    textAlign: 'left',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {getDisplayText()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasValue && !disabled && (
                        <span
                            onClick={handleClear}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'var(--gray-200)',
                                color: 'var(--gray-500)',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={12} />
                        </span>
                    )}
                    <ChevronDown
                        size={18}
                        style={{
                            color: 'var(--gray-400)',
                            transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        }}
                    />
                </div>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        overflow: 'hidden',
                        animation: 'dropdownIn 0.15s ease',
                    }}
                >
                    {searchable && (
                        <div style={{
                            padding: '12px',
                            borderBottom: '1px solid var(--gray-100)',
                            position: 'sticky',
                            top: 0,
                            background: 'var(--bg-elevated)',
                        }}>
                            <div style={{ position: 'relative' }}>
                                <Search
                                    size={18}
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--gray-400)',
                                    }}
                                />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Cari..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 40px',
                                        border: '1px solid var(--gray-200)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--gray-800)',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                        padding: '4px',
                    }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--gray-400)',
                                fontSize: '14px',
                            }}>
                                {searchTerm ? 'Tidak ditemukan' : 'Tidak ada opsi'}
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isSelected(opt.value) ? 'var(--primary-bg)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected(opt.value)) {
                                            e.currentTarget.style.background = 'var(--gray-50)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected(opt.value)) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {multiple && (
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            border: isSelected(opt.value)
                                                ? '2px solid var(--primary)'
                                                : '2px solid var(--gray-300)',
                                            background: isSelected(opt.value) ? 'var(--primary)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s',
                                            flexShrink: 0,
                                        }}>
                                            {isSelected(opt.value) && <Check size={12} color="white" />}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: isSelected(opt.value) ? '600' : '500',
                                            color: isSelected(opt.value) ? 'var(--primary)' : 'var(--gray-800)',
                                            fontSize: '14px',
                                        }}>
                                            {opt.label}
                                        </div>
                                        {opt.sublabel && (
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'var(--gray-500)',
                                                marginTop: '2px',
                                            }}>
                                                {opt.sublabel}
                                            </div>
                                        )}
                                    </div>
                                    {!multiple && isSelected(opt.value) && (
                                        <Check size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {multiple && selectedValues.length > 0 && (
                        <div style={{
                            padding: '12px',
                            borderTop: '1px solid var(--gray-100)',
                            background: 'var(--gray-50)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                                {selectedValues.length} dipilih
                            </span>
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Hapus Semua
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
