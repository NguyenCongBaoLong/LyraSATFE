import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import QuestionDiscussion from '../../components/QuestionDiscussion';
import { getEmbedYoutubeUrl } from '../../utils/youtube';

const TEST_PAGE_SIZE = 6;
const SUBMISSION_PAGE_SIZE = 8;

export default function TeacherOverview() {
    const { selectedClass } = useOutletContext();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [studentCount, setStudentCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [overviewError, setOverviewError] = useState('');
    const [testPage, setTestPage] = useState(1);
    const [testCount, setTestCount] = useState(0);

    const [selectedTest, setSelectedTest] = useState(null);
    const [testSubmissions, setTestSubmissions] = useState([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [submissionPage, setSubmissionPage] = useState(1);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [submissionError, setSubmissionError] = useState('');

    // State quản lý Modal xem lại bài làm & thảo luận dành cho Giáo viên
    const [reviewData, setReviewData] = useState(null);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [isViewingVideo, setIsViewingVideo] = useState(false);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const handleDeleteTest = async (testId, testTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài test "${testTitle}" không? Toàn bộ câu hỏi, bài làm và điểm số của học sinh trong bài test này sẽ bị xóa.`)) {
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.delete(`/tests/${testId}`, {
                params: { userId: user.id }
            });
            setTests(prev => prev.filter(t => t.id !== testId));
            setTestCount(prev => Math.max(0, prev - 1));
            if (selectedTest?.id === testId) {
                setSelectedTest(null);
            }
            alert(`Đã xóa bài test "${testTitle}" thành công!`);
        } catch (err) {
            console.error("Lỗi khi xóa bài test:", err);
            alert(err.response?.data?.message || "Không thể xóa bài test. Vui lòng thử lại!");
        }
    };

    const handleOpenReview = async (submissionId) => {
        setIsLoadingReview(true);
        try {
            const res = await api.get(`/submissions/${submissionId}/review`);
            setReviewData(res.data);
            setCurrentReviewIndex(0);
            setIsViewingVideo(false);
        } catch (err) {
            console.error("Lỗi tải chi tiết bài làm:", err);
            alert("Không thể tải chi tiết bài làm!");
        } finally {
            setIsLoadingReview(false);
        }
    };

    const currentQ = reviewData?.questions?.[currentReviewIndex];

    useEffect(() => {
        if (!selectedClass) {
            setIsLoading(false);
            setTests([]);
            setTestCount(0);
            setStudentCount(0);
            return;
        }

        setIsLoading(true);
        setOverviewError('');
        const controller = new AbortController();

        Promise.all([
            api.get(`/tests/class/${selectedClass}`, {
                params: { page: testPage, pageSize: TEST_PAGE_SIZE },
                signal: controller.signal
            }),
            api.get(`/tests/class/${selectedClass}/students`, {
                params: { page: 1, pageSize: 1 },
                signal: controller.signal
            })
        ])
        .then(([testsRes, studentsRes]) => {
            setTests(testsRes.data.items);
            setTestCount(testsRes.data.totalCount);
            setTestPage(testsRes.data.page);
            setStudentCount(studentsRes.data.totalCount);
        })
        .catch(err => {
            if (err.code === 'ERR_CANCELED') return;
            console.error("Lỗi tải dữ liệu tổng quan lớp:", err);
            setOverviewError('Không thể tải dữ liệu tổng quan lớp. Vui lòng thử lại.');
        })
        .finally(() => {
            if (!controller.signal.aborted) setIsLoading(false);
        });

        return () => {
            controller.abort();
        };
    }, [selectedClass, testPage]);

    useEffect(() => {
        if (!selectedTest) return;

        setSubmissionError('');
        const controller = new AbortController();
        api.get(`/tests/${selectedTest.id}/submissions`, {
            params: { page: submissionPage, pageSize: SUBMISSION_PAGE_SIZE },
            signal: controller.signal
        }).then(res => {
                setTestSubmissions(res.data.items);
                setSubmissionCount(res.data.totalCount);
                setSubmissionPage(res.data.page);
            }).catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error("Lỗi tải chi tiết bài nộp:", err);
                setSubmissionError('Không thể tải danh sách bài nộp. Vui lòng thử lại.');
            }).finally(() => {
                if (!controller.signal.aborted) setIsLoadingDetail(false);
            });
        return () => {
            controller.abort();
        };
    }, [selectedTest, submissionPage]);

    const handleViewTestDetail = (test) => {
        setTestSubmissions([]);
        setSubmissionCount(0);
        setIsLoadingDetail(true);
        setSubmissionPage(1);
        setSelectedTest(test);
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
                    <p className="text-2xl font-black text-pink-600 mt-2">{studentCount} Học viên</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài test đã giao</h3>
                    <p className="text-2xl font-black text-pink-600 mt-2">{testCount} Bài</p>
                </div>
            </div>

            {/* Danh sách bài test */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-pink-900 mb-4 uppercase tracking-wider">Danh sách bài test đã giao (Bấm vào bài để xem chi tiết)</h3>
                {overviewError ? (
                    <p role="alert" className="text-xs text-rose-500 py-4 text-center">{overviewError}</p>
                ) : tests.length === 0 ? (
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
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTest(test.id, test.title);
                                        }}
                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                        title="Xóa bài test này"
                                    >
                                        <span>🗑️</span>
                                        <span>Xóa</span>
                                    </button>
                                    <span className="text-xs font-bold text-slate-400">Chi tiết ›</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!overviewError && (
                    <Pagination
                        page={testPage}
                        pageSize={TEST_PAGE_SIZE}
                        totalCount={testCount}
                        onPageChange={setTestPage}
                    />
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
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTest(selectedTest.id, selectedTest.title)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                                    title="Xóa bài test này khỏi hệ thống"
                                >
                                    <span>🗑️</span>
                                    <span>Xóa bài test</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedTest(null)}
                                    className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {isLoadingDetail ? (
                            <div className="py-12 text-center text-xs font-bold text-pink-600">Đang tải danh sách bài nộp...</div>
                        ) : submissionError ? (
                            <div role="alert" className="py-12 text-center text-xs text-rose-500">{submissionError}</div>
                        ) : testSubmissions.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">
                                Chưa có học sinh nào nộp bài cho bài test này.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testSubmissions.map(sub => (
                                    <div key={sub.id} className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                                            <button
                                                type="button"
                                                onClick={() => handleOpenReview(sub.id)}
                                                className="py-2.5 px-3.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-2xl transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                                title="Xem chi tiết bài làm và giải đáp thảo luận"
                                            >
                                                <span>💬</span>
                                                <span>Xem bài & Thảo luận</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoadingDetail && !submissionError && (
                            <Pagination
                                page={submissionPage}
                                pageSize={SUBMISSION_PAGE_SIZE}
                                totalCount={submissionCount}
                                onPageChange={nextPage => {
                                    setIsLoadingDetail(true);
                                    setTestSubmissions([]);
                                    setSubmissionPage(nextPage);
                                }}
                            />
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
            {/* --- MODAL XEM CHI TIẾT BÀI LÀM & QUẢN TRỊ BÌNH LUẬN CHO GIÁO VIÊN --- */}
            {reviewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-[96vw] max-w-[96vw] h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-pink-100">
                        {/* Header Modal */}
                        <div className="bg-pink-50 border-b border-pink-100 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="text-xs font-bold text-pink-600 block">
                                        {isViewingVideo ? '🎬 Cuối bài - Video chữa đề & Tổng kết' : `Câu ${currentReviewIndex + 1} của ${reviewData.questions.length}`}
                                    </span>
                                    <h3 className="text-sm font-extrabold text-slate-800">{reviewData.testTitle}</h3>
                                </div>
                            </div>

                            {/* Danh sách nhanh các câu hỏi + Tab Video Cuối bài */}
                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full md:max-w-md py-1">
                                {reviewData.questions.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => {
                                            setIsViewingVideo(false);
                                            setCurrentReviewIndex(idx);
                                        }}
                                        className={`w-7 h-7 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer flex-shrink-0 ${
                                            !isViewingVideo && currentReviewIndex === idx
                                                ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-400'
                                                : q.isCorrect
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                        }`}
                                        title={`Câu ${idx + 1}: ${q.isCorrect ? 'Đúng' : 'Sai'}`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}

                                {reviewData.videoExplanationUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setIsViewingVideo(true)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                                            isViewingVideo
                                                ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-400'
                                                : 'bg-pink-100 hover:bg-pink-200 text-pink-700'
                                        }`}
                                        title="Xem video chữa toàn bộ đề thi (ở cuối bài)"
                                    >
                                        <span>📹</span>
                                        <span>Video cuối bài</span>
                                    </button>
                                )}
                            </div>

                            <button 
                                type="button"
                                onClick={() => setReviewData(null)}
                                className="w-8 h-8 rounded-full bg-white border border-pink-200 text-slate-500 font-bold flex items-center justify-center hover:bg-pink-100 transition cursor-pointer self-end md:self-auto"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Thân Modal */}
                        {isViewingVideo ? (
                            <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto flex flex-col items-center">
                                <div className="max-w-4xl w-full space-y-6 animate-fadeIn">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-pink-50/70 p-6 rounded-3xl border border-pink-200">
                                        <div>
                                            <span className="text-xs font-bold text-pink-600 uppercase tracking-widest block mb-1">
                                                🎬 Video chữa đề & Hướng dẫn giải chi tiết (Cuối bài)
                                            </span>
                                            <h2 className="text-lg md:text-xl font-black text-slate-800">{reviewData.testTitle}</h2>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-pink-200 shadow-sm flex-shrink-0">
                                            <div className="text-center">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm số</span>
                                                <span className="text-lg font-black text-pink-600">{reviewData.score}%</span>
                                            </div>
                                            <div className="h-8 w-px bg-pink-100"></div>
                                            <div className="text-center">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Số câu đúng</span>
                                                <span className="text-lg font-black text-emerald-600">{reviewData.correctCount}/{reviewData.totalQuestions}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video YouTube */}
                                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl bg-black border-2 border-pink-200">
                                        <iframe
                                            src={getEmbedYoutubeUrl(reviewData.videoExplanationUrl)}
                                            title="Video chữa đề thi ở cuối bài"
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-pink-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsViewingVideo(false);
                                                setCurrentReviewIndex(reviewData.questions.length - 1);
                                            }}
                                            className="px-6 py-2.5 rounded-2xl border border-slate-200 hover:bg-pink-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                            ‹ Quay lại câu {reviewData.questions.length}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReviewData(null)}
                                            className="px-6 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition cursor-pointer"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : currentQ ? (
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-pink-100 overflow-hidden">
                                {/* Cột Trái: Passage - Căn đầu theo chuẩn */}
                                <div className="bg-white p-6 md:p-8 overflow-y-auto flex flex-col justify-start">
                                    <span className="text-[11px] font-bold text-pink-500 uppercase tracking-widest mb-3 block">Reading Passage</span>
                                    <p className="text-[15px] leading-relaxed text-slate-800 font-sans whitespace-pre-line text-left">
                                        {currentQ.passageText || "Đọc kỹ câu hỏi và các lựa chọn đáp án ở khung bên phải."}
                                    </p>
                                </div>

                                {/* Cột Phải: Question & Discussion */}
                                <div className="bg-white p-10 overflow-y-auto flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                                            {currentQ.questionText}
                                        </h4>

                                        {currentQ.videoExplanationUrl && (
                                            <div className="mb-6 p-4 bg-pink-50/70 border border-pink-200 rounded-2xl">
                                                <div className="flex items-center gap-1.5 mb-2.5">
                                                    <span className="text-base">📹</span>
                                                    <span className="text-xs font-black text-pink-900">Video giải thích riêng câu này</span>
                                                </div>
                                                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-xs bg-black">
                                                    <iframe
                                                        src={getEmbedYoutubeUrl(currentQ.videoExplanationUrl)}
                                                        title="Video giải thích"
                                                        className="w-full h-full"
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
                                                    <div key={opt.key} className={`flex items-center gap-4 p-4 rounded-2xl border transition ${containerStyle}`}>
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
                                            type="button"
                                            disabled={currentReviewIndex === 0}
                                            onClick={() => setCurrentReviewIndex(prev => prev - 1)}
                                            className={`px-5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${currentReviewIndex === 0 ? 'opacity-40 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:bg-pink-50'}`}
                                        >
                                            ‹ Câu trước
                                        </button>

                                        {currentReviewIndex < reviewData.questions.length - 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentReviewIndex(prev => prev + 1)}
                                                className="px-5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
                                            >
                                                Câu tiếp ›
                                            </button>
                                        ) : reviewData.videoExplanationUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsViewingVideo(true)}
                                                className="px-5 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/20 hover:opacity-95 flex items-center gap-1.5"
                                            >
                                                <span>Xem video chữa đề (Cuối bài)</span>
                                                <span>📹 ›</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="px-5 py-2 rounded-2xl text-xs font-bold border transition border-slate-200 opacity-40 cursor-not-allowed"
                                            >
                                                Hết bài thi
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}