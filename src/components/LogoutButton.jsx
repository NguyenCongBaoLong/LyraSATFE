import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton({ className }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('teacher_selected_class');
        navigate('/', { replace: true });
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            className={className}
        >
            Đăng xuất
        </button>
    );
}
