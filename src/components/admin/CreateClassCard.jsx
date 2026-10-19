import React, { useState } from 'react';

export default function CreateClassCard({ teachers, onCreateClass, isSubmitting }) {
    const [classCode, setClassCode] = useState('');
    const [className, setClassName] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateClass({
            classCode,
            className,
            teacherId: selectedTeacherId ? parseInt(selectedTeacherId) : null
        }, () => {
            // Callback reset form
            setClassCode('');
            setClassName('');
            setSelectedTeacherId('');
        });
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm">
            <h2 className="text-base font-bold text-pink-900 mb-4">Tạo Lớp Học / Khóa Học Mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mã Lớp (ClassCode)</label>
                    <input 
                        type="text" 
                        required
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        placeholder="Ví dụ: SAT01, SAT02"
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-bold text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 uppercase"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tên Lớp / Khóa Học</label>
                    <input 
                        type="text" 
                        required
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="Ví dụ: SAT Foundation - K2026"
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Phân công Giáo viên phụ trách</label>
                    <select 
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                    >
                        <option value="">-- Chọn Giáo Viên --</option>
                        {teachers.map(t => (
                            <option key={t.id || t.Id} value={t.id || t.Id}>
                                {t.fullName || t.FullName} ({t.email || t.Email})
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-2xl shadow-md shadow-pink-500/20 transition cursor-pointer mt-2"
                >
                    {isSubmitting ? 'Đang tạo...' : ' Tạo Lớp Học'}
                </button>
            </form>
        </div>
    );
}