import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, UserCheck, UserX, Clock } from 'lucide-react';
import { studentApi, classApi, courseApi, userApi } from '../../utils/api';
import type { StudentWithDetails, ClassWithStats, Course, User } from '../../../shared/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalCourses: 0,
    totalTeachers: 0,
    totalConsultants: 0,
    enrolledStudents: 0,
    activeClasses: 0,
    suspendedStudents: 0,
  });
  const [recentStudents, setRecentStudents] = useState<StudentWithDetails[]>([]);
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes, coursesRes, teachersRes, consultantsRes] = await Promise.all([
        studentApi.getAll(),
        classApi.getAll(),
        courseApi.getAll(),
        userApi.getTeachers(),
        userApi.getAll('consultant'),
      ]);

      const students = studentsRes.data || [];
      const classData = classesRes.data || [];
      const courses = coursesRes.data || [];
      const teachers = teachersRes.data || [];
      const consultants = consultantsRes.data || [];

      setStats({
        totalStudents: students.length,
        totalClasses: classData.length,
        totalCourses: courses.length,
        totalTeachers: teachers.length,
        totalConsultants: consultants.length,
        enrolledStudents: students.filter(s => s.status === 'enrolled').length,
        activeClasses: classData.filter(c => c.status === 'active').length,
        suspendedStudents: students.filter(s => s.status === 'suspended').length,
      });

      setRecentStudents(students.slice(0, 5));
      setClasses(classData.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '总学员数', value: stats.totalStudents, icon: Users, color: 'blue' },
    { label: '已报名', value: stats.enrolledStudents, icon: UserCheck, color: 'green' },
    { label: '已停课', value: stats.suspendedStudents, icon: UserX, color: 'red' },
    { label: '总班级数', value: stats.totalClasses, icon: GraduationCap, color: 'purple' },
    { label: '进行中', value: stats.activeClasses, icon: Clock, color: 'cyan' },
    { label: '总课程数', value: stats.totalCourses, icon: BookOpen, color: 'amber' },
    { label: '教师数量', value: stats.totalTeachers, icon: GraduationCap, color: 'indigo' },
    { label: '顾问数量', value: stats.totalConsultants, icon: Users, color: 'pink' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600',
    amber: 'from-amber-500 to-amber-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">管理员工作台</h1>
        <p className="text-slate-500 mt-1">查看系统全局数据和运营概况</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[card.color]} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">最近学员</h2>
            <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">查看全部</span>
          </div>
          <div className="space-y-4">
            {recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{student.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.age}岁 · {student.parentPhone}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  student.status === 'consulting' ? 'bg-amber-100 text-amber-700' :
                  student.status === 'enrolled' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {student.status === 'consulting' ? '咨询中' : student.status === 'enrolled' ? '已报名' : '已停课'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">班级概况</h2>
            <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">查看全部</span>
          </div>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{cls.name}</h3>
                  <span className="text-xs text-slate-500">{cls.courseName}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{cls.schedule}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {cls.currentStudents}/{cls.maxStudents}人
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    cls.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    cls.status === 'full' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {cls.status === 'active' ? '招生中' : cls.status === 'full' ? '已满员' : '已结束'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
