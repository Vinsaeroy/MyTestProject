import { LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
    onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <header className="header">
            <div className="header-logo">
                <span>Dashboard</span>
            </div>
            <div className="header-actions">
                <button
                    className="btn-icon"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                    className="btn-icon"
                    onClick={onLogout}
                    title="Logout"
                    style={{ color: 'var(--danger)' }}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
}
