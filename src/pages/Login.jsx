import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import lyraLogo from '../assets/lyra-logo.jpg';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            
            // Lấy thông tin user từ response trả về của API
            const userData = response.data.user || response.data;
            localStorage.setItem('user', JSON.stringify(userData));

            // Phân luồng điều hướng dựa theo Role
            if (userData.role === 'Admin') {
                navigate('/admin/dashboard');
            } else if (userData.role === 'Teacher') {
                navigate('/teacher/overview');
            } else {
                navigate('/home');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại!');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFF5F7] text-slate-800 p-4 font-sans select-none">
            <div className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-xl border border-pink-100 max-w-4xl w-full">
                {/* Form Bên Trái */}
                <div className="md:w-1/2 p-10 flex flex-col justify-center">
                    <h2 className="text-2xl font-black text-pink-700 mb-1">Welcome to Lyra SAT</h2>
                    <p className="text-xs text-slate-400 mb-6">Vui lòng đăng nhập để tiếp tục học tập và quản trị.</p>

                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-2xl mb-4 text-xs text-center border border-red-100 font-medium">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label>
                            <input 
                                type="email" 
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm text-slate-700 font-medium transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full px-4 pr-12 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm text-slate-700 font-medium transition"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-pink-600 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 transition rounded-2xl font-bold text-sm text-white shadow-lg shadow-pink-500/30 cursor-pointer">
                            Đăng nhập
                        </button>
                    </form>
                </div>

                {/* Banner Bên Phải (Tông hồng pastel) */}
                <div className="md:w-1/2 bg-gradient-to-br from-pink-50 to-rose-100 p-10 flex flex-col justify-between items-center text-center relative">
                    <div className="absolute top-4 right-4 text-xs font-black text-pink-600 uppercase tracking-wider">LYRA SAT</div>
                    <div className="my-auto">
                        <div className="w-44 h-44 mx-auto mb-4 rounded-3xl overflow-hidden shadow-md bg-white p-2 border border-pink-200">
                            <img src={lyraLogo} alt="Lyra SAT" className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <h2 className="text-base font-bold text-pink-800">BỨT PHÁ SAT - CHẠM ƯỚC MƠ</h2>
                        <p className="text-xs text-pink-600 mt-1 font-medium">Luck stars always surround you</p>
                    </div>
                </div>
            </div>
        </div>
    );
}