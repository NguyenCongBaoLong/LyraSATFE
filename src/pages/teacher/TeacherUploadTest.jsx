import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';
import TestVideoModal from '../../components/TestVideoModal';

// Số video chữa bài của một đề (đề cũ chỉ có 1 link nên coi như 1 video).
const videoCountOf = (test) =>
    test?.videoCount ?? (test?.videoExplanationUrl ? 1 : 0);

export default function TeacherUploadTest() {
    const { selectedClass } = useOutletContext();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(60);
    const [testType, setTestType] = useState('PracticeTest');
    const [deadline, setDeadline] = useState('');
    const [maxAttempts, setMaxAttempts] = useState(''); // Để trống = Vô hạn
    const [videoExplanationUrl, setVideoExplanationUrl] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State danh sách bài test đã giao (để giáo viên xóa khi giao nhầm)
    const [recentTests, setRecentTests] = useState([]);
    const [isLoadingTests, setIsLoadingTests] = useState(false);
    const [testRefresh, setTestRefresh] = useState(0);

    // Đề đang mở hộp thoại gắn video chữa bài (thêm video SAU khi đã up đề)
    const [videoTest, setVideoTest] = useState(null);

    useEffect(() => {
        if (!selectedClass) return;
        setIsLoadingTests(true);
        api.get(`/tests/class/${selectedClass}`, { params: { page: 1, pageSize: 20 } })
            .then(res => {
                setRecentTests(res.data.items || []);
            })
            .catch(err => console.error("Lỗi tải danh sách bài test:", err))
            .finally(() => setIsLoadingTests(false));
    }, [selectedClass, testRefresh]);

    const handleDeleteAssignedTest = async (testId, testTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài test "${testTitle}" (giao nhầm) không?\nToàn bộ dữ liệu câu hỏi và bài làm của bài này sẽ bị xóa khỏi lớp ${selectedClass}.`)) {
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.delete(`/tests/${testId}`, {
                params: { userId: user.id }
            });
            showAlert("Đã xóa! 🗑️", `Đã xóa bài test "${testTitle}" thành công!`);
            setTestRefresh(prev => prev + 1);
        } catch (err) {
            console.error("Lỗi khi xóa bài test:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể xóa bài test. Vui lòng thử lại!", "error");
        }
    };

    // STATE QUẢN LÝ MODAL THÔNG BÁO TÙY CHỈNH
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success', // 'success' hoặc 'error'
        onConfirm: null
    });

    const showAlert = (title, message, type = 'success', onOk = null) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: onOk
        });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.onConfirm) {
            modalConfig.onConfirm();
        }
    };

    const handleUploadTest = async (e) => {
        e.preventDefault();
        if (!file) {
            showAlert("Thiếu thông tin", "Vui lòng chọn file bài test Word (.docx) trước khi tải lên!", "error");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('classCode', selectedClass);
        formData.append('duration', duration);
        formData.append('testType', testType);
        if (deadline) formData.append('deadline', new Date(deadline).toISOString());
        
        // Nếu có nhập số lần làm bài thì gửi lên, nếu để trống thì không gửi (để backend nhận null = vô hạn)
        if (maxAttempts && parseInt(maxAttempts) > 0) {
            formData.append('maxAttempts', maxAttempts);
        }

        if (videoExplanationUrl) formData.append('videoExplanationUrl', videoExplanationUrl.trim());
        formData.append('file', file);

        try {
            await api.post('/tests/upload-test', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Hiển thị modal thông báo thành công
            showAlert(
                "Thành công! 🎉",
                `Đã đăng bài test cho lớp ${selectedClass} thành công! ${maxAttempts ? `(Giới hạn: ${maxAttempts} lần làm)` : '(Không giới hạn số lần làm)'}`,
                "success",
                () => {
                    setTitle('');
                    setDeadline('');
                    setMaxAttempts('');
                    setVideoExplanationUrl('');
                    setFile(null);
                    setTestRefresh(prev => prev + 1);
                    navigate('/teacher/overview');
                }
            );
        } catch (err) {
            const data = err.response?.data;
            const issues = Array.isArray(data?.issues) ? data.issues : [];
            const baseMessage = data?.message
                || 'Lỗi khi tải lên bài test hoặc đọc file Word. Vui lòng kiểm tra lại định dạng file!';
            const detail = issues.length > 0
                ? `\n\nCác câu cần sửa:\n${issues.slice(0, 8).map((line) => `- ${line}`).join('\n')}`
                : '';
            showAlert(
                issues.length > 0 ? 'File Word có lỗi đáp án' : 'Đã xảy ra lỗi',
                baseMessage + detail,
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl font-sans select-none">
        {/* Card 1: Giao bài test mới bằng file Word */}
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm relative">
            <h2 className="text-lg font-bold mb-2 text-pink-900">Giao bài test mới bằng file Word</h2>
            <p className="text-xs text-slate-400 mb-6">Bài test sẽ được lưu vào cơ sở dữ liệu và gán cho lớp <strong className="text-pink-600">{selectedClass}</strong>.</p>
            
            <form onSubmit={handleUploadTest} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tiêu đề bài test</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ví dụ: Practice Test 01 - Reading & Writing" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Thời gian (Phút)</label>
                        <input 
                            type="number" 
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Loại bài test</label>
                        <select 
                            value={testType}
                            onChange={(e) => setTestType(e.target.value)}
                            className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="PracticeTest">Full Practice Test</option>
                            <option value="ModuleQuiz">Quiz chuyên đề</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Số lần làm tối đa</label>
                        <input 
                            type="number" 
                            min="1"
                            placeholder="Để trống = Vô hạn"
                            value={maxAttempts}
                            onChange={(e) => setMaxAttempts(e.target.value)}
                            className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-bold text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Hạn nộp bài (Deadline)</label>
                    <input 
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Link Video YouTube chữa đề & giải thích chi tiết (ở cuối bài test)
                    </label>
                    <input 
                        type="url"
                        placeholder="Ví dụ: https://www.youtube.com/watch?v=aqz-KE-bpKQ"
                        value={videoExplanationUrl}
                        onChange={(e) => setVideoExplanationUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                        Có thể bỏ trống và gắn video sau: vào danh sách <strong>Bài test đã giao</strong> bên dưới, bấm nút <strong>🎬 Video chữa bài</strong>.
                        Học sinh sẽ xem được video này ở cuối bài sau khi hoàn thành hoặc nộp bài test.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tải lên file câu hỏi (.docx Word)</label>
                    <input 
                        type="file" 
                        accept=".docx"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
                    />
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4 text-[11px] leading-relaxed text-slate-600 space-y-1">
                    <p><span className="font-bold text-pink-700">Mở đầu câu:</span> Question: hoặc Question 1. đều được, <span className="font-bold">không bắt buộc</span> ghi số thứ tự.</p>
                    <p><span className="font-bold text-pink-700">Trắc nghiệm:</span> đủ 4 đáp án A, B, C, D và dòng đáp án, ví dụ <span className="font-bold">ANSWER: B</span>.</p>
                    <p><span className="font-bold text-pink-700">Tự luận (SAT Math):</span> không có A-D, chỉ ghi đáp án, ví dụ <span className="font-bold">ANSWER: 3/2 | 1.5 | 1,5</span>. Dấu gạch đứng ngăn các cách ghi đều được tính đúng.</p>
                    <p><span className="font-bold text-pink-700">Một đề có thể trộn</span> câu trắc nghiệm và câu tự luận.</p>
                    <p><span className="font-bold text-pink-700">Công thức nhiều dòng:</span> mỗi dòng là một đoạn riêng, hệ thống giữ nguyên cách dòng khi hiển thị.</p>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-pink-500 hover:bg-pink-600 transition rounded-2xl font-extrabold text-sm text-white shadow-lg shadow-pink-500/30 mt-4 cursor-pointer"
                >
                    {isSubmitting ? 'Đang xử lý file Word...' : `🚀 Tải lên & Giao bài cho lớp ${selectedClass}`}
                </button>
            </form>
        </div>

        {/* Card 2: Danh sách bài test đã giao - Hỗ trợ Xóa khi giáo viên giao nhầm */}
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-pink-100 pb-4">
                <div>
                    <h3 className="text-base font-black text-pink-900 flex items-center gap-2">
                        <span>📋</span>
                        <span>Bài test đã giao cho lớp {selectedClass}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Nếu giao lộn đề thi hoặc nhầm lớp, bạn có thể bấm nút <strong className="text-rose-600">"Xóa bài"</strong> bên dưới để hủy bài ngay.
                    </p>
                </div>
                <span className="text-xs font-bold bg-pink-50 text-pink-700 px-3 py-1 rounded-xl border border-pink-200">
                    {recentTests.length} bài test
                </span>
            </div>

            {isLoadingTests ? (
                <div className="text-center py-8 text-xs font-bold text-pink-600">
                    Đang tải danh sách bài test...
                </div>
            ) : recentTests.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic bg-pink-50/30 rounded-2xl border border-pink-100">
                    Lớp này hiện chưa có bài test nào được giao.
                </div>
            ) : (
                <div className="space-y-3">
                    {recentTests.map((t) => (
                        <div 
                            key={t.id}
                            className="p-4 rounded-2xl bg-pink-50/30 border border-pink-100 hover:border-pink-200 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                        >
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800">{t.title}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                                    <span>⏱ {t.duration} phút</span>
                                    <span>•</span>
                                    <span>{t.deadline ? `Hạn: ${new Date(t.deadline).toLocaleString()}` : 'Không giới hạn thời hạn'}</span>
                                    {videoCountOf(t) > 0 ? (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                            🎬 {videoCountOf(t) > 1 ? `${videoCountOf(t)} video chữa bài` : 'Đã có video chữa bài'}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                            Chưa có video
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
                                <button
                                    type="button"
                                    onClick={() => setVideoTest(t)}
                                    className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
                                        videoCountOf(t) > 0
                                            ? 'bg-white hover:bg-pink-50 text-slate-600 border-pink-200'
                                            : 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500'
                                    }`}
                                    title="Thêm, đổi hoặc gỡ video chữa bài cho đề này"
                                >
                                    <span>🎬</span>
                                    <span>
                                        {videoCountOf(t) > 1
                                            ? `${videoCountOf(t)} video`
                                            : videoCountOf(t) === 1
                                                ? 'Đổi video'
                                                : 'Video chữa bài'}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteAssignedTest(t.id, t.title)}
                                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                                    title="Xóa bài test này nếu đã lỡ giao nhầm"
                                >
                                    <span>🗑️</span>
                                    <span>Xóa bài (Giao nhầm)</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* HỘP THOẠI GẮN VIDEO CHỮA BÀI CHO ĐỀ ĐÃ GIAO */}
        <TestVideoModal
            test={videoTest}
            isOpen={Boolean(videoTest)}
            onClose={() => setVideoTest(null)}
            onSaved={() => setTestRefresh(prev => prev + 1)}
        />

        {/* CUSTOM MODAL THÔNG BÁO THAY THẾ CHO ALERT TRÌNH DUYỆT */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-pink-100 text-center transform transition-all">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner ${modalConfig.type === 'success' ? 'bg-pink-100 text-pink-600' : 'bg-rose-100 text-rose-600'}`}>
                            {modalConfig.type === 'success' ? '✨' : '⚠️'}
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2">{modalConfig.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed whitespace-pre-line text-left">
                            {modalConfig.message}
                        </p>

                        <button
                            onClick={closeModal}
                            className="w-full py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition cursor-pointer"
                        >
                            Đồng ý
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}