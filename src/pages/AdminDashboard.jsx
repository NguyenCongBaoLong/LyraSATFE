import React, { useState, useEffect } from 'react';
import api from '../api';

// Import các component đã tách
import CreateUserCard from '../components/admin/CreateUserCard';
import TeacherListCard from '../components/admin/TeacherListCard';
import CreateClassCard from '../components/admin/CreateClassCard';
import ClassListCard from '../components/admin/ClassListCard';
import ClassDetailModal from '../components/admin/ClassDetailModal';
import AlertModal from '../components/admin/AlertModal';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'classes'

    // State Dữ liệu
    const [teachers, setTeachers] = useState([]);
    const [classesList, setClassesList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal thông báo
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // Modal Học sinh trong Lớp
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [studentToAddId, setStudentToAddId] = useState('');
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const showAlert = (title, message, type = 'success') => {
        setModal({ isOpen: true, title, message, type });
    };

    const loadData = async () => {
        try {
            const [teachersRes, classesRes] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/admin/classes')
            ]);
            setTeachers(teachersRes.data || []);
            setClassesList(classesRes.data || []);
        } catch (err) {
            console.error("Lỗi tải dữ liệu admin:", err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Xử lý tạo tài khoản
    const handleCreateUser = async (userData, resetForm) => {
        setIsSubmitting(true);
        try {
            await api.post('/admin/users/create', userData);
            showAlert("Thành công! ", `Đã tạo tài khoản ${userData.role === 'Student' ? 'Học sinh' : 'Giáo viên'} thành công!`);
            resetForm();
            loadData();
        } catch (err) {
            showAlert("Lỗi tạo tài khoản", err.response?.data?.message || "Không thể tạo tài khoản!", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Xử lý tạo lớp học
    const handleCreateClass = async (classData, resetForm) => {
        setIsSubmitting(true);
        try {
            await api.post('/admin/classes/create', classData);
            showAlert("Thành công! ", `Đã tạo lớp học ${classData.classCode} thành công!`);
            resetForm();
            loadData();
        } catch (err) {
            showAlert("Lỗi tạo lớp", err.response?.data?.message || "Không thể tạo lớp học!", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Xử lý phân công giáo viên cho lớp chưa có
    const handleAssignTeacher = async (classId, newTeacherId) => {
        if (!newTeacherId) return;
        try {
            await api.put(`/admin/classes/${classId}/assign-teacher`, {
                teacherId: parseInt(newTeacherId)
            });
            showAlert("Thành công! ", "Đã phân công giáo viên phụ trách cho lớp học!");
            loadData();
        } catch (err) {
            showAlert("Lỗi", "Không thể phân công giáo viên.", "error");
        }
    };

    // Xử lý xóa lớp học
    const handleDeleteClass = async (e, classId, classCodeStr) => {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc chắn muốn xóa lớp học ${classCodeStr} không?`)) {
            try {
                await api.delete(`/admin/classes/${classId}`);
                showAlert("Thành công! ", `Đã xóa lớp học ${classCodeStr} khỏi hệ thống!`);
                loadData();
            } catch (err) {
                showAlert("Lỗi", "Không thể xóa lớp học này.", "error");
            }
        }
    };

    // Mở Modal Xem & Quản lý Học Sinh trong Lớp
    const handleOpenClassStudents = async (c) => {
        const code = c.classCode || c.ClassCode;
        setSelectedClassForStudents(c);
        setIsLoadingStudents(true);
        setStudentToAddId('');

        try {
            const [studentsRes, availableRes] = await Promise.all([
                api.get(`/admin/classes/${code}/students`),
                api.get(`/admin/classes/${code}/available-students`)
            ]);
            setClassStudents(studentsRes.data || []);
            setAvailableStudents(availableRes.data || []);
        } catch (err) {
            console.error("Lỗi lấy danh sách học sinh:", err);
            showAlert("Lỗi", "Không thể tải danh sách học sinh của lớp.", "error");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    // Xử lý Thêm Học Sinh vào Lớp
    const handleAddStudentToClass = async (e) => {
        e.preventDefault();
        if (!studentToAddId || !selectedClassForStudents) return;

        const code = selectedClassForStudents.classCode || selectedClassForStudents.ClassCode;

        try {
            await api.post(`/admin/classes/${code}/add-student`, {
                studentId: parseInt(studentToAddId)
            });

            showAlert("Thành công! 🎉", "Đã thêm học sinh vào lớp thành công!");
            handleOpenClassStudents(selectedClassForStudents);
        } catch (err) {
            showAlert("Lỗi", err.response?.data?.message || "Không thể thêm học sinh vào lớp.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 p-8 font-sans select-none">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-xl font-black text-pink-900 tracking-wider">LYRA SAT ADMIN</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Trang quản trị tài khoản và danh mục khóa học</p>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 px-4 py-2 rounded-2xl text-xs font-bold text-pink-700">
                         Quản trị viên
                    </div>
                </div>

                {/* Tabs Chức Năng */}
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${activeTab === 'users' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                    >
                         Tạo Tài Khoản
                    </button>
                    <button 
                        onClick={() => setActiveTab('classes')}
                        className={`px-6 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${activeTab === 'classes' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                    >
                         Tạo Khóa / Lớp Học
                    </button>
                </div>

                {/* TAB 1: TẠO TÀI KHOẢN */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CreateUserCard 
                            classesList={classesList} 
                            onCreateUser={handleCreateUser} 
                            isSubmitting={isSubmitting} 
                        />
                        <TeacherListCard teachers={teachers} />
                    </div>
                )}

                {/* TAB 2: TẠO & QUẢN LÝ LỚP HỌC */}
                {activeTab === 'classes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CreateClassCard 
                            teachers={teachers} 
                            onCreateClass={handleCreateClass} 
                            isSubmitting={isSubmitting} 
                        />
                        <ClassListCard 
                            classesList={classesList} 
                            teachers={teachers} 
                            onOpenClass={handleOpenClassStudents} 
                            onDeleteClass={handleDeleteClass} 
                            onAssignTeacher={handleAssignTeacher} 
                        />
                    </div>
                )}
            </div>

            {/* Modal Chi tiết & Thêm học sinh vào lớp */}
            <ClassDetailModal 
                selectedClass={selectedClassForStudents}
                onClose={() => setSelectedClassForStudents(null)}
                classStudents={classStudents}
                availableStudents={availableStudents}
                studentToAddId={studentToAddId}
                setStudentToAddId={setStudentToAddId}
                isLoadingStudents={isLoadingStudents}
                onAddStudent={handleAddStudentToClass}
            />

            {/* Modal Thông báo */}
            <AlertModal modal={modal} onClose={() => setModal({ ...modal, isOpen: false })} />
        </div>
    );
}