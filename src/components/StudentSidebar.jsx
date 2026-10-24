import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const navigationItems = [
    { path: '/home', label: 'Trang chủ' },
    { path: '/mission', label: 'Nhiệm vụ' },
    { path: '/score', label: 'Điểm số' },
    { path: '/vocab', label: 'Từ vựng' },
    { path: '/account', label: 'Hồ sơ' }
];

export default function StudentSidebar({ footer, onVocabularyClick }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <aside className="w-64 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex shadow-sm relative overflow-visible">
            <div>
                <div className="text-xl font-black text-pink-600 tracking-wider mb-8">LYRA SAT</div>
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
                <LogoutButton className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-2xl transition cursor-pointer" />
            </div>
        </aside>
    );
}
