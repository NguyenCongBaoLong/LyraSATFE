import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getEmbedYoutubeUrl } from '../utils/youtube';
import TextHighlighter from '../components/TextHighlighter';

export default function DoTest() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [testData, setTestData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Trạng thái kiểm tra lượt làm bài
    const [allowed, setAllowed] = useState(true);
    const [attemptInfo, setAttemptInfo] = useState(null);
    const [checkingAttempt, setCheckingAttempt] = useState(true);

    // State quản lý việc ẩn/hiện bảng danh sách câu hỏi (Question Palette Modal hoặc Drawer)
    const [showPalette, setShowPalette] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const studentId = storedUser.id ?? null; // Bắt buộc đăng nhập, không fallback về id 1

    // 1. Khôi phục đáp án từ sessionStorage chống mất khi F5 hoặc thoát giữa chừng
    const [selectedAnswers, setSelectedAnswers] = useState(() => {
        const saved = sessionStorage.getItem(`test_${id}_answers`);
        return saved ? JSON.parse(saved) : {};
    });
    
    const [markedQuestions, setMarkedQuestions] = useState(() => {
        const saved = sessionStorage.getItem(`test_${id}_marks`);
        return saved ? JSON.parse(saved) : {};
    });

    // 2. Khôi phục thời gian làm bài chuẩn xác qua sessionStorage (Chống reset khi F5 hoặc vào lại)
    const [timeLeft, setTimeLeft] = useState(3600);
    const [startTime] = useState(() => {
        const savedStart = sessionStorage.getItem(`test_${id}_start_time`);
        if (savedStart) {
            return parseInt(savedStart, 10);
        }
        const now = Date.now();
        sessionStorage.setItem(`test_${id}_start_time`, now.toString());
        return now;
    });

    const [quizResult, setQuizResult] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm', 
        onConfirm: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const submitHandlerRef = useRef(null);

    const showAlert = useCallback((title, message, onOk = null) => {
        setModalConfig({ isOpen: true, title, message, type: 'alert', onConfirm: onOk });
    }, []);

    const showConfirm = (title, message, onConfirm) => {
        setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });
    };

    const closeModal = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Kiểm tra số lần làm bài trước khi cho phép vào thi
    useEffect(() => {
        if (!studentId) {
            navigate('/');
            return;
        }

        api.get(`/tests/${id}/check-attempts/${studentId}`)
            .then(res => {
                if (!res.data.allowed) {
                    setAllowed(false);
                    setAttemptInfo(res.data);
                }
                setCheckingAttempt(false);
            })
            .catch(err => {
                console.error("Lỗi kiểm tra lượt làm bài:", err);
                setCheckingAttempt(false);
            });
    }, [id, navigate, studentId]);

    // Tự động lưu đáp án khi học sinh thao tác chọn
    useEffect(() => {
        sessionStorage.setItem(`test_${id}_answers`, JSON.stringify(selectedAnswers));
    }, [selectedAnswers, id]);

    useEffect(() => {
        sessionStorage.setItem(`test_${id}_marks`, JSON.stringify(markedQuestions));
    }, [markedQuestions, id]);

    useEffect(() => {
        if (!allowed || !studentId) return;

        api.get(`/tests/${id}`)
            .then(res => {
                const totalDurationSec = (res.data.duration || 60) * 60;
                setTestData({
                    title: res.data.title,
                    duration: res.data.duration,
                    videoExplanationUrl: res.data.videoExplanationUrl || ''
                });

                const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
                const remaining = totalDurationSec - elapsedSec;
                
                if (remaining <= 0) {
                    setTimeLeft(0);
                } else {
                    setTimeLeft(remaining);
                }

                if (res.data.questions && res.data.questions.length > 0) {
                    const formattedQuestions = res.data.questions.map(q => {
                        let rawQuestion = q.questionText || "";
                        let rawPassage = q.passageText || q.explanation || "";

                        if (rawQuestion.includes("Text:")) {
                            const parts = rawQuestion.split("Text:");
                            const mainQ = parts[0].replace(/Question:/gi, '').trim();
                            const passagePart = parts[1].trim();

                            return {
                                id: q.id,
                                questionText: mainQ,
                                passageText: passagePart,
                                optionA: q.optionA,
                                optionB: q.optionB,
                                optionC: q.optionC,
                                optionD: q.optionD
                            };
                        }

                        return {
                            id: q.id,
                            questionText: rawQuestion.replace(/^Question:\s*/i, ''),
                            passageText: rawPassage,
                            optionA: q.optionA,
                            optionB: q.optionB,
                            optionC: q.optionC,
                            optionD: q.optionD
                        };
                    });
                    setQuestions(formattedQuestions);
                }
            })
            .catch(err => {
                console.error("Lỗi tải bài test:", err);
            });
    }, [id, startTime, allowed, studentId]);

    // Đồng hồ đếm ngược
    useEffect(() => {
        if (!allowed || !testData || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                return Math.max(0, prev - 1);
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [allowed, testData, timeLeft]);

    const handleConfirmSubmit = useCallback(async () => {
        if (isSubmittingRef.current) return;
        if (!studentId) {
            showAlert("Chưa đăng nhập", "Vui lòng đăng nhập lại để nộp bài!", () => navigate('/'));
            return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        closeModal();
        try {
            const timeSpentSec = Math.floor((Date.now() - startTime) / 1000);
            const submissionData = {
                studentId: studentId,
                testId: parseInt(id),
                timeSpent: timeSpentSec,
                answers: selectedAnswers
            };

            const response = await api.post('/submissions', submissionData);
            
            sessionStorage.removeItem(`test_${id}_answers`);
            sessionStorage.removeItem(`test_${id}_marks`);
            sessionStorage.removeItem(`test_${id}_start_time`);

            setQuizResult(response.data);
        } catch (error) {
            console.error("Lỗi khi nộp bài:", error);
            showAlert("Lỗi", "Không thể nộp bài lên hệ thống. Vui lòng thử lại!", () => submitHandlerRef.current?.());
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [closeModal, id, navigate, selectedAnswers, showAlert, startTime, studentId]);

    useEffect(() => {
        submitHandlerRef.current = handleConfirmSubmit;
    }, [handleConfirmSubmit]);

    useEffect(() => {
        if (!allowed || !testData || timeLeft > 0 || quizResult) return;
        submitHandlerRef.current();
    }, [allowed, testData, timeLeft, quizResult]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleExitTest = () => {
        showConfirm(
            "Thoát bài thi?",
            "Tiến trình làm bài của bạn đang được lưu tạm. Bạn có chắc chắn muốn thoát về danh sách bài tập không?",
            () => {
                navigate('/mission');
            }
        );
    };

    if (checkingAttempt) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">Đang kiểm tra lượt làm bài...</div>;
    }

    if (!allowed) {
        return (
            <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6 font-sans">
                <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xl text-center max-w-xl w-full">
                    <div className="text-5xl mb-3">📝</div>
                    <h2 className="text-lg font-black text-pink-900 mb-2">Đã hoàn thành bài test</h2>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        {attemptInfo?.message || "Bạn đã dùng hết số lần làm bài cho phép đối với bài test này."}
                    </p>

                    {attemptInfo?.videoExplanationUrl && (
                        <div className="mb-6 p-4 bg-pink-50/70 border border-pink-200 rounded-2xl text-left">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">📹</span>
                                <span className="text-xs font-black text-pink-900">
                                    Video chữa đề & giải thích chi tiết (Cuối bài test)
                                </span>
                            </div>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-xs bg-black">
                                <iframe
                                    src={getEmbedYoutubeUrl(attemptInfo.videoExplanationUrl)}
                                    title="Video chữa đề thi"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => navigate('/score')}
                            className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-pink-600/20 transition cursor-pointer"
                        >
                            Xem lại bài làm & Thảo luận
                        </button>
                        <button 
                            onClick={() => navigate('/mission')}
                            className="flex-1 py-3 bg-white border border-pink-200 hover:bg-pink-50 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
                        >
                            Danh sách nhiệm vụ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!testData || questions.length === 0) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">Đang tải đề thi...</div>;
    }

    const currentQ = questions[currentIndex];

    const handleSelectOption = (optionKey) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQ.id]: optionKey
        });
    };

    const toggleMarkReview = () => {
        setMarkedQuestions({
            ...markedQuestions,
            [currentQ.id]: !markedQuestions[currentQ.id]
        });
    };

    const handleOpenSubmitModal = () => {
        showConfirm(
            "Xác nhận nộp bài",
            `Bạn có chắc chắn muốn kết thúc và nộp bài thi không? (Đã hoàn thành ${Object.keys(selectedAnswers).length}/${questions.length} câu)`,
            handleConfirmSubmit
        );
    };

    if (quizResult) {
        return (
            <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex flex-col items-center justify-center font-sans p-6">
                <div className="bg-white rounded-3xl p-10 max-w-3xl w-full shadow-2xl border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeIn">
                    <div className="text-center md:text-left space-y-4 flex-1">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">You've completed</p>
                            <h2 className="text-xl font-black text-pink-900 mt-1">{testData.title}</h2>
                        </div>
                        <div className="w-40 h-40 mx-auto md:mx-0 bg-pink-50 rounded-3xl border border-pink-200 flex items-center justify-center shadow-inner text-6xl">
                            🐱‍👓
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end flex-1 space-y-6 text-center md:text-right">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Correct Answers:</span>
                            <div className="relative w-28 h-28 mx-auto md:mx-0 rounded-full border-4 border-pink-400 flex items-center justify-center bg-pink-50/50 shadow-inner">
                                <span className="text-2xl font-black text-pink-600">{quizResult.score}%</span>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-2xl border border-pink-100">
                            <span>You get</span>
                            <span className="text-pink-600 font-black text-sm">{quizResult.correctCount}</span>
                            <span>🍈</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => navigate('/score')} className="flex-1 py-3 px-6 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-600/30 transition">
                                My score
                            </button>
                            <button onClick={() => navigate('/mission')} className="flex-1 py-3 px-6 bg-white border border-pink-200 hover:bg-pink-50 text-slate-700 font-extrabold text-xs rounded-2xl transition">
                                Return to Quiz
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video giải thích cho cả bài test sau khi làm xong */}
                {testData.videoExplanationUrl && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-xl border border-pink-100 mt-6 animate-fadeIn">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="text-2xl">📹</span>
                            <div>
                                <h3 className="text-sm md:text-base font-black text-slate-800">
                                    Video chữa đề & giải thích chi tiết
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Giáo viên hướng dẫn phương pháp giải và phân tích các câu hỏi trong đề
                                </p>
                            </div>
                        </div>
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-md bg-black border border-pink-200">
                            <iframe
                                src={getEmbedYoutubeUrl(testData.videoExplanationUrl)}
                                title="Video giải thích bài test"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex flex-col font-sans select-none relative">
            {/* Header */}
            <div className="bg-white border-b border-pink-100 px-6 py-3 flex justify-between items-center shadow-sm">
                <button onClick={handleExitTest} className="text-xs font-bold text-pink-600 hover:text-pink-800 transition flex items-center gap-1 cursor-pointer">
                    ‹ Thoát bài thi
                </button>
                <div className="text-xs font-bold text-slate-700 tracking-wide">
                    Section: {testData.title}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowPalette(!showPalette)}
                        className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <span>📋 Danh sách câu ({Object.keys(selectedAnswers).length}/{questions.length})</span>
                    </button>
                    <div className="bg-pink-50 border border-pink-200 px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-pink-700 flex items-center gap-2 shadow-sm">
                        <span>⏱</span>
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </div>

            {/* Question navigation dialog */}
            {showPalette && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
                    onClick={() => setShowPalette(false)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="question-palette-title"
                        className="w-full max-w-2xl rounded-3xl border border-pink-100 bg-white p-5 shadow-2xl sm:p-7"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 id="question-palette-title" className="text-lg font-black text-pink-900">
                                    Danh sách câu hỏi
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Đã trả lời {Object.keys(selectedAnswers).length}/{questions.length} câu
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPalette(false)}
                                aria-label="Đóng danh sách câu hỏi"
                                className="rounded-full px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-pink-50 hover:text-pink-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500"></span>Đã làm</span>
                            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400"></span>Đánh dấu xem lại</span>
                            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200"></span>Chưa làm</span>
                        </div>
                        <div className="grid max-h-[50vh] grid-cols-5 gap-3 overflow-y-auto p-1 sm:grid-cols-7 md:grid-cols-9">
                            {questions.map((q, idx) => {
                                const isAnswered = selectedAnswers[q.id] !== undefined;
                                const isMarked = markedQuestions[q.id];
                                const isCurrent = currentIndex === idx;

                                let btnBg = "bg-slate-100 text-slate-600 border-slate-200";
                                if (isAnswered) {
                                    btnBg = "bg-emerald-500 text-white border-emerald-500 font-bold shadow-sm";
                                }
                                if (isMarked) {
                                    btnBg = "bg-amber-400 text-white border-amber-400 font-bold shadow-sm";
                                }

                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => {
                                            setCurrentIndex(idx);
                                            setShowPalette(false);
                                        }}
                                        aria-label={`Câu ${idx + 1}${isCurrent ? ', câu hiện tại' : ''}${isAnswered ? ', đã làm' : ', chưa làm'}${isMarked ? ', đã đánh dấu xem lại' : ''}`}
                                        aria-current={isCurrent ? 'step' : undefined}
                                        className={`aspect-square w-full rounded-xl border text-sm font-bold transition ${btnBg} ${isCurrent ? 'ring-2 ring-pink-500 ring-offset-2' : 'hover:opacity-80'}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}

            {/* Khung chia đôi màn hình chuẩn giao diện SAT Bluebook (Ảnh 2) */}
            <div className="flex-1 p-3 md:p-5 bg-slate-100/70 overflow-hidden flex flex-col">
                <TextHighlighter questionId={currentQ?.id} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 h-full overflow-hidden">
                    {/* Cột Trái: Đọc đoạn văn (Passage) - Đẩy lên đầu, không bị trôi ở giữa */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8 overflow-y-auto flex flex-col justify-start">
                        <div className="w-full text-left">
                            <span className="text-[11px] font-bold text-pink-500 uppercase tracking-widest mb-3 block">Reading Passage</span>
                            {currentQ.passageText ? (
                                <div
                                    className="passage-content text-[15px] md:text-base leading-relaxed text-slate-800 font-sans select-text cursor-text text-left"
                                    dangerouslySetInnerHTML={{ __html: currentQ.passageText }}
                                />
                            ) : (
                                <p className="text-[15px] md:text-base leading-relaxed text-slate-800 font-sans select-text cursor-text text-left">
                                    Đọc kỹ câu hỏi và các lựa chọn đáp án ở khung bên phải để hoàn thành câu hỏi.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Cột Phải: Câu hỏi và các lựa chọn đáp án theo chuẩn Ảnh 2 */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
                        <div className="w-full text-left">
                            {/* Header câu hỏi: Badge số câu + Đánh dấu xem lại */}
                            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                        {currentIndex + 1}
                                    </span>
                                    <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                                        CÂU HỎI
                                    </span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={toggleMarkReview}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                                        markedQuestions[currentQ.id] 
                                            ? 'bg-amber-500 text-white shadow-xs' 
                                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    <span>{markedQuestions[currentQ.id] ? '🚩' : '🔖'}</span>
                                    <span>{markedQuestions[currentQ.id] ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
                                </button>
                            </div>

                            {/* Câu hỏi căn đầu theo chuẩn ảnh 2 */}
                            <h3 className="font-semibold text-sm md:text-[15px] text-slate-800 mb-6 leading-relaxed whitespace-pre-line select-text cursor-text">
                                {currentQ.questionText}
                            </h3>

                            {/* Các lựa chọn đáp án A, B, C, D */}
                            <div className="space-y-3">
                                {[
                                    { key: 'A', text: currentQ.optionA },
                                    { key: 'B', text: currentQ.optionB },
                                    { key: 'C', text: currentQ.optionC },
                                    { key: 'D', text: currentQ.optionD }
                                ].map(opt => (
                                    opt.text && (
                                        <div 
                                            key={opt.key}
                                            onClick={() => handleSelectOption(opt.key)}
                                            className={`flex items-center gap-3.5 p-3.5 md:p-4 rounded-2xl border cursor-pointer transition ${
                                                selectedAnswers[currentQ.id] === opt.key 
                                                    ? 'border-pink-500 bg-pink-50/50 shadow-xs ring-1 ring-pink-500' 
                                                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                                            }`}
                                        >
                                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs transition flex-shrink-0 ${
                                                selectedAnswers[currentQ.id] === opt.key 
                                                    ? 'bg-pink-500 text-white border-pink-500 shadow-xs' 
                                                    : 'border-slate-300 text-slate-600 bg-slate-50'
                                            }`}>
                                                {opt.key}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800 select-text cursor-text">{opt.text}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Footer điều hướng ở chân thẻ */}
                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
                            <button 
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex(prev => prev - 1)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                                    currentIndex === 0 
                                        ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400' 
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                ‹ Quay lại
                            </button>

                            <button 
                                onClick={() => setShowPalette(!showPalette)}
                                className="text-xs font-black text-slate-700 hover:text-pink-600 bg-slate-100 hover:bg-pink-50 border border-slate-200 px-4 py-2 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                                <span>CÂU {currentIndex + 1} / {questions.length}</span>
                                <span>︿</span>
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button 
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                    <span>Tiếp</span>
                                    <span>›</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={handleOpenSubmitModal}
                                    className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/20 transition cursor-pointer"
                                >
                                    Nộp bài thi 🏁
                                </button>
                            )}
                        </div>
                    </div>
                </TextHighlighter>
            </div>

            {/* Modal */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-pink-100 text-center transform transition-all">
                        <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
                            {modalConfig.type === 'confirm' ? '📝' : '⏰'}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{modalConfig.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            {modalConfig.message}
                        </p>
                        <div className="flex gap-3 justify-center">
                            {modalConfig.type === 'confirm' ? (
                                <>
                                    <button onClick={closeModal} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition flex-1 cursor-pointer">
                                        Làm tiếp
                                    </button>
                                    <button onClick={() => { if (modalConfig.onConfirm) modalConfig.onConfirm(); }} disabled={isSubmitting} className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition flex-1 cursor-pointer">
                                        {isSubmitting ? 'Đang nộp...' : 'Đồng ý'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => { closeModal(); if (modalConfig.onConfirm) modalConfig.onConfirm(); }} className="px-8 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition w-full cursor-pointer">
                                    Đồng ý
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}