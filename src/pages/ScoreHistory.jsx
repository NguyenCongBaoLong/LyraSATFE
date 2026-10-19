import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ScoreHistory() {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State quản lý Modal xem lại bài làm (Review)
    const [reviewData, setReviewData] = useState(null);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        api.get(`/submissions/history/${user.id || 1}`)
            .then(res => setHistory(res.data))
            .catch(err => console.log(err));
    }, [user.id]);

    // Gọi API lấy thông tin chi tiết bài nộp để xem lại
    const handleOpenReview = async (submissionId) => {
        setIsLoadingReview(true);
        try {
            const res = await api.get(`/submissions/${submissionId}/review`);
            setReviewData(res.data);
            setCurrentReviewIndex(0);
        } catch (err) {
            console.error("Lỗi tải chi tiết bài làm:", err);
            alert("Không thể tải chi tiết bài làm!");
        } finally {
            setIsLoadingReview(false);
        }
    };

    const filteredHistory = history.filter(item => 
        item.testTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentQ = reviewData?.questions?.[currentReviewIndex];

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans relative">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm">
                <div>
                    <div className="text-xl font-black text-pink-600 tracking-wider mb-8">LYRA SAT</div>
                    <div className="space-y-2">
                        <button onClick={() => navigate('/home')} className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm">Trang chủ</button>
                        <button onClick={() => navigate('/mission')} className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm">Nhiệm vụ</button>
                        <button onClick={() => navigate('/score')} className="w-full text-left px-4 py-3 rounded-2xl bg-pink-500 text-white font-bold transition text-sm shadow-md shadow-pink-500/20">Điểm số</button>
                        <button onClick={() => navigate('/vocab')} className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm">Từ vựng</button>
                        <button onClick={() => navigate('/account')} className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm">Hồ sơ</button>
                    </div>
                </div>
                <div className="bg-pink-50/60 p-4 rounded-3xl border border-pink-100 text-center">
                    <p className="text-[11px] font-bold text-pink-700">Lyra</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Chúc bạn học tập hiệu quả!</p>
                </div>
            </div>

            {/* Content Chính */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm gap-4">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">My Score & Review</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Lịch sử các bài thi và kết quả chi tiết của bạn</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <input 
                                type="text"
                                placeholder="Search enter your keyword..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                            />
                        </div>
                        <button className="text-xs bg-pink-500 hover:bg-pink-600 text-white font-bold px-4 py-2.5 rounded-2xl transition shadow-sm shadow-pink-500/20 whitespace-nowrap">
                            Tìm kiếm
                        </button>
                    </div>
                </div>

                {/* Danh sách thẻ lịch sử */}
                <div className="space-y-4">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map(item => (
                            <div 
                                key={item.id} 
                                className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
                            >
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-100">
                                    <div 
                                        className="h-full bg-pink-500 transition-all duration-500" 
                                        style={{ width: `${item.score || ((item.correctCount / item.totalQuestions) * 100)}%` }}
                                    ></div>
                                </div>

                                <div className="space-y-1.5 flex-1">
                                    <h3 className="text-base font-extrabold text-slate-800">{item.testTitle}</h3>
                                    <p className="text-xs text-slate-400">
                                        Đã làm lúc: <span className="font-semibold text-slate-600">{new Date(item.submittedAt).toLocaleString()}</span>
                                    </p>
                                    <p className="text-xs text-slate-600 font-bold">
                                        Tổng câu trả lời đúng: <span className="text-pink-600">{item.correctCount} / {item.totalQuestions}</span> 
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <button 
                                        onClick={() => handleOpenReview(item.id)}
                                        className="py-2.5 px-4 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1"
                                    >
                                        Xem lại bài làm 
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-3xl border border-pink-100 text-center text-slate-400 text-xs">
                            Chưa có lịch sử làm bài nào.
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL REVIEW BÀI LÀM (HIỂN THỊ CHUẨN DẠNG ẢNH MẪU) --- */}
            {reviewData && currentQ && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-pink-100">
                        
                        {/* Header Modal */}
                        <div className="bg-pink-50 border-b border-pink-100 px-6 py-4 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-pink-600 block">
                                    Câu {currentReviewIndex + 1} của {reviewData.questions.length}
                                </span>
                                <h3 className="text-sm font-extrabold text-slate-800">{reviewData.testTitle}</h3>
                            </div>
                            <button 
                                onClick={() => setReviewData(null)}
                                className="w-8 h-8 rounded-full bg-white border border-pink-200 text-slate-500 font-bold flex items-center justify-center hover:bg-pink-100 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Nội dung câu hỏi (Chia đôi màn hình) */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-pink-100 overflow-hidden">
                            {/* Cột Trái: Passage */}
                            <div className="bg-white p-8 overflow-y-auto">
                                <span className="text-[11px] font-bold text-pink-400 uppercase tracking-widest mb-3 block">Reading Passage</span>
                                <p className="text-sm leading-relaxed text-slate-700 font-serif whitespace-pre-line">
                                    {currentQ.passageText || "Không có đoạn văn bản đi kèm."}
                                </p>
                            </div>

                            {/* Cột Phải: Question & Các đáp án được tô màu */}
                            <div className="bg-white p-8 overflow-y-auto flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                                        {currentQ.questionText}
                                    </h4>

                                    {/* Danh sách lựa chọn A, B, C, D */}
                                    <div className="space-y-3">
                                        {[
                                            { key: 'A', text: currentQ.optionA },
                                            { key: 'B', text: currentQ.optionB },
                                            { key: 'C', text: currentQ.optionC },
                                            { key: 'D', text: currentQ.optionD }
                                        ].map(opt => {
                                            if (!opt.text) return null;

                                            const isCorrectAns = opt.key.toUpperCase() === currentQ.correctAnswer.toUpperCase();
                                            const isUserSelected = opt.key.toUpperCase() === currentQ.selectedAnswer.toUpperCase();

                                            // Xác định style màu sắc
                                            let containerStyle = "border-slate-200 bg-white text-slate-700";
                                            let badgeStyle = "border-slate-300 text-slate-500";

                                            if (isCorrectAns) {
                                                // Đáp án ĐÚNG -> Tô màu xanh lá lá (chuẩn mẫu ảnh)
                                                containerStyle = "border-emerald-500 bg-emerald-500 text-white font-semibold shadow-md";
                                                badgeStyle = "bg-white text-emerald-600 border-white";
                                            } else if (isUserSelected && !isCorrectAns) {
                                                // Học sinh chọn SAI -> Tô màu đỏ
                                                containerStyle = "border-rose-500 bg-rose-500 text-white font-semibold shadow-md";
                                                badgeStyle = "bg-white text-rose-600 border-white";
                                            }

                                            return (
                                                <div 
                                                    key={opt.key}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition ${containerStyle}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${badgeStyle}`}>
                                                        {opt.key}
                                                    </div>
                                                    <span className="text-sm leading-relaxed">{opt.text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer điều hướng trong Modal */}
                                <div className="flex justify-between items-center mt-8 pt-4 border-t border-pink-100">
                                    <button
                                        disabled={currentReviewIndex === 0}
                                        onClick={() => setCurrentReviewIndex(prev => prev - 1)}
                                        className={`px-5 py-2 rounded-2xl text-xs font-bold border transition ${currentReviewIndex === 0 ? 'opacity-40 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:bg-pink-50'}`}
                                    >
                                        ‹ Câu trước
                                    </button>

                                    <button
                                        disabled={currentReviewIndex === reviewData.questions.length - 1}
                                        onClick={() => setCurrentReviewIndex(prev => prev + 1)}
                                        className={`px-5 py-2 rounded-2xl text-xs font-bold border transition ${currentReviewIndex === reviewData.questions.length - 1 ? 'opacity-40 cursor-not-allowed border-slate-200' : 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700'}`}
                                    >
                                        Câu tiếp ›
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}