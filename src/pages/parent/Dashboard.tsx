import { useEffect, useState } from 'react';
import { Clock, Calendar, AlertTriangle, CheckCircle, GraduationCap } from 'lucide-react';
import { parentApi } from '../../utils/api';
import type { ParentStudentInfo } from '../../../shared/types';

export default function ParentDashboard() {
  const [students, setStudents] = useState<ParentStudentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await parentApi.getStudents();
      setStudents(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const totalRemainingHours = students.reduce((sum, s) => sum + s.remainingHours, 0);
  const totalHours = students.reduce((sum, s) => sum + s.totalHours, 0);
  const frozenCount = students.filter(s => s.isFrozen).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getDaysRemaining = (expireDate: string) => {
    const today = new Date();
    const expire = new Date(expireDate);
    const diff = Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
        <h1 className="text-2xl font-bold text-slate-900">家长中心</h1>
        <p className="text-slate-500 mt-1">查看孩子的学习进度和课时情况</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-blue-100 text-sm">总剩余课时</span>
          </div>
          <p className="text-4xl font-bold">{totalRemainingHours}</p>
          <p className="text-blue-100 mt-2">总课时 {totalHours} 节</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-emerald-100 text-sm">在读课程</span>
          </div>
          <p className="text-4xl font-bold">{students.length}</p>
          <p className="text-emerald-100 mt-2">门课程</p>
        </div>

        <div className={`rounded-2xl p-6 text-white shadow-lg ${
          frozenCount > 0 
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20' 
            : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className={`text-sm ${frozenCount > 0 ? 'text-amber-100' : 'text-slate-100'}`}>已冻结课时</span>
          </div>
          <p className="text-4xl font-bold">{frozenCount}</p>
          <p className={`mt-2 ${frozenCount > 0 ? 'text-amber-100' : 'text-slate-100'}`}>
            {frozenCount > 0 ? '请联系管理员解锁' : '暂无冻结课时'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">我的孩子</h2>
        <div className="space-y-4">
          {students.map((student) => {
            const daysRemaining = getDaysRemaining(student.expireDate);
            const progress = ((student.totalHours - student.remainingHours) / student.totalHours) * 100;
            
            return (
              <div 
                key={student.id} 
                className={`p-5 rounded-xl border transition-colors ${
                  student.isFrozen 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'hover:border-blue-300 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{student.name}</h3>
                      <p className="text-slate-500">{student.age}岁 · {student.courseName}</p>
                      <p className="text-sm text-slate-400 mt-1">{student.className}</p>
                    </div>
                  </div>
                  {student.isFrozen ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      已冻结
                    </span>
                  ) : daysRemaining <= 30 ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      剩余 {daysRemaining} 天
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      正常
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600">课时进度</span>
                      <span className="font-medium text-slate-900">
                        已上 {student.totalHours - student.remainingHours} / {student.totalHours} 课时
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">剩余课时</p>
                      <p className="text-xl font-bold text-blue-600">{student.remainingHours}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">有效期至</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(student.expireDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">报名日期</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(student.expireDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {students.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>暂无在读学员信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
