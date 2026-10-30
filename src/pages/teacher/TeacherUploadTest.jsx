import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';

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
                    navigate('/teacher/overview');
                }
            );
        } catch (err) {
            showAlert("Đã xảy ra lỗi", "Lỗi khi tải lên bài test hoặc đọc file Word. Vui lòng kiểm tra lại định dạng file!", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-pink-100 max-w-2xl shadow-sm relative font-sans select-none">
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

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-pink-500 hover:bg-pink-600 transition rounded-2xl font-extrabold text-sm text-white shadow-lg shadow-pink-500/30 mt-4 cursor-pointer"
                >
                    {isSubmitting ? 'Đang xử lý file Word...' : `🚀 Tải lên & Giao bài cho lớp ${selectedClass}`}
                </button>
            </form>

            {/* CUSTOM MODAL THÔNG BÁO THAY THẾ CHO ALERT TRÌNH DUYỆT */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-pink-100 text-center transform transition-all">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner ${modalConfig.type === 'success' ? 'bg-pink-100 text-pink-600' : 'bg-rose-100 text-rose-600'}`}>
                            {modalConfig.type === 'success' ? '✨' : '⚠️'}
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2">{modalConfig.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
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