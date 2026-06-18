import { useEffect, useState } from 'react';
import { Clock, Minus, Plus, Calendar } from 'lucide-react';
import { reportApi } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import type { HourlyLog } from '../../shared/types';

interface HourlyLogsPageProps {
  studentId?: number;
  title?: string;
}

export default function HourlyLogsPage({ studentId, title }: HourlyLogsPageProps) {
  const [logs, setLogs] = useState<HourlyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      let res;
      if (user?.role === 'parent') {
        res = await reportApi.getParentHourlyLogs();
      } else if (studentId) {
        res = await reportApi.getHourlyLogsByStudent(studentId);
      } else {
        res = await reportApi.getAllHourlyLogs();
      }
      setLogs(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filterType === 'all'
    ? logs
    : logs.filter(log => log.changeType === filterType);

  const totalDeducted = logs
    .filter(l => l.changeType === 'deduct')
    .reduce((sum, l) => sum + Math.abs(l.changeAmount), 0);

  const totalRefunded = logs
    .filter(l => l.changeType === 'refund')
    .reduce((sum, l) => sum + l.changeAmount, 0);

  const totalEnrolled = logs
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
        <h1 className="text-2xl font-bold text-slate-900">{title || '课时流水'}</h1>
        <p className="text-slate-500 mt-1">查看所有课时变动明细</p>
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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-2 mb-6">
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
        </div>

        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const config = typeConfig[log.changeType];
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
                    <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(log.createdAt)}
                      {log.className && <span>· {log.className}</span>}
                      {log.courseName && <span>· {log.courseName}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
