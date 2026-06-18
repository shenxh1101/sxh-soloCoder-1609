import { useEffect, useState } from 'react';
import { FileBarChart, Users, GraduationCap, DollarSign, Download, TrendingUp } from 'lucide-react';
import { classApi, studentApi, reportApi } from '../../utils/api';
import type { ClassWithStats, StudentWithDetails } from '../../../shared/types';

export default function AdminReports() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classApi.getAll(),
        studentApi.getAll(),
      ]);
      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
      if (classesRes.data && classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportRoster = (classId: number) => {
    reportApi.exportRoster(classId);
  };

  const totalRevenue = students
    .filter(s => s.enrollment)
    .reduce((sum, s) => sum + (s.enrollment?.paidAmount || 0), 0);

  const avgClassSize = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + c.currentStudents, 0) / classes.length)
    : 0;

  const enrolledStudents = students.filter(s => s.status === 'enrolled').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">统计报表</h1>
        <p className="text-slate-500 mt-1">查看系统运营数据和统计报表</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-3xl font-bold">{enrolledStudents}</p>
          <p className="text-blue-100 mt-1">在读学员</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-200" />
          </div>
          <p className="text-3xl font-bold">{classes.length}</p>
          <p className="text-purple-100 mt-1">开设班级</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold">¥{totalRevenue.toLocaleString()}</p>
          <p className="text-emerald-100 mt-1">总营收</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-amber-200" />
          </div>
          <p className="text-3xl font-bold">{avgClassSize}</p>
          <p className="text-amber-100 mt-1">平均班额</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">班级名单导出</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{cls.courseName}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  cls.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  cls.status === 'full' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {cls.status === 'active' ? '进行中' : cls.status === 'full' ? '已满员' : '已结束'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <p>教师：{cls.teacherName || '未分配'}</p>
                <p>上课时间：{cls.schedule}</p>
                <p>年龄：{cls.minAge}-{cls.maxAge}岁</p>
                <p>人数：{cls.currentStudents}/{cls.maxStudents}人</p>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (cls.currentStudents / cls.maxStudents) >= 0.9 ? 'bg-red-500' :
                    (cls.currentStudents / cls.maxStudents) >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                />
              </div>
              <button
                onClick={() => handleExportRoster(cls.id)}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出班级名单
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">学员报名统计</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">学员姓名</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">年龄</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">课程</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">班级</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">缴费金额</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">总课时</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">剩余课时</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {students.filter(s => s.status === 'enrolled').map((student) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-xs">{student.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{student.age}岁</td>
                  <td className="py-4 px-4 text-slate-600">{student.intendedCourseName || '-'}</td>
                  <td className="py-4 px-4 text-slate-600">{student.className || '-'}</td>
                  <td className="py-4 px-4 text-emerald-600 font-medium">
                    ¥{student.enrollment?.paidAmount?.toLocaleString() || '-'}
                  </td>
                  <td className="py-4 px-4 text-slate-600">{student.enrollment?.totalHours || '-'}</td>
                  <td className="py-4 px-4">
                    <span className={`font-medium ${
                      (student.enrollment?.remainingHours || 0) <= 10 ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {student.enrollment?.remainingHours || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.status === 'enrolled' ? 'bg-emerald-100 text-emerald-700' :
                      student.status === 'consulting' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status === 'enrolled' ? '已报名' : student.status === 'consulting' ? '咨询中' : '已停课'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
