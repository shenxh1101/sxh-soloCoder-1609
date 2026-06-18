import { useEffect, useState, useMemo } from 'react';
import { Clock, Minus, Plus, Calendar, Download, RefreshCw, X } from 'lucide-react';
import { reportApi, studentApi, classApi, courseApi } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import type { HourlyLog, StudentWithDetails, ClassWithStats, Course } from '../../shared/types';

interface HourlyLogsPageProps {
  studentId?: number;
  title?: string;
}

export default function HourlyLogsPage({ studentId, title }: HourlyLogsPageProps) {
  const [logs, setLogs] = useState<HourlyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<StudentWithDetails[]>([]);
  const [allClasses, setAllClasses] = useState<ClassWithStats[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const [filterStudentId, setFilterStudentId] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterCourseId, setFilterCourseId] = useState<string>('');
  const [filterStart, setFilterStart] = useState<string>('');
  const [filterEnd, setFilterEnd] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterParentStudentId, setFilterParentStudentId] = useState<string>('');

  const user = useAuthStore(state => state.user);
  const isParent = user?.role === 'parent';

  useEffect(() => {
    if (!isParent && !studentId) {
      Promise.all([
        studentApi.getAll().then(r => setAllStudents(r.data || [])),
        classApi.getAll().then(r => setAllClasses(r.data || [])),
        courseApi.getAll().then(r => setAllCourses(r.data || [])),
      ]).catch(() => {});
    }
  }, [isParent, studentId]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const parentKids = useMemo(() => {
    const seen = new Map<number, string>();
    logs.forEach(l => {
      if (l.studentId && l.studentName) seen.set(l.studentId, l.studentName);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const getFiltersForApi = (): Record<string, any> => {
    const f: Record<string, any> = {};
    if (filterStudentId) f.studentId = filterStudentId;
    if (filterClassId) f.classId = filterClassId;
    if (filterCourseId) f.courseId = filterCourseId;
    if (filterStart) f.startDate = filterStart;
    if (filterEnd) f.endDate = filterEnd;
    if (filterType && filterType !== 'all') f.changeType = filterType;

    if (isParent) {
      if (filterParentStudentId) f.studentId = filterParentStudentId;
      if (filterMonth) {
        const [y, m] = filterMonth.split('-');
        const start = `${y}-${m}-01`;
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
        f.startDate = start;
        f.endDate = end;
      }
      if (filterType && filterType !== 'all') f.changeType = filterType;
    }
    return f;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = getFiltersForApi();
      let res;
      if (isParent) {
        res = await reportApi.getParentHourlyLogs(filters);
      } else if (studentId) {
        res = await reportApi.getHourlyLogsByStudent(studentId, filters);
      } else {
        res = await reportApi.getAllHourlyLogs(filters);
      }
      setLogs(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const filters = getFiltersForApi();
    if (isParent) delete filters.parentPhone;
    reportApi.exportHourlyLogs(filters);
  };

  const resetFilters = () => {
    setFilterStudentId('');
    setFilterClassId('');
    setFilterCourseId('');
    setFilterStart('');
    setFilterEnd('');
    setFilterType('all');
    setFilterParentStudentId('');
  };

  const filteredLogs = logs;

  const totalDeducted = filteredLogs
    .filter(l => l.changeType === 'deduct')
    .reduce((sum, l) => sum + Math.abs(l.changeAmount), 0);

  const totalRefunded = filteredLogs
    .filter(l => l.changeType === 'refund')
    .reduce((sum, l) => sum + l.changeAmount, 0);

  const totalEnrolled = filteredLogs
    .filter(l => l.changeType === 'enroll')
    .reduce((sum, l) => sum + l.changeAmount, 0);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    deduct: { label: '扣减', icon: Minus, color: 'red' },
    refund: { label: '补回', icon: Plus, color: 'emerald' },
    enroll: { label: '充值', icon: Plus, color: 'blue' },
    manual: { label: '手动', icon: Clock, color: 'purple' },
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title || (isParent ? '我的课时流水' : '课时流水对账')}</h1>
          <p className="text-slate-500 mt-1">{isParent ? '查看孩子的课时变动记录' : '按条件筛选并导出对账明细'}</p>
        </div>
        {!isParent && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>导出CSV</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-blue-100 text-sm">累计充值</span>
          </div>
          <p className="text-3xl font-bold">+{totalEnrolled}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg shadow-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Minus className="w-5 h-5" />
            </div>
            <span className="text-red-100 text-sm">累计扣减</span>
          </div>
          <p className="text-3xl font-bold">-{totalDeducted}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-emerald-100 text-sm">累计补回</span>
          </div>
          <p className="text-3xl font-bold">+{totalRefunded}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        {!isParent ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">学员</label>
                <select
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">全部学员</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">班级</label>
                <select
                  value={filterClassId}
                  onChange={(e) => setFilterClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">全部班级</option>
                  {allClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">课程</label>
                <select
                  value={filterCourseId}
                  onChange={(e) => setFilterCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">全部课程</option>
                  {allCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">开始日期</label>
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">结束日期</label>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'enroll', 'deduct', 'refund', 'manual'] as const).map((type) => {
                const config = type === 'all'
                  ? { label: '全部', color: 'blue' }
                  : typeConfig[type];
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filterType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'all' ? '全部' : config.label}
                  </button>
                );
              })}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>清除</span>
                </button>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>查询</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">选择孩子</label>
                <select
                  value={filterParentStudentId}
                  onChange={(e) => setFilterParentStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">全部孩子</option>
                  {parentKids.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">月份</label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'enroll', 'deduct', 'refund'] as const).map((type) => {
                const config = type === 'all'
                  ? { label: '全部' }
                  : typeConfig[type];
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filterType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'all' ? '全部' : config.label}
                  </button>
                );
              })}
              <div className="ml-auto">
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>查询</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">变动明细</h3>
          <span className="text-sm text-slate-500">共 {filteredLogs.length} 条</span>
        </div>
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const config = typeConfig[log.changeType] || typeConfig.manual;
            const Icon = config.icon;
            const isPositive = log.changeAmount > 0;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    log.changeType === 'deduct' ? 'bg-red-100' :
                    log.changeType === 'refund' ? 'bg-emerald-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      log.changeType === 'deduct' ? 'text-red-600' :
                      log.changeType === 'refund' ? 'text-emerald-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.studentName && (
                        <p className="font-medium text-slate-900">{log.studentName}</p>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.changeType === 'deduct' ? 'bg-red-100 text-red-700' :
                        log.changeType === 'refund' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{log.reason}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(log.createdAt)}
                      {log.className && <span>· {log.className}</span>}
                      {log.courseName && <span>· {log.courseName}</span>}
                      {log.operatorName && <span>· 操作人：{log.operatorName}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right min-w-[110px]">
                  <p className={`text-xl font-bold ${
                    isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {isPositive ? '+' : ''}{log.changeAmount}
                  </p>
                  <p className="text-sm text-slate-500">余额 {log.balanceAfter}课时</p>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>暂无课时变动记录</p>
              <p className="text-xs mt-2">尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
