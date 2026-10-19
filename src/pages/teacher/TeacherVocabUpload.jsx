import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function TeacherVocabUpload() {
    const { selectedClass } = useOutletContext(); // Lấy mã lớp giáo viên đang quản lý (VD: SAT01)
    const navigate = useNavigate();

    const [seriesName, setSeriesName] = useState('');
    const [uploadMode, setUploadMode] = useState('text'); // 'text' (Nhập tay) hoặc 'file' (Tải lên file Word)
    const [vocabText, setVocabText] = useState('');
    const [vocabFile, setVocabFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Hàm xử lý khi giáo viên bấm nút tải lên
    const handleUploadVocab = async (e) => {
        e.preventDefault();
        if (!seriesName.trim()) {
            setMessage({ text: 'Vui lòng nhập tên bộ từ vựng.', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            if (uploadMode === 'text') {
                if (!vocabText.trim()) {
                    setMessage({ text: 'Vui lòng nhập danh sách từ vựng.', type: 'error' });
                    setIsSubmitting(false);
                    return;
                }

                const lines = vocabText.split('\n');
                const items = lines.map(line => {
                    const parts = line.split('|').map(p => p.trim());
                    if (parts.length >= 2) {
                        return {
                            classCode: selectedClass || "SAT01",
                            seriesName: seriesName.trim(),
                            word: parts[0],
                            definition: parts[1],
                            example: parts[2] || ""
                        };
                    }
                    return null;
                }).filter(item => item !== null);

                if (items.length === 0) {
                    setMessage({ text: 'Định dạng từ vựng không hợp lệ. Vui lòng kiểm tra lại.', type: 'error' });
                    setIsSubmitting(false);
                    return;
                }

                for (const item of items) {
                    await api.post('/vocabularies', item);
                }

                setMessage({ text: `Thành công! Đã tải lên ${items.length} từ vựng vào bộ "${seriesName}".`, type: 'success' });
            } else {
                if (!vocabFile) {
                    setMessage({ text: 'Vui lòng chọn file Word (.docx) để tải lên.', type: 'error' });
                    setIsSubmitting(false);
                    return;
                }

                const formData = new FormData();
                formData.append('seriesName', seriesName.trim());
                formData.append('classCode', selectedClass || "SAT01");
                formData.append('file', vocabFile);

                const response = await api.post('/vocabularies/upload-vocab-file', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setMessage({ text: response.data.message || `Thành công bộ từ vựng "${seriesName}".`, type: 'success' });
            }

            setVocabText('');
            setVocabFile(null);
            setSeriesName('');
        } catch (error) {
            console.error("Lỗi khi tải lên từ vựng:", error);
            const errorMsg = error.response?.data?.message || 'Không thể lưu từ vựng lên hệ thống. Vui lòng kiểm tra lại file!';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-pink-900">Tải lên bộ từ vựng (Vocab)</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Đang thêm từ vựng cho lớp: <strong className="text-pink-600">{selectedClass}</strong></p>
                </div>
                <button 
                    onClick={() => navigate('/teacher/overview')}
                    className="text-xs font-bold text-pink-600 hover:text-pink-800 transition cursor-pointer"
                >
                    ‹ Quay lại tổng quan
                </button>
            </div>

            {/* Form Upload */}
            <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm max-w-2xl mx-auto">
                <form onSubmit={handleUploadVocab} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Tên bộ từ vựng (Series Name):
                        </label>
                        <input 
                            type="text"
                            value={seriesName}
                            onChange={(e) => setSeriesName(e.target.value)}
                            placeholder="Ví dụ: SAT Vocab - Day 1"
                            className="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:border-pink-500 focus:outline-none text-xs font-medium text-slate-700 bg-pink-50/30"
                        />
                    </div>

                    {/* CHỌN PHƯƠNG THỨC NHẬP LIỆU */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Phương thức nhập dữ liệu:
                        </label>
                        <div className="grid grid-cols-2 gap-3 p-1 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <button
                                type="button"
                                onClick={() => setUploadMode('text')}
                                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${uploadMode === 'text' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-600 hover:bg-pink-100/50'}`}
                            >
                                 Nhập thủ công (Textarea)
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMode('file')}
                                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${uploadMode === 'file' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-600 hover:bg-pink-100/50'}`}
                            >
                                 Tải lên file Word (.docx)
                            </button>
                        </div>
                    </div>

                    {uploadMode === 'text' ? (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Danh sách từ vựng (Mỗi dòng 1 từ):
                                </label>
                                <span className="text-[10px] text-pink-500 font-medium italic">
                                    Cú pháp: Từ | Nghĩa | Ví dụ (nếu có)
                                </span>
                            </div>
                            <textarea 
                                rows="10"
                                value={vocabText}
                                onChange={(e) => setVocabText(e.target.value)}
                                placeholder={"Ephemeral | Kéo dài trong thời gian ngắn | Their alliance was ephemeral.\nPragmatic | Thực tế, thực dụng | She made a pragmatic choice."}
                                className="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:border-pink-500 focus:outline-none text-xs font-mono text-slate-700 bg-pink-50/30 leading-relaxed"
                            />
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Chọn file Word chứa từ vựng (.docx):
                                </label>
                                <span className="text-[10px] text-pink-500 font-medium italic">
                                    Mỗi dòng trong file: Từ | Nghĩa | Ví dụ
                                </span>
                            </div>
                            <input 
                                type="file"
                                accept=".docx"
                                onChange={(e) => setVocabFile(e.target.files[0])}
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-200 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
                            />
                            {vocabFile && (
                                <p className="text-[11px] text-emerald-600 font-bold mt-2">
                                    Đã chọn file: {vocabFile.name}
                                </p>
                            )}
                        </div>
                    )}

                    {message.text && (
                        <div className={`p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-pink-600/20 transition cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? 'Đang tải lên...' : 'Lưu và Giao bộ từ vựng'}
                    </button>
                </form>
            </div>
        </div>
    );
}