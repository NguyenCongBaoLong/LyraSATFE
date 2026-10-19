import React, { useState } from 'react';

export default function CreateUserCard({ classesList, onCreateUser, isSubmitting }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Student');
    const [userClassCode, setUserClassCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateUser({
            fullName,
            email,
            password,
            role,
            classCode: role === 'Student' ? userClassCode : null
        }, () => {
            // Callback reset form khi tạo thành công
            setFullName('');
            setEmail('');
            setPassword('');
            setUserClassCode('');
        });
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm">
            <h2 className="text-base font-bold text-pink-900 mb-4">Tạo Tài Khoản Mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Họ và tên</label>
                    <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email đăng nhập</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nguyenvana@gmail.com"
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mật khẩu</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vai trò</label>
                        <select 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-bold text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                        >
                            <option value="Student">Học sinh</option>
                            <option value="Teacher">Giáo viên</option>
                        </select>
                    </div>

                    {role === 'Student' && (
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Gán Lớp Học</label>
                            <select 
                                value={userClassCode}
                                onChange={(e) => setUserClassCode(e.target.value)}
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-bold text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                            >
                                <option value="">-- Chọn lớp --</option>
                                {classesList.map(c => {
                                    const code = c.classCode || c.ClassCode;
                                    const name = c.className || c.ClassName;
                                    return (
                                        <option key={c.id || c.Id} value={code}>{code} - {name}</option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-2xl shadow-md shadow-pink-500/20 transition cursor-pointer mt-2"
                >
                    {isSubmitting ? 'Đang tạo...' : ' Tạo Tài Khoản'}
                </button>
            </form>
        </div>
    );
}