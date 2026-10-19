import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Mission from './pages/Mission';
import ScoreHistory from './pages/ScoreHistory';
import VocabList from './pages/VocabList';
// import VocabStudy from './pages/VocabStudy'; // 1. Thêm trang học Flashcard Quizlet cho học sinh
import MyAccount from './pages/MyAccount';
import DoTest from './pages/DoTest';
import AdminDashboard from './pages/AdminDashboard';

// Các trang của giảng viên sau khi tách
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherOverview from './pages/teacher/TeacherOverview';
import TeacherUploadTest from './pages/teacher/TeacherUploadTest';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherVocabUpload from './pages/teacher/TeacherVocabUpload'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/score" element={<ScoreHistory />} />
        <Route path="/vocab" element={<VocabList />} />
        {/* <Route path="/vocab/study/:seriesName" element={<VocabStudy />} /> 3. Route học chi tiết bộ từ vựng */}
        <Route path="/account" element={<MyAccount />} />
        <Route path="/test/:id" element={<DoTest />} />

        {/* Khung giao diện quản lý của Giảng viên (Layout chung Sidebar + Outlet) */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="overview" element={<TeacherOverview />} />
          <Route path="upload" element={<TeacherUploadTest />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="vocab-upload" element={<TeacherVocabUpload />} /> {/* 4. Route upload vocab nằm trong khung layout giáo viên */}
        </Route>

        {/* Route dự phòng nếu link cũ gọi trực tiếp /teacher-dashboard */}
        <Route path="/teacher-dashboard" element={<TeacherOverview />} />
      </Routes>
    </Router>
  );
}

export default App;