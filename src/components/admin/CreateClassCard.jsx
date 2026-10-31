import React, { useState } from 'react';

export default function CreateClassCard({ teachers, onCreateClass, isSubmitting }) {
    const [classCode, setClassCode] = useState('');
    const [className, setClassName] = useState('');
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

    const toggleTeacher = (tId) => {
        if (selectedTeacherIds.includes(tId)) {
            setSelectedTeacherIds(selectedTeacherIds.filter(id => id !== tId));
        } else {
            if (selectedTeacherIds.length >= 4) {
                alert("Một lớp học có thể phân công tối đa từ 2 đến 4 giáo viên.");
                return;
            }
            setSelectedTeacherIds([...selectedTeacherIds, tId]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateClass({
            classCode: classCode.trim().toUpperCase(),
            className: className.trim(),
            teacherId: selectedTeacherIds.length > 0 ? selectedTeacherIds[0] : null,
            teacherIds: selectedTeacherIds
        }, () => {
            // Callback reset form
            setClassCode('');
            setClassName('');
            setSelectedTeacherIds([]);
        });
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm font-sans select-none">
            <h2 className="text-base font-bold text-pink-900 mb-4 flex items-center gap-2">
                <span>🏫</span>
                <span>Tạo Lớp Học / Khóa Học Mới</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mã Lớp (ClassCode)</label>
                    <input 
                        type="text" 
                        required
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        placeholder="Ví dụ: SAT01, SAT02, f2609"
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
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold uppercase text-slate-400">
                            Phân công Giáo viên phụ trách
                        </label>
                        <span className="text-[11px] text-pink-600 font-bold">
                            Đã chọn: {selectedTeacherIds.length}/4 giáo viên
                        </span>
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-1.5 p-3 bg-pink-50/40 rounded-2xl border border-pink-100">
                        {teachers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2 text-center">Chưa có tài khoản giáo viên nào.</p>
                        ) : teachers.map(t => {
                            const tId = t.id || t.Id;
                            const isChecked = selectedTeacherIds.includes(tId);
                            return (
                                <label 
                                    key={tId} 
                                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                                        isChecked ? 'bg-pink-100 text-pink-900 shadow-xs' : 'hover:bg-pink-50 text-slate-700'
                                    }`}
                                >
                                    <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleTeacher(tId)}
                                        className="rounded accent-pink-500 cursor-pointer w-4 h-4"
                                    />
                                    <span>👩‍🏫 {t.fullName || t.FullName}</span>
                                    <span className="text-[11px] text-slate-400">({t.email || t.Email})</span>
                                </label>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                        * Hỗ trợ tích chọn từ 2 đến 4 giáo viên cùng giảng dạy và quản lý lớp học.
                    </p>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-2xl shadow-md shadow-pink-500/20 transition cursor-pointer mt-2"
                >
                    {isSubmitting ? 'Đang tạo lớp...' : '✨ Tạo Lớp Học'}
                </button>
            </form>
        </div>
    );
}
