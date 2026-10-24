import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StudentSidebar from '../components/StudentSidebar';

const EXAM_DATE_OPTIONS = ['2026-10-03', '2026-12-05', '2027-03-13', '2027-05-08'];

const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

export default function MyAccount() {
    const [user, setUser] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [today] = useState(getTodayDate);
    const upcomingExamDates = EXAM_DATE_OPTIONS.filter((date) => date >= today);
    const [examDate, setExamDate] = useState(() => upcomingExamDates[0] || '');
    const [dob, setDob] = useState('2008-05-15'); // Thêm state cho ngày sinh
    const [notifEnabled, setNotifEnabled] = useState(true);
    const navigate = useNavigate();

    // State quản lý Modal thông báo
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    const showAlert = (title, message, type = 'success') => {
        setModalConfig({ isOpen: true, title, message, type });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        setUser(storedUser);
        if (storedUser.avatar) {
            setAvatarPreview(storedUser.avatar);
        }
        if (storedUser.examDate) {
            const storedExamDate = storedUser.examDate.split('T')[0];
            setExamDate(storedExamDate >= today ? storedExamDate : EXAM_DATE_OPTIONS.find((date) => date >= today) || '');
        }
        if (storedUser.dob) {
            setDob(storedUser.dob.split('T')[0]);
        }
    }, [today]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
                setUser((prev) => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/update-profile', {
                userId: user.id,
                nickname: user.nickname,
                school: user.school,
                dob: dob,
                avatar: user.avatar,
                examDate: examDate
            });

            const updatedUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('lyra_exam_date', examDate);
            setUser(updatedUser);

            showAlert("Cập nhật thành công!", "Thông tin tài khoản của bạn đã được lưu vào hệ thống.", "success");
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Lỗi khi cập nhật thông tin!";
            showAlert("Đã xảy ra lỗi", errorMsg, "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans relative select-none">
            <StudentSidebar />

            {/* Nội dung chính */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">My Account & Settings</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Quản lý thông tin cá nhân và cấu hình tài khoản</p>
                    </div>
                    <button onClick={() => navigate('/home')} className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold px-4 py-2.5 rounded-2xl border border-pink-200 transition cursor-pointer">
                        ← Về trang chủ
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CỘT 1 */}
                    <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-extrabold uppercase text-pink-600 tracking-wider mb-4">Thông tin cá nhân</h2>

                        <div className="flex items-center gap-5 p-4 bg-pink-50/50 rounded-2xl border border-pink-100 mb-2">
                            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-pink-400 shadow-sm bg-white flex items-center justify-center flex-shrink-0">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-black text-pink-500">{user.fullName ? user.fullName[0] : 'U'}</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh đại diện</label>
                                <label className="inline-block bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition shadow-sm shadow-pink-500/20">
                                    Cập nhật
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Họ và tên</label>
                            <input type="text" disabled className="w-full px-4 py-3 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 cursor-not-allowed" value={user.fullName || ''} />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email</label>
                            <input type="email" disabled className="w-full px-4 py-3 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 cursor-not-allowed" value={user.email || ''} />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Biệt danh (Nickname)</label>
                            <input type="text" placeholder="Nhập biệt danh của bạn..." className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition" value={user.nickname || ''} onChange={(e) => setUser({ ...user, nickname: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Trường học</label>
                            <input type="text" placeholder="Tên trường THPT / Đại học" className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition" value={user.school || ''} onChange={(e) => setUser({ ...user, school: e.target.value })} />
                        </div>

                        <div>
                            <label htmlFor="dob" className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Ngày sinh (DOB)</label>
                            <input
                                id="dob"
                                type="date"
                                max={today}
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* CỘT 2 */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
                            <h2 className="text-sm font-extrabold uppercase text-pink-600 tracking-wider mb-2">Settings</h2>

                            <div className="bg-pink-50/40 p-4 rounded-2xl border border-pink-100 space-y-3">
                                <h3 className="text-xs font-bold text-slate-700">Chọn nhanh ngày thi (Target Exam Date)</h3>
                                <p className="text-[11px] text-pink-600 font-bold">Đã chọn: {examDate ? formatDate(examDate) : 'Chưa chọn'}</p>

                                <div className="pt-2">
                                    <label htmlFor="exam-date" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hoặc chọn ngày thi khác:</label>
                                    <input
                                        id="exam-date"
                                        type="date"
                                        min={today}
                                        required
                                        value={examDate}
                                        onChange={(e) => setExamDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white rounded-xl border border-pink-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="bg-pink-50/40 p-4 rounded-2xl border border-pink-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700">Discussion Thread Notifications</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{notifEnabled ? 'Notification Enabled' : 'Disabled'}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setNotifEnabled(!notifEnabled)}
                                    className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${notifEnabled ? 'bg-pink-500 justify-end' : 'bg-slate-300 justify-start'}`}
                                >
                                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></div>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-pink-500 hover:bg-pink-600 rounded-2xl font-extrabold text-sm text-white shadow-lg shadow-pink-500/30 transition cursor-pointer">
                            Lưu Thay Đổi Thông Tin
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal thông báo */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-pink-100 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner ${modalConfig.type === 'success' ? 'bg-pink-100 text-pink-600' : 'bg-rose-100 text-rose-600'}`}>
                            {modalConfig.type === 'success' ? '✨' : '⚠️'}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{modalConfig.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{modalConfig.message}</p>
                        <button onClick={closeModal} className="w-full py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition cursor-pointer">
                            Đồng ý
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}