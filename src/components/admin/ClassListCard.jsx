import React from 'react';
import Pagination from '../Pagination';

export default function ClassListCard({
    classesList,
    teachers,
    page,
    pageSize,
    totalCount,
    onPageChange,
    onOpenClass,
    onDeleteClass,
    onAssignTeacher,
    onCoordinateClass
}) {
    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm font-sans select-none">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-pink-900 flex items-center gap-2">
                    <span>📋</span>
                    <span>Danh Sách Lớp Học ({totalCount})</span>
                </h2>
                <span className="text-[11px] text-pink-500 font-medium">👉 Nhấp vào lớp để quản lý giáo viên & học sinh</span>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {classesList.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">Chưa có lớp học nào trong hệ thống.</p>
                ) : classesList.map(c => {
                    const id = c.id ?? c.Id;
                    const code = c.classCode || c.ClassCode;
                    const name = c.className || c.ClassName;
                    const teachersList = c.teachers || [];
                    const hasTeachers = teachersList.length > 0;

                    return (
                        <div 
                            key={id} 
                            onClick={() => onOpenClass(c)}
                            className="p-4 bg-pink-50/50 hover:bg-pink-100/60 transition duration-200 rounded-2xl border border-pink-100 flex flex-col gap-3 text-xs cursor-pointer group shadow-xs hover:shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-black text-pink-600 bg-pink-100 px-2.5 py-1 rounded-lg mr-2 group-hover:bg-pink-200 uppercase">{code}</span>
                                    <span className="font-bold text-slate-700 text-sm group-hover:text-pink-900">{name}</span>
                                </div>
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    {onCoordinateClass && (
                                        <button 
                                            type="button"
                                            onClick={() => onCoordinateClass(code)}
                                            className="px-2.5 py-1 bg-white hover:bg-pink-500 text-pink-600 hover:text-white border border-pink-200 hover:border-pink-500 rounded-xl font-extrabold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                                            title={`Vào điều phối đề thi, chấm bài & học viên cho lớp ${code}`}
                                        >
                                            <span>🎯</span>
                                            <span>Điều phối lớp</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => onDeleteClass(e, id, code)}
                                        className="text-slate-400 hover:text-red-500 p-1.5 transition cursor-pointer"
                                        title="Xóa lớp học"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {hasTeachers ? (
                                <div className="pt-2 border-t border-pink-100/60 text-slate-600 font-medium flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] font-bold text-slate-400">GV phụ trách ({teachersList.length}):</span>
                                        {teachersList.map((t, idx) => (
                                            <span key={t.id || idx} className="text-pink-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-pink-200 text-[11px]">
                                                👩‍🏫 {t.fullName}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-[11px] text-pink-600 font-bold opacity-0 group-hover:opacity-100 transition">
                                        Xem & Phân công ➔
                                    </span>
                                </div>
                            ) : (
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 pt-2 border-t border-pink-100/60">
                                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Chưa có GV:</span>
                                    <select 
                                        defaultValue=""
                                        onChange={(e) => onAssignTeacher(id, e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white rounded-xl border border-pink-200 text-xs font-semibold text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                                    >
                                        <option value="">-- Chọn giáo viên phụ trách --</option>
                                        {teachers.map(t => (
                                            <option key={t.id || t.Id} value={t.id || t.Id}>
                                                {t.fullName || t.FullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <Pagination
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={onPageChange}
            />
        </div>
    );
}
