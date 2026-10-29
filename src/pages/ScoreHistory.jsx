import React, { useEffect, useState } from 'react';
import api from '../api';
import StudentSidebar from '../components/StudentSidebar';
import Pagination from '../components/Pagination';
import QuestionDiscussion from '../components/QuestionDiscussion';
import NotificationBell from '../components/NotificationBell';
import { getEmbedYoutubeUrl } from '../utils/youtube';

const PAGE_SIZE = 8;

export default function ScoreHistory() {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [historyError, setHistoryError] = useState('');
    
    // State quản lý Modal xem lại bài làm (Review)
    const [reviewData, setReviewData] = useState(null);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    useEffect(() => {
        setIsLoadingHistory(true);
        setHistoryError('');
        const controller = new AbortController();
        api.get(`/submissions/history/${user.id || 1}`, {
            params: { page, pageSize: PAGE_SIZE, search: debouncedSearchTerm },
            signal: controller.signal
        })
            .then(res => {
                setHistory(res.data.items);
                setTotalCount(res.data.totalCount);
                setPage(res.data.page);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error('Lỗi tải lịch sử làm bài:', err);
                setHistoryError('Không thể tải lịch sử làm bài. Vui lòng thử lại.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingHistory(false);
            });
        return () => {
            controller.abort();
        };
    }, [debouncedSearchTerm, page, user.id]);

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

    const currentQ = reviewData?.questions?.[currentReviewIndex];

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans relative">
            <StudentSidebar />

            {/* Content Chính */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm gap-4">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">My Score & Review</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Lịch sử các bài thi, kết quả chi tiết và thảo luận câu hỏi</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <input 
                                type="text"
                                placeholder="Search enter your keyword..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                            />
                        </div>
                        <NotificationBell />
                    </div>
                </div>

                {/* Danh sách thẻ lịch sử */}
                <div className="space-y-4">
                    {isLoadingHistory ? (
                        <div className="bg-white p-12 rounded-3xl border border-pink-100 text-center text-pink-600 text-xs">
                            Đang tải lịch sử làm bài...
                        </div>
                    ) : historyError ? (
                        <div role="alert" className="bg-white p-12 rounded-3xl border border-rose-100 text-center text-rose-500 text-xs">
                            {historyError}
                        </div>
                    ) : history.length > 0 ? (
                        history.map(item => (
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
                                        className="py-2.5 px-4 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1 cursor-pointer"
                                    >
                                        Xem lại bài làm & Thảo luận
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-3xl border border-pink-100 text-center text-slate-400 text-xs">
                            {debouncedSearchTerm ? 'Không tìm thấy lịch sử phù hợp.' : 'Chưa có lịch sử làm bài nào.'}
                        </div>
                    )}
                </div>

                {!isLoadingHistory && !historyError && (
                    <Pagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalCount={totalCount}
                        onPageChange={setPage}
                    />
                )}
            </div>

            {isLoadingReview && !reviewData && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <p role="status" className="rounded-2xl bg-white px-6 py-4 text-sm font-bold text-pink-600 shadow-xl">
                        Đang tải chi tiết bài làm...
                    </p>
                </div>
            )}

            {/* --- MODAL REVIEW BÀI LÀM (MỞ RỘNG TỐI ĐA CHIỀU RỘNG VÀ CAO) --- */}
            {reviewData && currentQ && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-[96vw] max-w-[96vw] h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-pink-100">
                        
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
                                className="w-8 h-8 rounded-full bg-white border border-pink-200 text-slate-500 font-bold flex items-center justify-center hover:bg-pink-100 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Nội dung câu hỏi (Chia đôi màn hình rộng rãi) */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-pink-100 overflow-hidden">
                            {/* Cột Trái: Passage */}
                            <div className="bg-white p-10 overflow-y-auto">
                                <span className="text-[11px] font-bold text-pink-400 uppercase tracking-widest mb-3 block">Reading Passage</span>
                                <p className="text-sm leading-relaxed text-slate-700 font-serif whitespace-pre-line">
                                    {currentQ.passageText || "Đọc kỹ đoạn văn bản dưới đây và trả lời câu hỏi ở khung bên phải."}
                                </p>
                            </div>

                            {/* Cột Phải: Question & Các đáp án được tô màu + Khung thảo luận */}
                            <div className="bg-white p-10 overflow-y-auto flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                                        {currentQ.questionText}
                                    </h4>

                                    {/* Video giải thích câu hỏi hoặc cả bài thi nếu có (YouTube) */}
                                    {(currentQ.videoExplanationUrl || reviewData.videoExplanationUrl) && (
                                        <div className="mb-6 p-4 bg-pink-50/70 border border-pink-200 rounded-2xl">
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                <span className="text-base">📹</span>
                                                <span className="text-xs font-black text-pink-900">
                                                    {currentQ.videoExplanationUrl ? 'Video giải thích câu này (YouTube)' : 'Video giải thích toàn bộ bài test (YouTube)'}
                                                </span>
                                            </div>
                                            <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-xs bg-black">
                                                <iframe
                                                    src={getEmbedYoutubeUrl(currentQ.videoExplanationUrl || reviewData.videoExplanationUrl)}
                                                    title="Video giải thích"
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    )}

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

                                            let containerStyle = "border-slate-200 bg-white text-slate-700";
                                            let badgeStyle = "border-slate-300 text-slate-500";

                                            if (isCorrectAns) {
                                                containerStyle = "border-emerald-500 bg-emerald-500 text-white font-semibold shadow-md";
                                                badgeStyle = "bg-white text-emerald-600 border-white";
                                            } else if (isUserSelected && !isCorrectAns) {
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

                                    {/* KHUNG THẢO LUẬN / BÌNH LUẬN DƯỚI CÂU HỎI */}
                                    <QuestionDiscussion 
                                        questionId={currentQ.id} 
                                        testTitle={reviewData.testTitle} 
                                    />
                                </div>

                                {/* Footer điều hướng trong Modal */}
                                <div className="flex justify-between items-center mt-8 pt-4 border-t border-pink-100">
                                    <button
                                        disabled={currentReviewIndex === 0}
                                        onClick={() => setCurrentReviewIndex(prev => prev - 1)}
                                        className={`px-5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${currentReviewIndex === 0 ? 'opacity-40 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:bg-pink-50'}`}
                                    >
                                        ‹ Câu trước
                                    </button>

                                    <button
                                        disabled={currentReviewIndex === reviewData.questions.length - 1}
                                        onClick={() => setCurrentReviewIndex(prev => prev + 1)}
                                        className={`px-5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${currentReviewIndex === reviewData.questions.length - 1 ? 'opacity-40 cursor-not-allowed border-slate-200' : 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700'}`}
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
