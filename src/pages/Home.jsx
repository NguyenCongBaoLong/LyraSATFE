import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';

// Import các ảnh banner và mascot từ thư mục assets của bạn
import banner1 from '../assets/banner1-optimized.jpg';
import banner2 from '../assets/banner2-optimized.jpg';

export default function Home() {
    const [user, setUser] = useState(null);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    
    // State cho đồng hồ đếm ngược
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [examDateStr, setExamDateStr] = useState('');

    const navigate = useNavigate();

    // Danh sách các slide banner hình ảnh
    const banners = [
        { id: 1, image: banner1, title: 'Bứt Phá Điểm Số SAT Cùng Lyra' },
        { id: 2, image: banner2, title: 'Luyện Thi Thông Minh - Chạm Ước Mơ' }
    ];

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            navigate('/');
            return;
        }
        setUser(storedUser);

        // Lấy ngày kiểm tra từ user (hoặc localStorage / mặc định)
        const targetDateStr = storedUser.examDate || localStorage.getItem('lyra_exam_date') || '2026-12-05';
        
        const dateObj = new Date(targetDateStr);
        const formattedDateText = `thg ${dateObj.getMonth() + 1}. ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
        setExamDateStr(formattedDateText);

        // Vòng lặp đếm ngược mỗi giây
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const targetTime = dateObj.getTime();
            const difference = targetTime - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        // Tự động chuyển slide banner sau mỗi 4 giây
        const interval = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
        }, 4000);

        return () => {
            clearInterval(timer);
            clearInterval(interval);
        };
    }, [navigate, banners.length]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans">
            <StudentSidebar />

            {/* Nội dung chính bên phải */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header chào mừng */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">{user.fullName}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Lớp: <span className="text-slate-700 font-semibold">{user.classCode}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell align="right" />
                    </div>
                </div>

                {/* Banner Slide Hình Ảnh */}
                <div className="w-full h-48 bg-white rounded-3xl overflow-hidden shadow-md mb-8 relative border border-pink-100">
                    <div className="w-full h-full relative">
                        <img 
                            src={banners[currentBannerIndex].image} 
                            alt="Banner" 
                            className="w-full h-full object-cover transition-all duration-700"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-400 items-center justify-center text-white font-black text-lg p-4 text-center">
                            {banners[currentBannerIndex].title} (Hãy đặt file banner1.jpg & banner2.jpg vào src/assets)
                        </div>
                    </div>

                    <button 
                        onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-pink-600 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow transition cursor-pointer"
                    >
                        ‹
                    </button>
                    <button 
                        onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-pink-600 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow transition cursor-pointer"
                    >
                        ›
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {banners.map((_, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setCurrentBannerIndex(idx)}
                                className={`h-2 rounded-full transition cursor-pointer ${currentBannerIndex === idx ? 'bg-pink-600 w-5' : 'bg-pink-200 w-2'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Các khối chức năng (Tông màu hồng) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ô Số ngày học liên tiếp */}
                    <div className="bg-white p-6 rounded-3xl border border-pink-100 hover:border-pink-300 transition text-center flex flex-col justify-center items-center h-36 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-2 right-2 text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Streak 🔥</div>
                        <div className="text-3xl font-black text-pink-600 mb-1 group-hover:scale-110 transition">
                            {user.streakCount || 1} Ngày
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm">Số ngày học liên tiếp</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Duy trì thói quen mỗi ngày!</p>
                    </div>

                    {/* Next Digital SAT - Ô đếm ngược thời gian thực */}
                    <div className="bg-white p-6 rounded-3xl border border-pink-100 hover:border-pink-300 transition text-center flex flex-col justify-center items-center h-36 shadow-sm col-span-1 md:col-span-2">
                        <div className="text-xs font-bold text-[#2D5A4C] mb-3 tracking-wide">
                            Next Digital SAT - Exam: {examDateStr}
                        </div>
                        <div className="grid grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-2xl font-black text-[#2D5A4C]">{timeLeft.days}</div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">Ngày</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-[#2D5A4C]">{String(timeLeft.hours).padStart(2, '0')}</div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">Giờ</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-[#2D5A4C]">{String(timeLeft.minutes).padStart(2, '0')}</div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">Phút</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-[#2D5A4C]">{String(timeLeft.seconds).padStart(2, '0')}</div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">Giây</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hàng phụ: Vocab */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                        onClick={() => navigate('/vocab')} 
                        className="bg-white p-6 rounded-3xl border border-pink-100 hover:border-pink-300 cursor-pointer transition text-center flex flex-col justify-center items-center h-36 shadow-sm group"
                    >
                        <div className="text-3xl mb-1 group-hover:scale-110 transition">📚</div>
                        <h3 className="font-bold text-slate-700 text-sm mt-1">Vocab.</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Học từ vựng Series</p>
                    </div>
                </div>
            </div>
        </div>
    );
}