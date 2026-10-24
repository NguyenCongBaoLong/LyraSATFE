import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StudentSidebar from '../components/StudentSidebar';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 8;
const tabStatuses = {
    'Làm gấp': 'urgent',
    'Đang làm': 'active',
    'Hết hạn': 'expired'
};

export default function Mission() {
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [activeTab, setActiveTab] = useState('Đang làm'); // 'Làm gấp' | 'Đang làm' | 'Hết hạn'
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            navigate('/');
            return;
        }
        setUser(storedUser);

        const classCode = storedUser.classCode || 'SAT01';
        setIsLoading(true);
        setLoadError('');
        setTests([]);
        const controller = new AbortController();
        api.get(`/tests/class/${classCode}`, {
            params: {
                status: tabStatuses[activeTab],
                studentId: storedUser.id,
                page,
                pageSize: PAGE_SIZE
            },
            signal: controller.signal
        })
            .then(res => {
                setTests(res.data.items);
                setTotalCount(res.data.totalCount);
                setPage(res.data.page);
            })
            .catch(err => {
                if (err.code === 'ERR_CANCELED') return;
                console.error("Lỗi tải danh sách bài tập:", err);
                setTotalCount(0);
                setLoadError('Không thể tải danh sách bài tập. Vui lòng thử lại.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });
        return () => {
            controller.abort();
        };
    }, [activeTab, navigate, page]);

    if (!user) return null;

    const displayTests = tests.map(test => ({
        ...test,
        statusTag: tabStatuses[activeTab] === 'urgent' ? 'Gấp (<24h)' : activeTab,
        tagColor: tabStatuses[activeTab] === 'urgent'
            ? 'bg-red-500'
            : tabStatuses[activeTab] === 'expired'
                ? 'bg-slate-400'
                : 'bg-pink-500'
    }));

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex font-sans">
            <StudentSidebar />

            {/* Nội dung chính bên phải */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header chào mừng chuẩn form Home */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-black text-pink-900">{user.fullName}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Lớp: <span className="text-slate-700 font-semibold">{user.classCode}</span></p>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer hover:bg-pink-100 transition shadow-sm">
                        <span className="text-base">🔔</span>
                        <span className="text-xs font-bold text-pink-700">Thông báo</span>
                    </div>
                </div>

                

                {/* 3 Tab chính theo yêu cầu: Làm gấp, Đang làm, Hết hạn */}
                <div className="flex gap-8 border-b border-pink-100 mb-6 pb-3 text-sm font-semibold">
                    {['Làm gấp', 'Đang làm', 'Hết hạn'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setPage(1);
                            }}
                            className={`relative pb-3 transition ${activeTab === tab ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-pink-500 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Grid bài tập dạng 2 cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoading ? (
                        <div className="col-span-2 text-center py-12 text-pink-600 text-sm bg-white rounded-3xl border border-pink-100 shadow-sm">
                            Đang tải nhiệm vụ...
                        </div>
                    ) : loadError ? (
                        <div role="alert" className="col-span-2 text-center py-12 text-rose-500 text-sm bg-white rounded-3xl border border-rose-100 shadow-sm">
                            {loadError}
                        </div>
                    ) : displayTests.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-slate-400 text-sm bg-white rounded-3xl border border-pink-100 shadow-sm">
                            Không có nhiệm vụ nào trong mục "{activeTab}".
                        </div>
                    ) : (
                        displayTests.map(test => (
                            <div 
                                key={test.id} 
                                onClick={() => navigate(`/test/${test.id}`)}
                                className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer relative overflow-hidden flex items-center justify-between"
                            >
                                {/* Tag trạng thái góc trên phải */}
                                <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-5 py-1 rounded-bl-2xl shadow-sm ${test.tagColor}`}>
                                    {test.statusTag}
                                </div>

                                <div className="flex items-center gap-4 pr-12">
                                    <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                                        ✏️
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700 tracking-tight mb-1">{test.title}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-pink-500 font-semibold">
                                            <span>⏱</span>
                                            <span>{test.deadline ? new Date(test.deadline).toLocaleString() : 'Không giới hạn thời gian'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {!isLoading && (
                    <Pagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalCount={totalCount}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
}