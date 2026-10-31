import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import LogoutButton from '../../components/LogoutButton';
import NotificationBell from '../../components/NotificationBell';
import ClassTeachersModal from '../../components/ClassTeachersModal';

export default function TeacherLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = user.role === 'Admin';
    const teacherEmail = user.email || '';

    const [teacherClasses, setTeacherClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(localStorage.getItem('teacher_selected_class') || '');
    const [showTeachersModal, setShowTeachersModal] = useState(false);

    const fetchTeacherClasses = useCallback(async () => {
        if (!teacherEmail) return;
        try {
            const res = await api.get(`/classes/teacher-classes?email=${encodeURIComponent(teacherEmail)}`);
            if (res.data) {
                setTeacherClasses(res.data);
                if (res.data.length > 0) {
                    const currentStored = localStorage.getItem('teacher_selected_class');
                    const exists = res.data.some(c => c.code === currentStored);
                    if (!exists || !currentStored) {
                        setSelectedClass(res.data[0].code);
                        localStorage.setItem('teacher_selected_class', res.data[0].code);
                    }
                } else {
                    setSelectedClass('');
                    localStorage.removeItem('teacher_selected_class');
                }
            }
        } catch (err) {
            console.error("Lỗi tải danh sách lớp:", err);
        }
    }, [teacherEmail]);

    useEffect(() => {
        fetchTeacherClasses();
    }, [fetchTeacherClasses]);

    const handleClassChange = (classCode) => {
        setSelectedClass(classCode);
        localStorage.setItem('teacher_selected_class', classCode);
        window.dispatchEvent(new Event('classChanged'));
    };

    const handleTeamUpdated = (userLeft = false) => {
        fetchTeacherClasses();
        window.dispatchEvent(new Event('classChanged'));
    };

    const currentClassObj = teacherClasses.find(c => c.code === selectedClass);
    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans">
            {/* Sidebar Cố định */}
            <div className="w-72 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm">
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-xl font-black text-pink-600 tracking-wider">LYRA SAT</div>
                        <NotificationBell align="left" />
                    </div>

                    {isAdmin && (
                        <div className="mb-5 p-3.5 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-white rounded-2xl shadow-sm border border-purple-400/30">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <span>🛡️</span>
                                    <span>Admin Điều Phối</span>
                                </span>
                                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
                                    Toàn quyền
                                </span>
                            </div>
                            <p className="text-[11px] text-white/90 leading-tight">
                                Bạn có quyền điều phối toàn bộ lớp học, đề thi & học viên.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/admin')}
                                className="mt-2.5 w-full py-2 bg-white text-purple-700 hover:bg-purple-50 text-[11px] font-black rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                            >
                                <span>⬅️</span>
                                <span>Về Trang Admin</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Dropdown chọn lớp học & Nút Quản lý Đội ngũ Giáo viên */}
                    <div className="mb-6 bg-pink-50/60 p-4 rounded-2xl border border-pink-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-black uppercase text-pink-500 tracking-wider">
                                Lớp đang quản lý
                            </label>
                            {selectedClass && (
                                <button
                                    type="button"
                                    onClick={() => setShowTeachersModal(true)}
                                    className="text-[11px] font-extrabold text-pink-600 hover:text-pink-700 bg-pink-100/90 hover:bg-pink-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Xem & phân công giáo viên phụ trách lớp"
                                >
                                    <span>👥</span>
                                    <span>Đội ngũ GV</span>
                                </button>
                            )}
                        </div>
                        {teacherClasses.length === 0 ? (
                            <div className="text-xs text-slate-400 italic py-2">
                                Bạn chưa được phân công lớp học nào.
                            </div>
                        ) : (
                            <select 
                                value={selectedClass} 
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="w-full bg-white border border-pink-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer shadow-sm"
                            >
                                {teacherClasses.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} - {c.name} {isAdmin ? '🛡️ [Admin điều phối]' : (c.isLead ? '👑 [Key chính]' : '')}
                                    </option>
                                ))}
                            </select>
                        )}
                        {currentClassObj && (
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Vai trò của bạn:</span>
                                {isAdmin ? (
                                    <span className="font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-purple-200">
                                        🛡️ Admin Điều Phối
                                    </span>
                                ) : currentClassObj.isLead ? (
                                    <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        👑 Giáo viên chính
                                    </span>
                                ) : (
                                    <span className="font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-md">
                                        👩‍🏫 GV Phụ trách
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <hr className="border-pink-50 my-4" />

                    <div className="space-y-2">
                        <button 
                            onClick={() => navigate('/teacher/overview')} 
                            aria-current={isActive('/teacher/overview') ? 'page' : undefined}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition text-sm ${isActive('/teacher/overview') ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                             📊 Tổng quan & Quản lý bài test
                        </button>
                        <button 
                            onClick={() => navigate('/teacher/students')} 
                            aria-current={isActive('/teacher/students') ? 'page' : undefined}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition text-sm ${isActive('/teacher/students') ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                             Danh sách học viên
                        </button>
                        <button 
                            onClick={() => navigate('/teacher/upload')} 
                            aria-current={isActive('/teacher/upload') ? 'page' : undefined}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition text-sm ${isActive('/teacher/upload') ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                             📝 Giao bài & Xóa bài test
                        </button>
                        <button 
                            onClick={() => navigate('/teacher/vocab-upload')} 
                            aria-current={isActive('/teacher/vocab-upload') ? 'page' : undefined}
                            className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition text-sm ${isActive('/teacher/vocab-upload') ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                             Tải lên từ vựng
                        </button>
                    </div>
                </div>

                <div>
                    <LogoutButton className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-2xl transition cursor-pointer" />
                </div>
            </div>

            {/* Nội dung thay đổi linh hoạt theo URL */}
            <div className="flex-1 overflow-y-auto">
                <Outlet context={{
                    selectedClass,
                    setSelectedClass,
                    teacherClasses,
                    reloadClasses: fetchTeacherClasses,
                    openTeachersModal: () => setShowTeachersModal(true)
                }} />
            </div>

            {/* Modal Quản lý Đội ngũ Giáo viên */}
            {showTeachersModal && selectedClass && (
                <ClassTeachersModal
                    isOpen={showTeachersModal}
                    onClose={() => setShowTeachersModal(false)}
                    classCode={selectedClass}
                    className={currentClassObj?.name || selectedClass}
                    onTeamUpdated={handleTeamUpdated}
                />
            )}
        </div>
    );
}
