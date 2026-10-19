import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';

export default function TeacherLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const teacherEmail = user.email || '';

    const [teacherClasses, setTeacherClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(localStorage.getItem('teacher_selected_class') || '');

    useEffect(() => {
        if (!teacherEmail) return;
        api.get(`/classes/teacher-classes?email=${encodeURIComponent(teacherEmail)}`)
            .then(res => {
                if (res.data && res.data.length > 0) {
                    setTeacherClasses(res.data);
                    if (!selectedClass) {
                        setSelectedClass(res.data[0].code);
                        localStorage.setItem('teacher_selected_class', res.data[0].code);
                    }
                }
            })
            .catch(err => console.error("Lỗi tải danh sách lớp:", err));
    }, [teacherEmail]);

    const handleClassChange = (classCode) => {
        setSelectedClass(classCode);
        localStorage.setItem('teacher_selected_class', classCode);
        window.dispatchEvent(new Event('classChanged')); // Sự kiện để các component con nhận biết đổi lớp
    };

    const isActive = (path) => location.pathname.includes(path);

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans">
            {/* Sidebar Cố định */}
            <div className="w-72 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm">
                <div>
                    <div className="text-xl font-black text-pink-600 tracking-wider mb-6">LYRA SAT (Teacher)</div>
                    
                    {/* Dropdown chọn lớp học */}
                    <div className="mb-6 bg-pink-50/60 p-4 rounded-2xl border border-pink-100">
                        <label className="block text-[10px] font-black uppercase text-pink-500 mb-1.5 tracking-wider">Khóa học đang quản lý</label>
                        <select 
                            value={selectedClass} 
                            onChange={(e) => handleClassChange(e.target.value)}
                            className="w-full bg-white border border-pink-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer shadow-sm"
                        >
                            {teacherClasses.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.code} - {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <hr className="border-pink-50 my-4" />

                    <div className="space-y-2">
                        <button 
                            onClick={() => navigate('/teacher/overview')} 
                            className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition text-sm ${isActive('overview') ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                             Up Đề Word Theo Lớp
                        </button>
                        <button 
                            onClick={() => navigate('/teacher/students')} 
                            className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition text-sm ${isActive('students') ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                             Danh sách học viên
                        </button>
                    </div>
                </div>

                <div>
                    <button 
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-2xl transition"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Nội dung thay đổi linh hoạt theo URL */}
            <div className="flex-1 p-8 overflow-y-auto">
                <Outlet context={{ selectedClass }} />
            </div>
        </div>
    );
}