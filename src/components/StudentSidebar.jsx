import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import NotificationBell from './NotificationBell';
import foxMascot from '../assets/fox-mascot-optimized.png';

const navigationItems = [
    { path: '/home', label: 'Trang chủ' },
    { path: '/mission', label: 'Nhiệm vụ' },
    { path: '/score', label: 'Điểm số & Thảo luận' },
    { path: '/vocab', label: 'Từ vựng' },
    { path: '/account', label: 'Hồ sơ' }
];

export default function StudentSidebar({ footer, onVocabularyClick }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <aside className="sticky top-0 h-screen min-h-screen w-64 shrink-0 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm relative overflow-visible">
            <div>
                <div className="flex items-center justify-between mb-8">
                    <div className="text-xl font-black text-pink-600 tracking-wider">LYRA SAT</div>
                    <NotificationBell align="left" />
                </div>
                <nav aria-label="Điều hướng chính" className="space-y-2">
                    {navigationItems.map(({ path, label }) => {
                        const isActive = pathname === path;
                        const handleClick = path === '/vocab' && onVocabularyClick
                            ? onVocabularyClick
                            : () => navigate(path);

                        return (
                            <button
                                key={path}
                                type="button"
                                onClick={handleClick}
                                aria-current={isActive ? 'page' : undefined}
                                className={`w-full text-left px-4 py-3 rounded-2xl transition text-sm cursor-pointer ${
                                    isActive
                                        ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20'
                                        : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600 font-semibold'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div>
                {footer}
                <div className="my-4 flex flex-col items-center">
                    <div className="animate-bounce rounded-2xl border border-pink-200 bg-pink-100 px-4 py-2 text-xs font-bold text-pink-900 shadow-sm mb-2 whitespace-nowrap">
                        Cố lên bạn nhé! ✨
                    </div>
                    <img
                        src={foxMascot}
                        alt="Linh vật Lyra SAT"
                        className="h-44 w-44 object-contain drop-shadow-md"
                    />
                </div>
                <LogoutButton className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-2xl transition cursor-pointer" />
            </div>
        </aside>
    );
}
