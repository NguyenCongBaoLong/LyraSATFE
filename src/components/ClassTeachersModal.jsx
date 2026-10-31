import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function ClassTeachersModal({ isOpen, onClose, classCode, className, onTeamUpdated }) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [teamData, setTeamData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const loadTeamData = useCallback(async () => {
        if (!classCode) return;
        setIsLoading(true);
        setErrorMsg('');
        try {
            const res = await api.get(`/classes/${classCode}/team`, {
                params: { userId: currentUser.id }
            });
            setTeamData(res.data);
        } catch (err) {
            console.error("Lỗi tải thông tin đội ngũ giáo viên:", err);
            setErrorMsg(err.response?.data?.message || "Không thể tải thông tin đội ngũ giáo viên.");
        } finally {
            setIsLoading(false);
        }
    }, [classCode, currentUser.id]);

    useEffect(() => {
        if (isOpen && classCode) {
            setSuccessMsg('');
            setSelectedTeacherId('');
            loadTeamData();
        }
    }, [isOpen, classCode, loadTeamData]);

    if (!isOpen) return null;

    // 1. Thêm giáo viên vào lớp
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        if (!selectedTeacherId) return;

        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/classes/${classCode}/team/add`, {
                teacherId: parseInt(selectedTeacherId),
                requestUserId: currentUser.id
            });
            setSuccessMsg(res.data.message || "Thêm giáo viên thành công!");
            setSelectedTeacherId('');
            await loadTeamData();
            if (onTeamUpdated) onTeamUpdated();
        } catch (err) {
            console.error("Lỗi thêm giáo viên:", err);
            setErrorMsg(err.response?.data?.message || "Không thể thêm giáo viên vào lớp.");
        } finally {
            setActionLoading(false);
        }
    };

    // 2. Gỡ giáo viên khỏi lớp (Dành cho GV chính)
    const handleRemoveTeacher = async (teacherId, teacherName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn gỡ cô/thầy ${teacherName} khỏi danh sách giáo viên phụ trách lớp ${classCode}?`)) {
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/classes/${classCode}/team/remove`, {
                teacherId: teacherId,
                requestUserId: currentUser.id
            });
            setSuccessMsg(res.data.message || "Đã gỡ giáo viên khỏi lớp!");
            await loadTeamData();
            if (onTeamUpdated) onTeamUpdated();
        } catch (err) {
            console.error("Lỗi gỡ giáo viên:", err);
            setErrorMsg(err.response?.data?.message || "Không thể gỡ giáo viên khỏi lớp.");
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Tự rời khỏi lớp (Dành cho GV phụ trách hoặc GV chính chuyển giao)
    const handleSelfLeave = async () => {
        if (teamData?.isCurrentUserLead && teamData?.teachers?.length > 1) {
            alert("Bạn đang nắm giữ Key chính của lớp. Vui lòng bấm 'Chuyển key chính' cho giáo viên khác trước khi rời khỏi lớp!");
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn rời khỏi lớp ${classCode}? Bạn sẽ không còn quyền quản trị hay giao bài cho lớp này nữa.`)) {
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/classes/${classCode}/team/remove`, {
                teacherId: currentUser.id,
                requestUserId: currentUser.id
            });
            alert(res.data.message || "Bạn đã rời khỏi lớp thành công!");
            if (onTeamUpdated) onTeamUpdated(true); // true = current user left
            onClose();
        } catch (err) {
            console.error("Lỗi khi rời khỏi lớp:", err);
            setErrorMsg(err.response?.data?.message || "Không thể rời khỏi lớp.");
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Chuyển key chính (Truyền quyền Giáo viên chính)
    const handleTransferKey = async (newLeadId, newLeadName) => {
        if (!window.confirm(`XÁC NHẬN CHUYỂN KEY CHÍNH:\nBạn có chắc chắn muốn truyền Key chính cho cô/thầy ${newLeadName} không?\nSau khi chuyển, ${newLeadName} sẽ là Giáo viên chính và bạn sẽ trở thành Giáo viên phụ trách.`)) {
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await api.post(`/classes/${classCode}/team/transfer-key`, {
                newLeadTeacherId: newLeadId,
                requestUserId: currentUser.id
            });
            setSuccessMsg(res.data.message || "Đã truyền key chính thành công!");
            await loadTeamData();
            if (onTeamUpdated) onTeamUpdated();
        } catch (err) {
            console.error("Lỗi truyền key chính:", err);
            setErrorMsg(err.response?.data?.message || "Không thể truyền key chính.");
        } finally {
            setActionLoading(false);
        }
    };

    const isLead = teamData?.isCurrentUserLead || currentUser.role === 'Admin';
    const teacherCount = teamData?.teachers?.length || 0;
    const maxTeachers = teamData?.maxTeachers || 4;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-pink-100 p-6 flex flex-col max-h-[90vh]">
                {/* Header Modal */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-pink-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-pink-600 bg-pink-100 px-3 py-1 rounded-xl text-xs uppercase tracking-wider">
                                {classCode}
                            </span>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                                Đội ngũ: {teacherCount} / {maxTeachers} Giáo viên
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800">
                            {className || `Lớp ${classCode}`}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold flex items-center justify-center transition cursor-pointer"
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {/* Status Message Alerts */}
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
                            <span>⚠️</span>
                            <span className="flex-1">{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
                            <span>✅</span>
                            <span className="flex-1">{successMsg}</span>
                        </div>
                    )}

                    {/* Role Explanation Banner */}
                    <div className={`p-4 rounded-2xl border ${isLead ? 'bg-amber-50/70 border-amber-200' : 'bg-pink-50/70 border-pink-200'}`}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{isLead ? '👑' : '👩‍🏫'}</span>
                            <div className="text-xs">
                                <p className="font-black text-slate-800 text-sm">
                                    {isLead ? 'Bạn là Giáo viên chính (Nắm Key chính)' : 'Bạn là Giáo viên phụ trách'}
                                </p>
                                <p className="text-slate-600 mt-0.5 leading-relaxed">
                                    {isLead
                                        ? 'Bạn có toàn quyền thêm hoặc loại trừ giáo viên (tối đa 4 GV) và có thể truyền quyền Key chính cho giáo viên khác trong lớp.'
                                        : 'Bạn có toàn quyền xem học viên, tạo đề thi, chấm bài và phản hồi học sinh. Nếu không tiếp tục phụ trách lớp này, bạn có thể tự rời khỏi lớp bất kỳ lúc nào.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="py-10 text-center text-slate-400 text-xs">
                            <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            Đang tải danh sách giáo viên phụ trách...
                        </div>
                    ) : (
                        <>
                            {/* Teacher List */}
                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 flex items-center justify-between">
                                    <span>Danh sách Giáo viên trong lớp ({teacherCount})</span>
                                    <span className="text-[11px] font-normal text-slate-400">Tối đa 4 giáo viên</span>
                                </h4>

                                <div className="space-y-2">
                                    {teamData?.teachers?.map((t) => {
                                        const isThisUser = t.id === currentUser.id;
                                        return (
                                            <div
                                                key={t.id}
                                                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                                                    t.isLead
                                                        ? 'bg-amber-50/30 border-amber-200 shadow-xs'
                                                        : 'bg-white border-pink-100 hover:border-pink-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                                                        t.isLead ? 'bg-amber-400 text-white shadow-xs' : 'bg-pink-100 text-pink-700'
                                                    }`}>
                                                        {t.isLead ? '👑' : '👩‍🏫'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-extrabold text-sm text-slate-800 truncate">
                                                                {t.fullName}
                                                            </span>
                                                            {isThisUser && (
                                                                <span className="text-[10px] font-black px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">
                                                                    Bạn
                                                                </span>
                                                            )}
                                                            {t.isLead ? (
                                                                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full flex items-center gap-1">
                                                                    Key chính
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                                    GV Phụ trách
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-400 truncate mt-0.5">
                                                            {t.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {/* Chuyển Key Chính (Chỉ hiện khi người xem có quyền quản lý và người nhận ko phải là Lead) */}
                                                    {isLead && !t.isLead && (
                                                        <button
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onClick={() => handleTransferKey(t.id, t.fullName)}
                                                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                            title="Chuyển giao quyền Giáo viên chính (nắm Key) cho giáo viên này"
                                                        >
                                                            <span>🔑</span>
                                                            <span className="hidden sm:inline">Chuyển key</span>
                                                        </button>
                                                    )}

                                                    {/* Gỡ Giáo Viên (Chỉ GV chính/Admin được gỡ giáo viên phụ trách) */}
                                                    {isLead && !t.isLead && !isThisUser && (
                                                        <button
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onClick={() => handleRemoveTeacher(t.id, t.fullName)}
                                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                            title="Loại trừ giáo viên này khỏi lớp"
                                                        >
                                                            <span>✕</span>
                                                            <span className="hidden sm:inline">Gỡ</span>
                                                        </button>
                                                    )}

                                                    {/* Nút Tự Rời Khỏi Lớp (Chỉ hiện trên chính bản thân mình) */}
                                                    {isThisUser && (
                                                        <button
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onClick={handleSelfLeave}
                                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                                                            title="Rời khỏi lớp học này"
                                                        >
                                                            <span>🚪</span>
                                                            <span>Rời lớp</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add Teacher Section (Chỉ GV chính hoặc Admin) */}
                            {isLead && (
                                <div className="mt-4 p-4 bg-pink-50/60 rounded-2xl border border-pink-100">
                                    <h4 className="text-xs font-black uppercase text-pink-700 tracking-wider mb-2 flex items-center gap-1.5">
                                        <span>➕</span>
                                        <span>Thêm Giáo Viên Cùng Phụ Trách</span>
                                    </h4>

                                    {teacherCount >= maxTeachers ? (
                                        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
                                            ℹ️ Lớp học đã đạt số lượng tối đa 4 giáo viên. Nếu muốn thêm người mới, vui lòng gỡ bớt giáo viên hiện tại.
                                        </div>
                                    ) : teamData?.availableTeachers?.length === 0 ? (
                                        <div className="text-xs text-slate-500 italic py-2">
                                            Không còn giáo viên khả dụng khác trong hệ thống để thêm.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleAddTeacher} className="flex gap-2 items-center">
                                            <select
                                                value={selectedTeacherId}
                                                onChange={(e) => setSelectedTeacherId(e.target.value)}
                                                className="w-full bg-white border border-pink-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer shadow-xs"
                                            >
                                                <option value="">-- Chọn giáo viên để phân công cùng phụ trách --</option>
                                                {teamData?.availableTeachers?.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.fullName} ({t.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="submit"
                                                disabled={!selectedTeacherId || actionLoading}
                                                className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer whitespace-nowrap"
                                            >
                                                + Thêm GV
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="mt-4 pt-3 border-t border-pink-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
