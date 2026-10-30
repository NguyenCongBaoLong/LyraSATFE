import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function TeacherStudents() {
    const { selectedClass } = useOutletContext();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState('');

    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn gỡ học viên "${studentName}" ra khỏi lớp ${selectedClass}?`)) {
            return;
        }
        try {
            await api.post(`/tests/class/${selectedClass}/remove-student/${studentId}`);
            setStudents(prev => prev.filter(s => s.id !== studentId));
            setTotalCount(prev => Math.max(0, prev - 1));
            alert(`Đã gỡ học viên "${studentName}" ra khỏi lớp thành công!`);
        } catch (err) {
            console.error("Lỗi khi gỡ học viên:", err);
            alert(err.response?.data?.message || "Không thể gỡ học viên. Vui lòng thử lại!");
        }
    };

    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            setTotalCount(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError('');
        const controller = new AbortController();

        api.get(`/tests/class/${selectedClass}/students`, {
            params: { page, pageSize: PAGE_SIZE },
            signal: controller.signal
        })
            .then(res => {
                setStudents(res.data.items);
                setTotalCount(res.data.totalCount);
                setPage(res.data.page);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error("Lỗi tải danh sách học sinh:", err);
                setError('Không thể tải danh sách học viên. Vui lòng thử lại.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

        return () => {
            controller.abort();
        };
    }, [page, selectedClass]);

    if (isLoading) {
        return <div className="text-pink-600 font-bold text-xs">Đang tải danh sách học viên...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-black text-pink-900">Danh sách học viên</h2>
                    <p className="text-xs text-slate-400">Quản lý thành viên và học phí của lớp <strong className="text-pink-600">{selectedClass}</strong></p>
                </div>
                <span className="text-xs font-bold bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl border border-pink-200">
                    Tổng số: {totalCount} học viên
                </span>
            </div>

            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-pink-100 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 px-4">Họ và tên</th>
                        <th className="pb-3 px-4">Mã lớp</th>
                        <th className="pb-3 px-4">Trạng thái học phí</th>
                        <th className="pb-3 px-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                    {error ? (
                        <tr>
                            <td colSpan="4" role="alert" className="py-8 text-center text-rose-500 text-xs">{error}</td>
                        </tr>
                    ) : students.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="py-8 text-center text-slate-400 text-xs">Chưa có học viên nào đăng ký vào lớp này.</td>
                        </tr>
                    ) : (
                        students.map((student) => (
                            <tr key={student.id} className="hover:bg-pink-50/30 transition">
                                <td className="py-4 px-4 font-semibold text-slate-800">{student.fullName}</td>
                                <td className="py-4 px-4">
                                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-100">
                                        {student.classCode}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    {student.tuitionPaid ? (
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">Đã đóng</span>
                                    ) : (
                                        <span className="px-3 py-1 bg-rose-50 text-rose-500 text-xs font-bold rounded-full border border-rose-100">Chưa đóng</span>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStudent(student.id, student.fullName)}
                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ml-auto"
                                        title="Gỡ học viên này ra khỏi lớp"
                                    >
                                        <span>✕</span>
                                        <span>Gỡ khỏi lớp</span>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {!error && (
                <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalCount={totalCount}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}