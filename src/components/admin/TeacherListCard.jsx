import React from 'react';
import Pagination from '../Pagination';

export default function TeacherListCard({ teachers, page, pageSize, totalCount, onPageChange }) {
    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm">
            <h2 className="text-base font-bold text-pink-900 mb-4">Danh Sách Giáo Viên ({totalCount})</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {teachers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Chưa có giáo viên nào trong hệ thống.</p>
                ) : (
                    teachers.map(t => (
                        <div key={t.id || t.Id} className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 flex justify-between items-center text-xs">
                            <div>
                                <p className="font-bold text-slate-700">{t.fullName || t.FullName}</p>
                                <p className="text-slate-400 text-[11px]">{t.email || t.Email}</p>
                            </div>
                            <span className="px-3 py-1 bg-pink-100 text-pink-700 font-bold rounded-xl text-[10px]">GV</span>
                        </div>
                    ))
                )}
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