import { useEffect, useState } from 'react';
import { GraduationCap, Users, CalendarCheck, TrendingUp, Clock } from 'lucide-react';
import { classApi, attendanceApi } from '../../utils/api';
import type { ClassWithStats, AttendanceRecord } from '../../../shared/types';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todayCheckIn: 0,
    attendanceRate: 0,
  });
  const [myClasses, setMyClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const classesRes = await classApi.getAll();
      const classData = classesRes.data || [];
      
      const totalStudents = classData.reduce((sum, c) => sum + c.currentStudents, 0);
      
      const today = new Date().toISOString().split('T')[0];
      let todayCheckIn = 0;
      
      for (const cls of classData) {
        const attRes = await attendanceApi.getClassAttendance(cls.id, today);
        todayCheckIn += (attRes.data || []).filter(r => r.status === 'present').length;
      }

      setStats({
        totalClasses: classData.length,
        totalStudents,
        todayCheckIn,
        attendanceRate: totalStudents > 0 ? Math.round((todayCheckIn / totalStudents) * 100) : 0,
      });

      setMyClasses(classData);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '教授班级', value: stats.totalClasses, icon: GraduationCap, color: 'blue' },
    { label: '学员总数', value: stats.totalStudents, icon: Users, color: 'purple' },
    { label: '今日签到', value: stats.todayCheckIn, icon: CalendarCheck, color: 'green' },
    { label: '出勤率', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
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
        <h1 className="text-2xl font-bold text-slate-900">教师工作台</h1>
        <p className="text-slate-500 mt-1">欢迎回来，查看今日教学概况</p>
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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">我的班级</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClasses.map((cls) => (
            <div key={cls.id} className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
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
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{cls.schedule}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
