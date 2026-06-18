import { useEffect, useState } from 'react';
import { Clock, Calendar, AlertTriangle, CheckCircle, GraduationCap, User, FileText } from 'lucide-react';
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

  const enrolledStudents = students.filter(s => s.status === 'enrolled');
  const consultingStudents = students.filter(s => s.status === 'consulting');

  const totalRemainingHours = enrolledStudents.reduce((sum, s) => sum + s.remainingHours, 0);
  const totalHours = enrolledStudents.reduce((sum, s) => sum + s.totalHours, 0);
  const frozenCount = enrolledStudents.filter(s => s.isFrozen).length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getDaysRemaining = (expireDate?: string) => {
    if (!expireDate) return 0;
    const today = new Date();
    const expire = new Date(expireDate);
    return Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无关联的孩子信息</h3>
          <p className="text-slate-500">如有疑问，请联系课程顾问</p>
        </div>
      ) : (
        <>
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
              <p className="text-4xl font-bold">{enrolledStudents.length}</p>
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

          {enrolledStudents.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">已报名课程</h2>
              <div className="space-y-4">
                {enrolledStudents.map((student) => {
                  const daysRemaining = getDaysRemaining(student.expireDate);
                  const progress = student.totalHours > 0 
                    ? ((student.totalHours - student.remainingHours) / student.totalHours) * 100 
                    : 0;
                  
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
                            <p className="text-sm text-slate-400 mt-1">{student.className || '待分班'}</p>
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
                            <p className="text-xs text-slate-500">上课记录</p>
                            <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              可在记录页查看
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {consultingStudents.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                咨询中
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultingStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                          <span className="text-white font-bold">{student.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{student.name}</h3>
                          <p className="text-sm text-slate-500">{student.age}岁</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        咨询中
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-500">
                        暂无课时信息，请等待报名完成
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
