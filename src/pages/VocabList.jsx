import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function VocabList() {
    const [classList, setClassList] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null); // Bước 1: Lớp đang chọn
    const [seriesList, setSeriesList] = useState([]);
    const [selectedSeries, setSelectedSeries] = useState(null); // Bước 2: Series đang chọn
    const [vocabList, setVocabList] = useState([]);
    const [studyMode, setStudyMode] = useState(false); // Bước 3: Vào học Flashcard trực tiếp
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const navigate = useNavigate();

    // Dữ liệu mẫu giả lập (Dùng khi chưa có API DB)
    const mockData = {
        'SAT01': {
            'Series 01': [
                { id: 1, word: 'Ponder', phonetic: "'pɒndə", definition: 'trầm tư, suy ngẫm', synonyms: ['speculate'], example: 'He continued to ponder the problem.' },
                { id: 2, word: 'Meticulous', phonetic: "mɪ'tɪkjʊləs", definition: 'tỉ mỉ, cẩn trọng', synonyms: ['thorough'], example: 'She is meticulous in her work.' }
            ],
            'Series 02': [
                { id: 3, word: 'Ambiguous', phonetic: "æm'bɪɡjuəs", definition: 'mơ hồ, đa nghĩa', synonyms: ['unclear'], example: 'The reply was ambiguous.' }
            ]
        },
        'SAT02': {
            'Series 01': [
                { id: 4, word: 'Pragmatic', phonetic: "præɡ'mætɪk", definition: 'thực tế, thực dụng', synonyms: ['practical'], example: 'We need a pragmatic approach.' }
            ]
        }
    };

    // 1. Tải danh sách lớp học khi vào trang
    useEffect(() => {
        api.get('/vocabularies/classes')
            .then(res => setClassList(res.data))
            .catch(() => {
                setClassList(['SAT01', 'SAT02']); // Fallback nếu chưa có API
            });
    }, []);

    // 2. Khi chọn Lớp -> Tải danh sách Series thuộc lớp đó
    const handleSelectClass = (classCode) => {
        setSelectedClass(classCode);
        setSelectedSeries(null);
        setStudyMode(false);

        api.get(`/vocabularies/class/${classCode}/series`)
            .then(res => setSeriesList(res.data))
            .catch(() => {
                const classData = mockData[classCode] || mockData['SAT01'];
                setSeriesList(Object.keys(classData));
            });
    };

    // 3. Khi chọn Series -> Tải danh sách từ vựng thuộc lớp và series đó, rồi vào thẳng màn hình học Flashcard luôn
    const handleSelectSeries = (seriesName) => {
        setSelectedSeries(seriesName);
        setCurrentIndex(0);
        setIsFlipped(false);

        api.get(`/vocabularies/class/${selectedClass}/series/${encodeURIComponent(seriesName)}`)
            .then(res => {
                setVocabList(res.data);
                setStudyMode(true);
            })
            .catch(() => {
                const classData = mockData[selectedClass] || mockData['SAT01'];
                setVocabList(classData[seriesName] || []);
                setStudyMode(true);
            });
    };

    // Phát âm từ vựng
    const handleSpeak = (word) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-GB';
            window.speechSynthesis.speak(utterance);
        }
    };

    const currentCard = vocabList[currentIndex];

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans select-none">
            {/* Sidebar đồng bộ hoàn toàn với trang Home */}
            <div className="w-64 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm">
                <div>
                    <div className="text-xl font-black text-pink-600 tracking-wider mb-8">LYRA SAT</div>
                    <div className="space-y-2">
                        <button 
                            onClick={() => navigate('/home')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm cursor-pointer"
                        >
                            Trang chủ
                        </button>
                        <button 
                            onClick={() => navigate('/mission')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm cursor-pointer"
                        >
                            Nhiệm vụ
                        </button>
                        <button 
                            onClick={() => navigate('/score')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm cursor-pointer"
                        >
                            Điểm số
                        </button>
                        <button 
                            onClick={() => { setSelectedClass(null); setSelectedSeries(null); setStudyMode(false); }} 
                            className="w-full text-left px-4 py-3 rounded-2xl bg-pink-500 text-white font-bold transition text-sm shadow-md shadow-pink-500/20 cursor-pointer"
                        >
                            Từ vựng 
                        </button>
                        <button 
                            onClick={() => navigate('/account')} 
                            className="w-full text-left px-4 py-3 rounded-2xl text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold transition text-sm cursor-pointer"
                        >
                            Hồ sơ
                        </button>
                    </div>
                </div>
                <div>
                    <button 
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-2xl transition cursor-pointer"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Nội dung chính bên phải */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header động */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">
                            {studyMode 
                                ? `Đang học: ${currentCard?.word}` 
                                : selectedClass 
                                    ? `Khóa học từ vựng - Lớp ${selectedClass}` 
                                    : 'Chọn lớp học từ vựng'}
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {studyMode ? 'Chế độ lật thẻ Flashcard thông minh' : selectedClass ? 'Chọn bộ từ vựng (Series) bên dưới để bắt đầu học' : 'Vui lòng chọn lớp học của bạn để tiếp tục'}
                        </p>
                    </div>

                    {studyMode ? (
                        <button onClick={() => setStudyMode(false)} className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold px-4 py-2.5 rounded-2xl border border-pink-200 transition cursor-pointer">
                            ← Quay lại chọn Series
                        </button>
                    ) : selectedClass ? (
                        <button onClick={() => setSelectedClass(null)} className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold px-4 py-2.5 rounded-2xl border border-pink-200 transition cursor-pointer">
                            ← Chọn lớp khác
                        </button>
                    ) : (
                        <button onClick={() => navigate('/home')} className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold px-4 py-2.5 rounded-2xl border border-pink-200 transition cursor-pointer">
                            ← Về trang chủ
                        </button>
                    )}
                </div>

                {/* GIAO DIỆN 1: Chọn Lớp học trước */}
                {!selectedClass ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {classList.map((cls, index) => (
                            <div 
                                key={index} 
                                onClick={() => handleSelectClass(cls)}
                                className="bg-white p-6 rounded-3xl border border-pink-100 hover:border-pink-400 hover:shadow-lg cursor-pointer transition text-center group"
                            >
                                <div className="text-4xl mb-3 group-hover:scale-110 transition">🏫</div>
                                <h3 className="font-extrabold text-pink-700 text-lg mb-1">Lớp {cls}</h3>
                                <p className="text-xs text-slate-400">Xem khóa học từ vựng</p>
                                <button className="mt-4 px-4 py-2 bg-pink-500 group-hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-pink-500/20">
                                    Vào lớp →
                                </button>
                            </div>
                        ))}
                    </div>
                ) : !studyMode ? (
                    /* GIAO DIỆN 2: Hiển thị danh sách Series sau khi đã chọn Lớp */
                    seriesList.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-pink-100 text-center text-xs text-slate-400 shadow-sm">
                            Chưa có bộ từ vựng nào cho lớp {selectedClass}.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {seriesList.map((s, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => handleSelectSeries(s)}
                                    className="bg-white p-6 rounded-3xl border border-pink-100 hover:border-pink-400 hover:shadow-lg cursor-pointer transition text-center group"
                                >
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition">📖</div>
                                    <h3 className="font-extrabold text-pink-700 text-lg mb-1">{s}</h3>
                                    <p className="text-xs text-slate-400">Lớp: {selectedClass}</p>
                                    <button className="mt-4 px-4 py-2 bg-pink-500 group-hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-pink-500/20">
                                        Xem từ vựng →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* GIAO DIỆN 3: Vào học Flashcard trực tiếp */
                    <div className="max-w-2xl mx-auto flex flex-col items-center">
                        <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400 mb-3">
                            <span>Từ {currentIndex + 1} / {vocabList.length} trong {selectedSeries}</span>
                            <span>{Math.round(((currentIndex + 1) / vocabList.length) * 100)}% Hoàn thành</span>
                        </div>
                        <div className="w-full bg-pink-100 h-2 rounded-full mb-6 overflow-hidden">
                            <div 
                                className="bg-pink-500 h-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / vocabList.length) * 100}%` }}
                            ></div>
                        </div>

                        {/* MẶT THẺ FLASHCARD */}
                        <div 
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="w-full min-h-[340px] bg-white rounded-3xl border border-pink-100 shadow-md p-8 flex flex-col justify-between items-center text-center cursor-pointer hover:shadow-xl transition-all duration-300 relative select-none"
                        >
                            <span className="absolute top-4 right-6 text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                                {isFlipped ? 'Mặt sau (Nghĩa & Chi tiết)' : 'Mặt trước (English Word 🔄)'}
                            </span>

                            {/* Mặt trước hiển thị Tiếng Anh, Mặt sau hiển thị Nghĩa */}
                            {!isFlipped ? (
                                <div className="my-auto flex flex-col items-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">English Word</span>
                                    <h2 className="text-4xl font-black text-pink-600 mb-4">{currentCard.word}</h2>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                                        <span>UK</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleSpeak(currentCard.word); }} className="hover:text-pink-600 transition p-1">
                                            🔊
                                        </button>
                                        {currentCard.phonetic && <span>/{currentCard.phonetic}/</span>}
                                    </div>
                                </div>
                            ) : (
                                <div className="my-auto flex flex-col items-center">
                                    <h2 className="text-2xl font-extrabold text-[#2D5A4C] mb-3">
                                        {currentCard.definition}
                                    </h2>
                                    {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                                        <div className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50/50 max-w-md mb-3">
                                            <div className="text-[10px] font-extrabold text-slate-700 mb-1 uppercase tracking-wide">Synonyms</div>
                                            <div className="text-sm font-bold text-slate-700">
                                                {currentCard.synonyms.join(' , ')}
                                            </div>
                                        </div>
                                    )}
                                    {currentCard.example && (
                                        <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100 max-w-md text-xs text-slate-600 italic">
                                            "{currentCard.example}"
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-[11px] text-slate-300 font-semibold mt-4">Bấm vào thẻ để lật mặt xem thông tin</p>
                        </div>

                        {/* Nút điều hướng */}
                        <div className="flex items-center gap-6 mt-8">
                            <button 
                                onClick={() => {
                                    if (currentIndex > 0) {
                                        setCurrentIndex(currentIndex - 1);
                                        setIsFlipped(false);
                                    }
                                }}
                                disabled={currentIndex === 0}
                                className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-lg transition ${currentIndex === 0 ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-pink-50 text-pink-600 border-pink-200 shadow-sm cursor-pointer'}`}
                            >
                                ‹
                            </button>

                            <button 
                                onClick={() => handleSpeak(currentCard?.word)}
                                className="px-6 py-3 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-extrabold rounded-2xl transition cursor-pointer"
                            >
                                🔊 Nghe phát âm
                            </button>

                            <button 
                                onClick={() => {
                                    if (currentIndex < vocabList.length - 1) {
                                        setCurrentIndex(currentIndex + 1);
                                        setIsFlipped(false);
                                    }
                                }}
                                disabled={currentIndex === vocabList.length - 1}
                                className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-lg transition ${currentIndex === vocabList.length - 1 ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-500/20 cursor-pointer'}`}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}