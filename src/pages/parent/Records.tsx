import { useEffect, useState } from 'react';
import { History, UserCheck, UserX, CalendarX, Calendar } from 'lucide-react';
import { parentApi } from '../../utils/api';
import type { ParentAttendanceRecord } from '../../../shared/types';

export default function ParentRecords() {
  const [records, setRecords] = useState<ParentAttendanceRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await parentApi.getAttendanceRecords();
      setRecords(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.status === filter);

  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const statusConfig = {
    present: { label: '出勤', icon: UserCheck, color: 'emerald' },
    absent: { label: '缺勤', icon: UserX, color: 'red' },
    leave: { label: '请假', icon: CalendarX, color: 'amber' },
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
        <h1 className="text-2xl font-bold text-slate-900">上课记录</h1>
        <p className="text-slate-500 mt-1">查看所有出勤记录和上课情况</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总出勤</p>
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总缺勤</p>
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <CalendarX className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总请假</p>
              <p className="text-2xl font-bold text-amber-600">{leaveCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(['all', 'present', 'absent', 'leave'] as const).map((f) => {
            const config = f === 'all' 
              ? { label: '全部', icon: History, color: 'blue' } 
              : statusConfig[f];
            const Icon = config.icon;
            
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === f
                    ? `bg-${config.color}-500 text-white shadow-lg shadow-${config.color}-500/30`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const config = statusConfig[record.status];
            const Icon = config.icon;
            
            return (
              <div 
                key={record.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    record.status === 'present' ? 'bg-emerald-100' :
                    record.status === 'absent' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      record.status === 'present' ? 'text-emerald-600' :
                      record.status === 'absent' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <p className="font-medium text-slate-900">{formatDate(record.attendanceDate)}</p>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{record.className}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                  record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {config.label}
                </span>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>暂无上课记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
