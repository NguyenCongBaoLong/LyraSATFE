import React from 'react';
import Pagination from '../Pagination';

export default function ClassDetailModal({
    selectedClass,
    onClose,
    classStudents,
    classStudentPage,
    classStudentCount,
    onClassStudentPageChange,
    availableStudents,
    availableStudentPage,
    availableStudentCount,
    onAvailableStudentPageChange,
    studentToAddId,
    setStudentToAddId,
    isLoadingStudents,
    onAddStudent,
    // Quản lý 2-4 giáo viên của lớp
    classTeachers = [],
    allTeachers = [],
    teacherToAddId = '',
    setTeacherToAddId = () => {},
    onAddTeacherToClass = () => {},
    onRemoveTeacherFromClass = () => {}
}) {
    if (!selectedClass) return null;

    const classCode = selectedClass.classCode || selectedClass.ClassCode;
    const className = selectedClass.className || selectedClass.ClassName;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn p-4 font-sans select-none">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-pink-100 relative max-h-[90vh] overflow-y-auto">
                {/* Header Modal */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-pink-100">
                    <div>
                        <span className="font-black text-pink-600 bg-pink-100 px-3 py-1 rounded-xl text-xs uppercase mr-2">
                            {classCode}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-800 inline-block">
                            {className}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold flex items-center justify-center transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* 1. MỤC QUẢN LÝ GIÁO VIÊN PHỤ TRÁCH (HỖ TRỢ 2-4 GIÁO VIÊN) */}
                <div className="mb-6 p-4 bg-pink-50/40 rounded-2xl border border-pink-100">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                            <span>👩‍🏫</span>
                            <span>Giáo viên phụ trách lớp ({classTeachers.length}/4)</span>
                        </h4>
                        <span className="text-[11px] text-pink-600 font-bold">Hỗ trợ phân công 2 - 4 giáo viên</span>
                    </div>

                    {/* Danh sách giáo viên đang phụ trách */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {classTeachers.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Chưa có giáo viên nào phụ trách lớp này.</span>
                        ) : (
                            classTeachers.map(t => {
                                const teacherId = t.id || t.Id;
                                const teacherName = t.fullName || t.FullName;
                                const isLead = t.isLead || selectedClass?.teacherId === teacherId;
                                return (
                                    <span key={teacherId} className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl text-xs font-bold text-slate-700 shadow-xs ${isLead ? 'border-amber-300 bg-amber-50/50' : 'border-pink-200'}`}>
                                        <span>{isLead ? '👑' : '👩‍🏫'} {teacherName}</span>
                                        {isLead ? (
                                            <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200">Key chính</span>
                                        ) : (
                                            onTransferLeadKey && (
                                                <button
                                                    type="button"
                                                    onClick={() => onTransferLeadKey(teacherId, teacherName)}
                                                    className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold cursor-pointer transition"
                                                    title="Chuyển quyền Giáo viên chính (nắm key) cho giáo viên này"
                                                >
                                                    🔑 Trao key
                                                </button>
                                            )
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onRemoveTeacherFromClass(teacherId, teacherName)}
                                            className="text-slate-400 hover:text-rose-500 font-black ml-0.5 cursor-pointer transition"
                                            title="Gỡ giáo viên này khỏi lớp"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                );
                            })
                        )}
                    </div>

                    {/* Form thêm giáo viên mới vào lớp (nếu chưa đủ 4 giáo viên) */}
                    {classTeachers.length < 4 && (
                        <form onSubmit={onAddTeacherToClass} className="flex gap-2 items-center">
                            <select
                                value={teacherToAddId}
                                onChange={(e) => setTeacherToAddId(e.target.value)}
                                className="w-full px-3 py-2 bg-white rounded-xl border border-pink-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                            >
                                <option value="">-- Thêm giáo viên cùng phụ trách (Tối đa 4 GV) --</option>
                                {allTeachers
                                    .filter(t => !classTeachers.some(ct => (ct.id || ct.Id) === (t.id || t.Id)))
                                    .map(t => (
                                        <option key={t.id || t.Id} value={t.id || t.Id}>
                                            {t.fullName || t.FullName} ({t.email || t.Email})
                                        </option>
                                    ))}
                            </select>
                            <button
                                type="submit"
                                disabled={!teacherToAddId}
                                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
                            >
                                + Thêm GV
                            </button>
                        </form>
                    )}
                </div>

                {/* 2. MỤC HỌC SINH CÓ THỂ THÊM VÀO LỚP */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold uppercase text-slate-400">
                            Học sinh có thể thêm vào lớp
                        </h4>
                        <span className="text-[11px] text-slate-400">{availableStudentCount} học sinh</span>
                    </div>
                    <form onSubmit={onAddStudent} className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 flex gap-2 items-center">
                        <select 
                            value={studentToAddId}
                            onChange={(e) => setStudentToAddId(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-pink-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                        >
                            <option value="">-- Chọn học sinh để thêm vào lớp --</option>
                            {availableStudents.map(s => (
                                <option key={s.id || s.Id} value={s.id || s.Id}>
                                    {s.fullName || s.FullName} ({s.email || s.Email}) {s.classCode ? `[Lớp: ${s.classCode}]` : '[Chưa có lớp]'}
                                </option>
                            ))}
                        </select>
                        <button 
                            type="submit" 
                            disabled={!studentToAddId}
                            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer whitespace-nowrap"
                        >
                            Thêm
                        </button>
                    </form>
                    <Pagination
                        page={availableStudentPage}
                        pageSize={10}
                        totalCount={availableStudentCount}
                        onPageChange={onAvailableStudentPageChange}
                        itemLabel="học sinh có thể thêm"
                        ariaLabel="Phân trang học sinh có thể thêm"
                    />
                </div>

                {/* 3. MỤC DANH SÁCH HỌC SINH TRONG LỚP */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">
                        Danh sách Học Sinh ({classStudentCount})
                    </h4>

                    {isLoadingStudents ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Đang tải danh sách học sinh...</p>
                    ) : classStudents.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center italic bg-slate-50 rounded-2xl">Lớp học này hiện chưa có học sinh nào.</p>
                    ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {classStudents.map(s => (
                                <div key={s.id || s.Id} className="p-3 bg-pink-50/30 rounded-2xl border border-pink-100 flex justify-between items-center text-xs">
                                    <div>
                                        <p className="font-bold text-slate-700">{s.fullName || s.FullName}</p>
                                        <p className="text-slate-400 text-[11px]">{s.email || s.Email}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-pink-100 text-pink-700 font-bold rounded-xl text-[10px]">Học sinh</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isLoadingStudents && (
                        <Pagination
                            page={classStudentPage}
                            pageSize={8}
                            totalCount={classStudentCount}
                            onPageChange={onClassStudentPageChange}
                            itemLabel="học sinh trong lớp"
                            ariaLabel="Phân trang học sinh trong lớp"
                        />
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-pink-100 text-right">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
