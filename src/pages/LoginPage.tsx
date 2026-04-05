import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, Lock, LockKeyhole } from 'lucide-react';

export function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const success = await login(password);
            if (!success) {
                setError('Password salah');
            }
        } catch (err) {
            setError('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">
                        <LockKeyhole size={28} />
                    </div>
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Masukkan password untuk mengakses dashboard</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <div className="input-icon">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="input"
                            placeholder="Password Admin"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ 
                            width: '100%', 
                            height: '40px',
                            marginTop: '8px',
                            justifyContent: 'center',
                            fontSize: '14px',
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loader" style={{ width: '18px', height: '18px', margin: 0, borderWidth: '2px' }} />
                        ) : (
                            <>
                                <LogIn size={16} />
                                Masuk
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
