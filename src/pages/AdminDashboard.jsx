import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

// Import các component đã tách
import CreateUserCard from '../components/admin/CreateUserCard';
import TeacherListCard from '../components/admin/TeacherListCard';
import StudentListCard from '../components/admin/StudentListCard';
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

    // State Quản lý Học sinh (Tab 2)
    const [studentPage, setStudentPage] = useState(1);
    const [studentListing, setStudentListing] = useState({ items: [], totalCount: 0 });
    const [studentSearch, setStudentSearch] = useState('');
    const [studentClassFilter, setStudentClassFilter] = useState('');
    const [studentRefresh, setStudentRefresh] = useState(0);
    const [isLoadingStudentsTab, setIsLoadingStudentsTab] = useState(false);

    // Modal thông báo
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // Modal Quản lý Học sinh & Giáo viên trong Lớp (2-4 Giáo viên)
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [classTeachers, setClassTeachers] = useState([]);
    const [teacherToAddId, setTeacherToAddId] = useState('');
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

    // Tải danh sách học sinh khi mở Tab Quản lý Học viên
    useEffect(() => {
        if (activeTab !== 'students') return;
        const controller = new AbortController();
        setIsLoadingStudentsTab(true);

        // Load class options if not loaded
        if (!hasLoadedClassOptions) {
            loadClassOptions(controller.signal);
        }

        api.get('/admin/students', {
            params: {
                page: studentPage,
                pageSize: 10,
                search: studentSearch || undefined,
                classCode: studentClassFilter || undefined
            },
            signal: controller.signal
        })
            .then(res => {
                setStudentListing(res.data);
                setStudentPage(res.data.page);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error('Lỗi tải danh sách học viên:', err);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingStudentsTab(false);
            });

        return () => controller.abort();
    }, [activeTab, studentPage, studentSearch, studentClassFilter, studentRefresh, hasLoadedClassOptions, loadClassOptions]);

    // Xử lý Khóa / Mở khóa đăng nhập tài khoản học sinh
    const handleToggleUserStatus = async (studentId, currentIsActive, studentName) => {
        const actionText = currentIsActive ? 'khóa quyền đăng nhập' : 'mở khóa đăng nhập';
        if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho học viên "${studentName}"?`)) {
            return;
        }
        try {
            const res = await api.post(`/admin/users/${studentId}/toggle-status`);
            showAlert("Thành công! 🎉", res.data.message);
            setStudentRefresh(prev => prev + 1);
        } catch (err) {
            console.error("Lỗi thay đổi trạng thái tài khoản:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể cập nhật trạng thái tài khoản.", "error");
        }
    };

    // Xử lý Xóa vĩnh viễn tài khoản học sinh
    const handleDeleteStudent = async (studentId, studentName) => {
        if (!window.confirm(`CẢNH BÁO NGUY HIỂM:\nBạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản học viên "${studentName}" khỏi hệ thống?\nToàn bộ dữ liệu điểm số, bài nộp và bình luận của bạn này sẽ bị xóa sạch.`)) {
            return;
        }
        try {
            const res = await api.delete(`/admin/users/${studentId}`);
            showAlert("Đã xóa! 🗑️", res.data.message);
            setStudentRefresh(prev => prev + 1);
        } catch (err) {
            console.error("Lỗi xóa tài khoản học sinh:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể xóa tài khoản học sinh.", "error");
        }
    };

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
            const [studentsRes, availableRes, teachersRes] = await Promise.all([
                api.get(`/admin/classes/${code}/students`, {
                    params: { page: studentPage, pageSize: 8 }
                }),
                api.get(`/admin/classes/${code}/available-students`, {
                    params: { page: availablePage, pageSize: 10 }
                }),
                api.get(`/classes/${code}/team`).then(r => ({ data: r.data.teachers || [] })).catch(() => ({ data: [] }))
            ]);
            setClassStudents(studentsRes.data.items);
            setClassStudentPage(studentsRes.data.page);
            setClassStudentCount(studentsRes.data.totalCount);
            setAvailableStudents(availableRes.data.items);
            setAvailableStudentPage(availableRes.data.page);
            setAvailableStudentCount(availableRes.data.totalCount);
            setClassTeachers(teachersRes.data || []);
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

    // Xử lý Thêm Giáo Viên vào Lớp (hỗ trợ phân công 2 - 4 giáo viên)
    const handleAddTeacherToClass = async (e) => {
        e.preventDefault();
        if (!teacherToAddId || !selectedClassForStudents) return;
        const code = selectedClassForStudents.classCode || selectedClassForStudents.ClassCode;

        try {
            await api.post(`/admin/classes/${code}/teachers`, {
                teacherId: parseInt(teacherToAddId)
            });
            showAlert("Thành công! 👩‍🏫", "Đã phân công giáo viên vào lớp học!");
            setTeacherToAddId('');
            // Tải lại danh sách giáo viên của lớp
            const res = await api.get(`/admin/classes/${code}/teachers`);
            setClassTeachers(res.data || []);
            setClassRefresh(v => v + 1);
        } catch (err) {
            console.error("Lỗi thêm giáo viên:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể phân công giáo viên vào lớp.", "error");
        }
    };

    // Xử lý Truyền Key Chính (Giáo viên chính)
    const handleTransferLeadKey = async (teacherId, teacherName) => {
        if (!selectedClassForStudents) return;
        const code = selectedClassForStudents.classCode || selectedClassForStudents.ClassCode;
        if (!window.confirm(`XÁC NHẬN CHUYỂN KEY CHÍNH:\nBạn có chắc chắn muốn chuyển Key Giáo viên chính của lớp ${code} cho cô/thầy ${teacherName}?`)) return;
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.post(`/classes/${code}/team/transfer-key`, {
                newLeadTeacherId: teacherId,
                requestUserId: user.id
            });
            showAlert("Thành công! 👑", `Đã chuyển quyền Giáo viên chính cho ${teacherName}!`);
            fetchClasses(classPage);
            // Cập nhật lại danh sách giáo viên của lớp
            const res = await api.get(`/classes/${code}/team`, { params: { userId: user.id } });
            setClassTeachers(res.data.teachers || []);
        } catch (err) {
            console.error("Lỗi chuyển key chính:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể chuyển key chính.", "error");
        }
    };

    // Xử lý Gỡ Giáo Viên khỏi Lớp
    const handleRemoveTeacherFromClass = async (teacherId, teacherName) => {
        if (!selectedClassForStudents) return;
        const code = selectedClassForStudents.classCode || selectedClassForStudents.ClassCode;

        if (!window.confirm(`Bạn có chắc chắn muốn gỡ giáo viên "${teacherName}" khỏi lớp ${code}?`)) {
            return;
        }

        try {
            await api.delete(`/admin/classes/${code}/teachers/${teacherId}`);
            showAlert("Đã gỡ! 🗑️", `Đã gỡ giáo viên "${teacherName}" khỏi lớp ${code}!`);
            // Tải lại danh sách giáo viên của lớp
            const res = await api.get(`/admin/classes/${code}/teachers`);
            setClassTeachers(res.data || []);
            setClassRefresh(v => v + 1);
        } catch (err) {
            console.error("Lỗi gỡ giáo viên:", err);
            showAlert("Lỗi", err.response?.data?.message || "Không thể gỡ giáo viên khỏi lớp.", "error");
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
                <div className="flex flex-wrap gap-3 mb-8">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'users' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                    >
                        <span>👤</span>
                        <span>Tạo Tài Khoản</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('students')}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'students' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                    >
                        <span>🎓</span>
                        <span>Quản lý Học viên & Đăng nhập</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('classes')}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'classes' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'}`}
                    >
                        <span>🏫</span>
                        <span>Tạo Khóa / Lớp Học</span>
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

                {/* TAB 2: QUẢN LÝ HỌC VIÊN & QUYỀN ĐĂNG NHẬP */}
                {activeTab === 'students' && (
                    <StudentListCard
                        students={studentListing.items}
                        page={studentPage}
                        pageSize={10}
                        totalCount={studentListing.totalCount}
                        onPageChange={setStudentPage}
                        search={studentSearch}
                        onSearchChange={(val) => {
                            setStudentSearch(val);
                            setStudentPage(1);
                        }}
                        classFilter={studentClassFilter}
                        onClassFilterChange={(val) => {
                            setStudentClassFilter(val);
                            setStudentPage(1);
                        }}
                        classesList={classesList}
                        onToggleStatus={handleToggleUserStatus}
                        onDeleteStudent={handleDeleteStudent}
                        isLoading={isLoadingStudentsTab}
                    />
                )}

                {/* TAB 3: TẠO & QUẢN LÝ LỚP HỌC */}
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
                classTeachers={classTeachers}
                allTeachers={teachers}
                teacherToAddId={teacherToAddId}
                setTeacherToAddId={setTeacherToAddId}
                onAddTeacherToClass={handleAddTeacherToClass}
                onRemoveTeacherFromClass={handleRemoveTeacherFromClass}
                onTransferLeadKey={handleTransferLeadKey}
            />

            {/* Modal Thông báo */}
            <AlertModal modal={modal} onClose={() => setModal({ ...modal, isOpen: false })} />
        </div>
    );
}