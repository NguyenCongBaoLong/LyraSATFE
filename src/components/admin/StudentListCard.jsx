import React from 'react';
import Pagination from '../Pagination';

export default function StudentListCard({
    students,
    page,
    pageSize,
    totalCount,
    onPageChange,
    search,
    onSearchChange,
    classFilter,
    onClassFilterChange,
    classesList,
    onToggleStatus,
    onDeleteStudent,
    isLoading
}) {
    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
            {/* Header & Bộ lọc */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-pink-100 pb-5">
                <div>
                    <h2 className="text-lg font-black text-pink-900 flex items-center gap-2">
                        <span>🎓</span>
                        <span>Quản lý Tài khoản Học viên</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Kiểm soát quyền đăng nhập, trạng thái tài khoản và thông tin học viên toàn hệ thống
                    </p>
                </div>
                <span className="text-xs font-bold bg-pink-50 text-pink-700 px-3.5 py-1.5 rounded-xl border border-pink-200 shadow-xs">
                    Tổng số: {totalCount} học viên
                </span>
            </div>

            {/* Thanh công cụ tìm kiếm và lọc theo lớp */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email học viên..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition"
                    />
                </div>
                <div className="w-full sm:w-56">
                    <select
                        value={classFilter}
                        onChange={(e) => onClassFilterChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition cursor-pointer"
                    >
                        <option value="">-- Tất cả các lớp --</option>
                        {classesList?.map(c => (
                            <option key={c.classCode || c.ClassCode} value={c.classCode || c.ClassCode}>
                                Lớp {c.classCode || c.ClassCode} ({c.className || c.ClassName})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bảng danh sách học viên */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-pink-100 text-slate-400 text-xs uppercase tracking-wider bg-pink-50/40">
                            <th className="py-3 px-4 rounded-l-2xl">Học viên</th>
                            <th className="py-3 px-4">Lớp học</th>
                            <th className="py-3 px-4">Trạng thái đăng nhập</th>
                            <th className="py-3 px-4 text-right rounded-r-2xl">Thao tác quản trị</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan="4" className="py-12 text-center text-pink-600 font-bold text-xs">
                                    Đang tải danh sách học viên...
                                </td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-12 text-center text-slate-400 text-xs italic">
                                    Không tìm thấy học viên nào phù hợp.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const isActive = student.isActive !== false;
                                return (
                                    <tr key={student.id} className="hover:bg-pink-50/20 transition">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-800 text-xs">
                                                {student.fullName}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {student.email}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {student.classCode ? (
                                                <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-200">
                                                    {student.classCode}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    Chưa gán lớp
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    <span>Đang hoạt động</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                                    <span>Đã khóa đăng nhập</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Nút Khóa / Mở khóa */}
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleStatus(student.id, isActive, student.fullName)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                                                        isActive
                                                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    }`}
                                                    title={isActive ? 'Khóa quyền đăng nhập của học sinh này' : 'Mở khóa quyền đăng nhập'}
                                                >
                                                    <span>{isActive ? '🔒' : '🔓'}</span>
                                                    <span>{isActive ? 'Khóa đăng nhập' : 'Mở khóa'}</span>
                                                </button>

                                                {/* Nút Xóa vĩnh viễn */}
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteStudent(student.id, student.fullName)}
                                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                                                    title="Xóa vĩnh viễn tài khoản học sinh này khỏi hệ thống"
                                                >
                                                    <span>🗑️</span>
                                                    <span>Xóa</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {!isLoading && totalCount > 0 && (
                <div className="pt-2 border-t border-pink-100">
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={onPageChange}
                        itemLabel="học viên"
                        ariaLabel="Phân trang danh sách học viên"
                    />
                </div>
            )}
        </div>
    );
}
