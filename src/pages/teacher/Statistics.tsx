import { useEffect, useState } from 'react';
import { FileBarChart, TrendingUp, UserCheck, UserX, CalendarX, Download } from 'lucide-react';
import { classApi, attendanceApi, reportApi } from '../../utils/api';
import type { ClassWithStats, AttendanceStatistics } from '../../../shared/types';

export default function TeacherStatistics() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<AttendanceStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStatistics();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const res = await classApi.getAll();
      setClasses(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedClass(res.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const res = await attendanceApi.getStatistics(selectedClass);
      setStatistics(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (selectedClass) {
      reportApi.exportRoster(selectedClass);
    }
  };

  const avgAttendanceRate = statistics.length > 0
    ? Math.round(statistics.reduce((sum, s) => sum + s.attendanceRate, 0) / statistics.length)
    : 0;

  const totalPresent = statistics.reduce((sum, s) => sum + s.presentCount, 0);
  const totalAbsent = statistics.reduce((sum, s) => sum + s.absentCount, 0);
  const totalLeave = statistics.reduce((sum, s) => sum + s.leaveCount, 0);

  if (loading && statistics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">出勤统计</h1>
          <p className="text-slate-500 mt-1">查看班级出勤情况和统计数据</p>
        </div>
        {selectedClass && (
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出名单
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">选择班级</label>
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.courseName})
              </option>
            ))}
          </select>
        </div>

        {selectedClass && statistics.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">平均出勤率</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">{avgAttendanceRate}%</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <UserCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">总出勤次数</span>
                </div>
                <p className="text-3xl font-bold text-emerald-700">{totalPresent}</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <UserX className="w-5 h-5" />
                  <span className="text-sm font-medium">总缺勤次数</span>
                </div>
                <p className="text-3xl font-bold text-red-700">{totalAbsent}</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <CalendarX className="w-5 h-5" />
                  <span className="text-sm font-medium">总请假次数</span>
                </div>
                <p className="text-3xl font-bold text-amber-700">{totalLeave}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">学员姓名</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-600">总课次</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-600">出勤</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-600">缺勤</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-slate-600">请假</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-slate-600">出勤率</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat) => (
                    <tr key={stat.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium text-xs">{stat.studentName.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-900">{stat.studentName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600">{stat.totalClasses}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                          {stat.presentCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {stat.absentCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          {stat.leaveCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                stat.attendanceRate >= 90 ? 'bg-emerald-500' :
                                stat.attendanceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${stat.attendanceRate}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            stat.attendanceRate >= 90 ? 'text-emerald-600' :
                            stat.attendanceRate >= 70 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {stat.attendanceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {selectedClass && statistics.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            <FileBarChart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>暂无考勤数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
