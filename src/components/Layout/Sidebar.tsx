import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  BookOpen, 
  FileBarChart, 
  Settings, 
  LogOut,
  UserPlus,
  UserCheck,
  Clock,
  History,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../../shared/types';

interface SidebarProps {
  user: User;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const consultantMenu: MenuItem[] = [
  { path: '/consultant', label: '工作台', icon: LayoutDashboard },
  { path: '/consultant/students', label: '学员管理', icon: Users },
  { path: '/consultant/students/new', label: '新增学员', icon: UserPlus },
  { path: '/consultant/classes', label: '班级列表', icon: GraduationCap },
  { path: '/consultant/auto-assign', label: '自动分班', icon: UserCheck },
  { path: '/consultant/warnings', label: '课时预警', icon: AlertTriangle },
  { path: '/consultant/hourly-logs', label: '课时流水', icon: Clock },
];

const teacherMenu: MenuItem[] = [
  { path: '/teacher', label: '工作台', icon: LayoutDashboard },
  { path: '/teacher/check-in', label: '上课签到', icon: CalendarCheck },
  { path: '/teacher/statistics', label: '出勤统计', icon: FileBarChart },
];

const parentMenu: MenuItem[] = [
  { path: '/parent', label: '首页', icon: LayoutDashboard },
  { path: '/parent/records', label: '上课记录', icon: History },
  { path: '/parent/hourly-logs', label: '课时流水', icon: Clock },
];

const adminMenu: MenuItem[] = [
  { path: '/admin', label: '工作台', icon: LayoutDashboard },
  { path: '/admin/classes', label: '班级管理', icon: GraduationCap },
  { path: '/admin/courses', label: '课程设置', icon: BookOpen },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/reports', label: '统计报表', icon: FileBarChart },
  { path: '/admin/settings', label: '系统设置', icon: Settings },
];

const menuMap: Record<string, MenuItem[]> = {
  consultant: consultantMenu,
  teacher: teacherMenu,
  parent: parentMenu,
  admin: adminMenu,
};

export default function Sidebar({ user }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const menu = menuMap[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleNames: Record<string, string> = {
    consultant: '课程顾问',
    teacher: '教师',
    parent: '家长',
    admin: '管理员',
  };

  return (
    <div className="w-64 bg-slate-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold">培训管理系统</h1>
            <p className="text-slate-400 text-xs">{roleNames[user.role]}端</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">{user.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user.name}</p>
            <p className="text-slate-400 text-xs truncate">{user.phone}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.endsWith(user.role)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </div>
  );
}
