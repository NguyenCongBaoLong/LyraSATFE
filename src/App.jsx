import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './pages/Login';

const Home = lazy(() => import('./pages/Home'));
const Mission = lazy(() => import('./pages/Mission'));
const ScoreHistory = lazy(() => import('./pages/ScoreHistory'));
const VocabList = lazy(() => import('./pages/VocabList'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const DoTest = lazy(() => import('./pages/DoTest'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));

const TeacherLayout = lazy(() => import('./pages/teacher/TeacherLayout'));
const TeacherOverview = lazy(() => import('./pages/teacher/TeacherOverview'));
const TeacherUploadTest = lazy(() => import('./pages/teacher/TeacherUploadTest'));
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'));
const TeacherVocabUpload = lazy(() => import('./pages/teacher/TeacherVocabUpload'));

function DoTestRoute() {
  const { id } = useParams();
  return <DoTest key={id} />;
}

const PageLoader = (
  <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-pink-600 font-bold text-xs font-sans">
    Đang tải...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={PageLoader}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/score" element={<ScoreHistory />} />
          <Route path="/vocab" element={<VocabList />} />
          <Route path="/account" element={<MyAccount />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/test/:id" element={<DoTestRoute />} />

          {/* Khung giao diện quản lý của Giảng viên (Layout chung Sidebar + Outlet) */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route path="overview" element={<TeacherOverview />} />
            <Route path="upload" element={<TeacherUploadTest />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="vocab-upload" element={<TeacherVocabUpload />} />
          </Route>

          {/* Route dự phòng nếu link cũ gọi trực tiếp /teacher-dashboard */}
          <Route path="/teacher-dashboard" element={<Navigate to="/teacher/overview" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
