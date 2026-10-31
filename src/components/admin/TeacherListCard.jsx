import React from 'react';
import Pagination from '../Pagination';

export default function TeacherListCard({ 
    teachers, 
    page, 
    pageSize, 
    totalCount, 
    onPageChange,
    onToggleStatus,
    onDeleteTeacher
}) {
    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-black text-pink-900 flex items-center gap-2">
                        <span>👩‍🏫</span>
                        <span>Danh Sách Giáo Viên ({totalCount})</span>
                    </h2>
                    <span className="text-[11px] text-pink-500 font-bold bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-100">
                        Admin toàn quyền
                    </span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {teachers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">Chưa có giáo viên nào trong hệ thống.</p>
                    ) : (
                        teachers.map(t => {
                            const id = t.id || t.Id;
                            const fullName = t.fullName || t.FullName;
                            const email = t.email || t.Email;
                            const isActive = t.isActive !== false;

                            return (
                                <div 
                                    key={id} 
                                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
                                        isActive 
                                            ? 'bg-pink-50/40 hover:bg-pink-50/80 border-pink-100' 
                                            : 'bg-slate-50 border-slate-200 opacity-75'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-extrabold text-slate-800 text-sm truncate">{fullName}</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                                isActive 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {isActive ? '● Đang hoạt động' : '🔒 Đã khóa'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-xs truncate mt-0.5">{email}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                        {onToggleStatus && (
                                            <button
                                                type="button"
                                                onClick={() => onToggleStatus(id, fullName, isActive)}
                                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                                                    isActive 
                                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                }`}
                                                title={isActive ? 'Khóa đăng nhập của giáo viên này' : 'Mở khóa tài khoản giáo viên này'}
                                            >
                                                <span>{isActive ? '🔒' : '🔓'}</span>
                                                <span>{isActive ? 'Khóa' : 'Mở khóa'}</span>
                                            </button>
                                        )}

                                        {onDeleteTeacher && (
                                            <button
                                                type="button"
                                                onClick={() => onDeleteTeacher(id, fullName)}
                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                                title="Xóa vĩnh viễn tài khoản giáo viên này"
                                            >
                                                <span>🗑️</span>
                                                <span className="hidden sm:inline">Xóa</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-pink-50">
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
}
