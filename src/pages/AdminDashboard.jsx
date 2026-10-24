import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

// Import các component đã tách
import CreateUserCard from '../components/admin/CreateUserCard';
import TeacherListCard from '../components/admin/TeacherListCard';
import CreateClassCard from '../components/admin/CreateClassCard';
import ClassListCard from '../components/admin/ClassListCard';
import ClassDetailModal from '../components/admin/ClassDetailModal';
import AlertModal from '../components/admin/AlertModal';
import LogoutButton from '../components/LogoutButton';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'classes'

    // State Dữ liệu
    const [teachers, setTeachers] = useState([]);
    const [classesList, setClassesList] = useState([]);
    const [teacherPage, setTeacherPage] = useState(1);
    const [teacherListing, setTeacherListing] = useState({ items: [], totalCount: 0 });
    const [teacherRefresh, setTeacherRefresh] = useState(0);
    const [hasLoadedTeacherOptions, setHasLoadedTeacherOptions] = useState(false);
    const [classPage, setClassPage] = useState(1);
    const [classListing, setClassListing] = useState({ items: [], totalCount: 0 });
    const [classRefresh, setClassRefresh] = useState(0);
    const [hasLoadedClassOptions, setHasLoadedClassOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal thông báo
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // Modal Học sinh trong Lớp
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [classStudentPage, setClassStudentPage] = useState(1);
    const [classStudentCount, setClassStudentCount] = useState(0);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [availableStudentPage, setAvailableStudentPage] = useState(1);
    const [availableStudentCount, setAvailableStudentCount] = useState(0);
    const [studentToAddId, setStudentToAddId] = useState('');
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const showAlert = (title, message, type = 'success') => {
        setModal({ isOpen: true, title, message, type });
    };

    const loadClassOptions = useCallback(async (signal) => {
        try {
            const classesRes = await api.get('/admin/classes', { signal });
            setClassesList(classesRes.data || []);
            setHasLoadedClassOptions(true);
        } catch (err) {
            if (err.code === 'ERR_CANCELED') return;
            console.error("Lỗi tải danh sách lớp cho biểu mẫu:", err);
        }
    }, []);

    const loadTeacherOptions = useCallback(async (signal) => {
        try {
            const teachersRes = await api.get('/admin/teachers', { signal });
            setTeachers(teachersRes.data || []);
            setHasLoadedTeacherOptions(true);
        } catch (err) {
            if (err.code === 'ERR_CANCELED') return;
            console.error("Lỗi tải danh sách giáo viên cho biểu mẫu:", err);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        if (activeTab === 'users') {
            if (!hasLoadedClassOptions) loadClassOptions(controller.signal);
        } else if (!hasLoadedTeacherOptions) {
            loadTeacherOptions(controller.signal);
        }
        return () => controller.abort();
    }, [activeTab, hasLoadedClassOptions, hasLoadedTeacherOptions, loadClassOptions, loadTeacherOptions]);

    useEffect(() => {
        if (activeTab !== 'users') return;
        const controller = new AbortController();
        api.get('/admin/teachers/paged', {
            params: { page: teacherPage, pageSize: 8 },
            signal: controller.signal
        })
            .then(res => {
                setTeacherListing(res.data);
                setTeacherPage(res.data.page);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error('Lỗi tải danh sách giáo viên:', err);
            });
        return () => {
            controller.abort();
        };
    }, [activeTab, teacherPage, teacherRefresh]);

    useEffect(() => {
        if (activeTab !== 'classes') return;
        const controller = new AbortController();
        api.get('/admin/classes/paged', {
            params: { page: classPage, pageSize: 8 },
            signal: controller.signal
        })
            .then(res => {
                setClassListing(res.data);
                setClassPage(res.data.page);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error('Lỗi tải danh sách lớp học:', err);
            });
        return () => {
            controller.abort();
        };
    }, [activeTab, classPage, classRefresh]);

    // Xử lý tạo tài khoản
    const handleCreateUser = async (userData, resetForm) => {
        setIsSubmitting(true);
        try {
            await api.post('/admin/users/create', userData);
            showAlert("Thành công! ", `Đã tạo tài khoản ${userData.role === 'Student' ? 'Học sinh' : 'Giáo viên'} thành công!`);
            resetForm();
            if (userData.role === 'Teacher') {
                loadTeacherOptions();
                setTeacherRefresh(version => version + 1);
            }
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
            loadClassOptions();
            setClassRefresh(version => version + 1);
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
            setClassRefresh(version => version + 1);
        } catch (err) {
            console.error("Lỗi phân công giáo viên:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể phân công giáo viên.", "error");
        }
    };

    // Xử lý xóa lớp học
    const handleDeleteClass = async (e, classId, classCodeStr) => {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc chắn muốn xóa lớp học ${classCodeStr} không?`)) {
            try {
                await api.delete(`/admin/classes/${classId}`);
                showAlert("Thành công! ", `Đã xóa lớp học ${classCodeStr} khỏi hệ thống!`);
                loadClassOptions();
                setClassRefresh(version => version + 1);
            } catch (err) {
                console.error("Lỗi xóa lớp học:", err);
                showAlert("Lỗi", err.response?.data?.message || "Không thể xóa lớp học này.", "error");
            }
        }
    };

    // Mở Modal Xem & Quản lý Học Sinh trong Lớp
    const handleOpenClassStudents = async (c, studentPage = 1, availablePage = 1) => {
        const code = c.classCode || c.ClassCode;
        setSelectedClassForStudents(c);
        setIsLoadingStudents(true);
        setStudentToAddId('');

        try {
            const [studentsRes, availableRes] = await Promise.all([
                api.get(`/admin/classes/${code}/students`, {
                    params: { page: studentPage, pageSize: 8 }
                }),
                api.get(`/admin/classes/${code}/available-students`, {
                    params: { page: availablePage, pageSize: 10 }
                })
            ]);
            setClassStudents(studentsRes.data.items);
            setClassStudentPage(studentsRes.data.page);
            setClassStudentCount(studentsRes.data.totalCount);
            setAvailableStudents(availableRes.data.items);
            setAvailableStudentPage(availableRes.data.page);
            setAvailableStudentCount(availableRes.data.totalCount);
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
            handleOpenClassStudents(selectedClassForStudents, classStudentPage, availableStudentPage);
        } catch (err) {
            showAlert("Lỗi", err.response?.data?.message || "Không thể thêm học sinh vào lớp.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 p-8 font-sans select-none">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-xl font-black text-pink-900 tracking-wider">LYRA SAT ADMIN</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Trang quản trị tài khoản và danh mục khóa học</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-50 border border-pink-200 px-4 py-2 rounded-2xl text-xs font-bold text-pink-700">
                            Quản trị viên
                        </div>
                        <LogoutButton className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-2xl transition cursor-pointer" />
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
                        <TeacherListCard
                            teachers={teacherListing.items}
                            page={teacherPage}
                            pageSize={8}
                            totalCount={teacherListing.totalCount}
                            onPageChange={setTeacherPage}
                        />
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
                            classesList={classListing.items}
                            teachers={teachers} 
                            page={classPage}
                            pageSize={8}
                            totalCount={classListing.totalCount}
                            onPageChange={setClassPage}
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
                classStudentPage={classStudentPage}
                classStudentCount={classStudentCount}
                onClassStudentPageChange={nextPage => {
                    if (selectedClassForStudents) {
                        handleOpenClassStudents(selectedClassForStudents, nextPage, availableStudentPage);
                    }
                }}
                availableStudents={availableStudents}
                availableStudentPage={availableStudentPage}
                availableStudentCount={availableStudentCount}
                onAvailableStudentPageChange={nextPage => {
                    if (selectedClassForStudents) {
                        handleOpenClassStudents(selectedClassForStudents, classStudentPage, nextPage);
                    }
                }}
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