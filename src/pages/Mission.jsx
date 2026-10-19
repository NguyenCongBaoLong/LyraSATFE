import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Mission() {
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [activeTab, setActiveTab] = useState('Đang làm'); // 'Làm gấp' | 'Đang làm' | 'Hết hạn'
    const [viewMode, setViewMode] = useState('Deadline'); // Deadline | Calendar
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            navigate('/');
            return;
        }
        setUser(storedUser);

        // Lấy danh sách bài test từ Backend dựa theo classCode của học sinh
        const classCode = storedUser.classCode || 'SAT01';
        api.get(`/tests/class/${classCode}`)
            .then(res => {
                if (res.data) {
                    setTests(res.data);
                }
            })
            .catch(err => {
                console.error("Lỗi tải danh sách bài tập:", err);
                // Dữ liệu mẫu dự phòng khi lỗi kết nối
                setTests([
                    { id: 1, title: '[SAT01] PRACTICE TEST 01 - READING', deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString() }, // Sắp hết hạn trong 12h (Làm gấp)
                    { id: 2, title: '[SAT01] MATH MODULE QUIZ 01', deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString() }, // Còn nhiều thời gian (Đang làm)
                    { id: 3, title: '[SAT01] INTRODUCTORY TEST', deadline: '2025-01-01T12:00:00' } // Đã qua hạn (Hết hạn)
                ]);
            });
    }, [navigate]);

    if (!user) return null;

    // Phân loại bài tập tự động dựa trên thời hạn (deadline)
    const classifiedTests = tests.map(test => {
        if (!test.deadline) return { ...test, category: 'Đang làm', statusTag: 'Đang làm', tagColor: 'bg-pink-500' };
        
        const now = new Date().getTime();
        const deadlineTime = new Date(test.deadline).getTime();
        const diffHours = (deadlineTime - now) / (1000 * 60 * 60);

        if (diffHours <= 0) {
            return { ...test, category: 'Hết hạn', statusTag: 'Hết hạn', tagColor: 'bg-slate-400' };
        } else if (diffHours <= 24) {
            return { ...test, category: 'Làm gấp', statusTag: 'Gấp (<24h)', tagColor: 'bg-red-500' };
        } else {
            return { ...test, category: 'Đang làm', statusTag: 'Đang làm', tagColor: 'bg-pink-500' };
        }
    });

    // Lọc bài tập theo tab đang chọn
    const filteredTests = classifiedTests.filter(t => t.category === activeTab);

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans">
            {/* Sidebar tông màu hồng đồng bộ trang Home */}
            <div className="w-64 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm">
                <div>
                    <div className="text-xl font-black text-pink-600 tracking-wider mb-8">LYRA SAT</div>
                    <div className="space-y-2">
                        <button 
                            onClick={() => navigate('/home')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm"
                        >
                            Trang chủ
                        </button>
                        <button 
                            onClick={() => navigate('/mission')} 
                            className="w-full text-left px-4 py-3 rounded-2xl bg-pink-500 text-white font-bold transition text-sm shadow-md shadow-pink-500/20"
                        >
                            Nhiệm vụ
                        </button>
                        <button 
                            onClick={() => navigate('/score')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm"
                        >
                            Điểm số
                        </button>
                        <button 
                            onClick={() => navigate('/vocab')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm"
                        >
                            Từ vựng 
                        </button>
                        <button 
                            onClick={() => navigate('/account')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm"
                        >
                            Hồ sơ
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

            {/* Nội dung chính bên phải */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header chào mừng chuẩn form Home */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">{user.fullName}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Lớp: <span className="text-slate-700 font-semibold">{user.classCode}</span></p>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer hover:bg-pink-100 transition shadow-sm">
                        <span className="text-base">🔔</span>
                        <span className="text-xs font-bold text-pink-700">Thông báo</span>
                    </div>
                </div>

                

                {/* 3 Tab chính theo yêu cầu: Làm gấp, Đang làm, Hết hạn */}
                <div className="flex gap-8 border-b border-pink-100 mb-6 pb-3 text-sm font-semibold">
                    {['Làm gấp', 'Đang làm', 'Hết hạn'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative pb-3 transition ${activeTab === tab ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-pink-500 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Grid bài tập dạng 2 cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTests.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-slate-400 text-sm bg-white rounded-3xl border border-pink-100 shadow-sm">
                            Không có nhiệm vụ nào trong mục "{activeTab}".
                        </div>
                    ) : (
                        filteredTests.map(test => (
                            <div 
                                key={test.id} 
                                onClick={() => navigate(`/test/${test.id}`)}
                                className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer relative overflow-hidden flex items-center justify-between"
                            >
                                {/* Tag trạng thái góc trên phải */}
                                <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-5 py-1 rounded-bl-2xl shadow-sm ${test.tagColor}`}>
                                    {test.statusTag}
                                </div>

                                <div className="flex items-center gap-4 pr-12">
                                    <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                                        ✏️
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700 tracking-tight mb-1">{test.title}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-pink-500 font-semibold">
                                            <span>⏱</span>
                                            <span>{test.deadline ? new Date(test.deadline).toLocaleString() : 'Không giới hạn thời gian'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}