import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTestSessionStorage } from '../utils/safeStorage';

export default function LogoutButton({ className }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('teacher_selected_class');
        localStorage.removeItem('student_selected_class');
        localStorage.removeItem('lyra_exam_date');
        clearTestSessionStorage();
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
