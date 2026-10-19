import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function TeacherOverview() {
    const { selectedClass } = useOutletContext();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedTest, setSelectedTest] = useState(null);
    const [testSubmissions, setTestSubmissions] = useState([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    useEffect(() => {
        if (!selectedClass) return;
        setIsLoading(true);

        Promise.all([
            api.get(`/tests/class/${selectedClass}`),
            api.get(`/tests/class/${selectedClass}/students`)
        ])
        .then(([testsRes, studentsRes]) => {
            setTests(testsRes.data);
            setStudents(studentsRes.data);
        })
        .catch(err => console.error("Lỗi tải dữ liệu tổng quan lớp:", err))
        .finally(() => setIsLoading(false));

    }, [selectedClass]);

    const handleViewTestDetail = async (test) => {
        setSelectedTest(test);
        setIsLoadingDetail(true);
        try {
            const res = await api.get(`/tests/${test.id}/submissions`);
            setTestSubmissions(res.data);
        } catch (err) {
            console.error("Lỗi tải chi tiết bài nộp:", err);
            setTestSubmissions([]);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    if (isLoading) {
        return <div className="text-pink-600 font-bold text-xs">Đang tải dữ liệu tổng quan...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header & Thống kê đã được tinh chỉnh đẹp mắt và cân đối */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-black text-pink-900">Tổng quan lớp học</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Đang làm việc với lớp: <strong className="text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-lg border border-pink-100">{selectedClass}</strong>
                    </p>
                </div>

                {/* Nhóm nút hành động được gom nhóm gọn gàng */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => navigate('/teacher/vocab-upload')}
                        className="flex-1 sm:flex-none bg-white border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300 text-pink-700 text-xs font-extrabold px-4 py-2.5 rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <span>📖</span>
                        <span>+ Tải lên Vocab</span>
                    </button>

                    <button 
                        onClick={() => navigate('/teacher/upload')}
                        className="flex-1 sm:flex-none bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl transition shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <span>📝</span>
                        <span>+ Giao bài test mới</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã lớp hiện tại</h3>
                    <p className="text-2xl font-black text-pink-600 mt-2">{selectedClass || 'N/A'}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số học viên</h3>
                    <p className="text-2xl font-black text-pink-600 mt-2">{students.length} Học viên</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài test đã giao</h3>
                    <p className="text-2xl font-black text-pink-600 mt-2">{tests.length} Bài</p>
                </div>
            </div>

            {/* Danh sách bài test */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-pink-900 mb-4 uppercase tracking-wider">Danh sách bài test đã giao (Bấm vào bài để xem chi tiết)</h3>
                {tests.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Chưa có bài test nào được giao cho lớp này.</p>
                ) : (
                    <div className="space-y-3">
                        {tests.map(test => (
                            <div 
                                key={test.id} 
                                onClick={() => handleViewTestDetail(test)}
                                className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 hover:border-pink-300 hover:bg-pink-50/80 transition flex justify-between items-center cursor-pointer shadow-sm"
                            >
                                <div>
                                    <h4 className="text-xs font-extrabold text-slate-800">{test.title}</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Thời gian: {test.duration} phút | Loại: {test.testType}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-pink-600 bg-white px-3 py-1 rounded-xl border border-pink-200 shadow-sm">
                                        {test.deadline ? `Hạn: ${new Date(test.deadline).toLocaleString()}` : 'Không giới hạn'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">Chi tiết ›</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Chi tiết Bài làm Học sinh */}
            {selectedTest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100 relative">
                        <div className="flex justify-between items-start mb-6 border-b border-pink-100 pb-4">
                            <div>
                                <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Chi tiết kết quả bài test</span>
                                <h2 className="text-lg font-black text-pink-900 mt-1">{selectedTest.title}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Lớp: {selectedClass} | Thời lượng đề: {selectedTest.duration} phút</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTest(null)}
                                className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {isLoadingDetail ? (
                            <div className="py-12 text-center text-xs font-bold text-pink-600">Đang tải danh sách bài nộp...</div>
                        ) : testSubmissions.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">Chưa có học sinh nào nộp bài cho bài test này.</div>
                        ) : (
                            <div className="space-y-3">
                                {testSubmissions.map((sub, index) => (
                                    <div key={index} className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-sm shadow-inner">
                                                {sub.studentName ? sub.studentName.charAt(0).toUpperCase() : 'HS'}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800">{sub.studentName}</h4>
                                                <p className="text-[11px] text-slate-400">Đã làm lúc: {new Date(sub.submittedAt).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Thời gian làm bài</span>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {Math.floor(sub.timeSpent / 60)} phút {sub.timeSpent % 60} giây
                                                </span>
                                            </div>
                                            <div className="bg-white border border-pink-200 px-4 py-2 rounded-2xl text-right shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Số câu đúng</span>
                                                <span className="text-xs font-black text-pink-600">{sub.correctCount} / {sub.totalQuestions} câu ({sub.score}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-pink-100 text-right">
                            <button 
                                onClick={() => setSelectedTest(null)}
                                className="px-6 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-pink-600/20"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}