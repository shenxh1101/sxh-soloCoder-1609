import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import MainLayout from '@/components/Layout/MainLayout';

import ConsultantDashboard from '@/pages/consultant/Dashboard';
import ConsultantStudentList from '@/pages/consultant/StudentList';
import ConsultantStudentForm from '@/pages/consultant/StudentForm';
import ConsultantStudentDetail from '@/pages/consultant/StudentDetail';
import ConsultantClassList from '@/pages/consultant/ClassList';
import ConsultantClassDetail from '@/pages/consultant/ClassDetail';
import ConsultantAutoAssign from '@/pages/consultant/AutoAssign';
import ConsultantWarnings from '@/pages/consultant/ConsultantWarnings';
import HourlyLogsPage from '@/pages/HourlyLogsPage';

import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherCheckIn from '@/pages/teacher/CheckIn';
import TeacherStatistics from '@/pages/teacher/Statistics';

import ParentDashboard from '@/pages/parent/Dashboard';
import ParentRecords from '@/pages/parent/Records';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminClassManagement from '@/pages/admin/ClassManagement';
import AdminCourseManagement from '@/pages/admin/CourseManagement';
import AdminUserManagement from '@/pages/admin/UserManagement';
import AdminReports from '@/pages/admin/Reports';
import AdminSettings from '@/pages/admin/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route element={<MainLayout allowedRoles={['consultant']} />}>
          <Route path="/consultant" element={<ConsultantDashboard />} />
          <Route path="/consultant/students" element={<ConsultantStudentList />} />
          <Route path="/consultant/students/new" element={<ConsultantStudentForm />} />
          <Route path="/consultant/students/:id" element={<ConsultantStudentDetail />} />
          <Route path="/consultant/students/:id/edit" element={<ConsultantStudentForm />} />
          <Route path="/consultant/classes" element={<ConsultantClassList />} />
          <Route path="/consultant/classes/:id" element={<ConsultantClassDetail />} />
          <Route path="/consultant/auto-assign" element={<ConsultantAutoAssign />} />
          <Route path="/consultant/warnings" element={<ConsultantWarnings />} />
          <Route path="/consultant/hourly-logs" element={<HourlyLogsPage />} />
        </Route>

        <Route element={<MainLayout allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/check-in" element={<TeacherCheckIn />} />
          <Route path="/teacher/statistics" element={<TeacherStatistics />} />
        </Route>

        <Route element={<MainLayout allowedRoles={['parent']} />}>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/records" element={<ParentRecords />} />
          <Route path="/parent/hourly-logs" element={<HourlyLogsPage />} />
        </Route>

        <Route element={<MainLayout allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/classes" element={<AdminClassManagement />} />
          <Route path="/admin/courses" element={<AdminCourseManagement />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
