import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Calendar, Users, Phone, UserCircle, RefreshCw, ChevronRight, CheckCircle, MessageSquare, X } from 'lucide-react';
import { reportApi } from '../../utils/api';

type TabKey = 'expiringSoon' | 'lowHours' | 'longAbsent';

interface WarningItem {
  studentId: number;
  studentName: string;
  parentPhone: string;
  age: number;
  classId: number | null;
  className: string | null;
  enrollmentId: number;
  courseId: number;
  courseName: string;
  remainingHours: number;
  expireDate?: string;
  daysLeft?: number;
  lastAttendanceDate?: string;
  daysSince?: number;
  isFrozen?: number;
}

interface FollowupState {
  followStatus: string;
  nextFollowDate: string;
  followResult: string;
}

const warningTypeMap: Record<TabKey, string> = {
  expiringSoon: 'expiring_soon',
  lowHours: 'low_hours',
  longAbsent: 'long_absent',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待跟进', color: 'bg-amber-100 text-amber-700' },
  contacted: { label: '已联系', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-emerald-100 text-emerald-700' },
  ignored: { label: '已忽略', color: 'bg-slate-100 text-slate-600' },
};

export default function ConsultantWarnings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('expiringSoon');
  const [expiringSoon, setExpiringSoon] = useState<WarningItem[]>([]);
  const [lowHours, setLowHours] = useState<WarningItem[]>([]);
  const [longAbsent, setLongAbsent] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followups, setFollowups] = useState<Record<string, FollowupState>>({});
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupTarget, setFollowupTarget] = useState<{ item: WarningItem; tab: TabKey } | null>(null);
  const [followupForm, setFollowupForm] = useState<FollowupState>({ followStatus: 'contacted', nextFollowDate: '', followResult: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getHourWarnings();
      if (res.data) {
        setExpiringSoon(res.data.expiringSoon || []);
        setLowHours(res.data.lowHours || []);
        setLongAbsent(res.data.longAbsent || []);
        await loadFollowups([
          ...(res.data.expiringSoon || []),
          ...(res.data.lowHours || []),
          ...(res.data.longAbsent || []),
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFollowups = async (items: WarningItem[]) => {
    const map: Record<string, FollowupState> = {};
    const seen = new Set<number>();
    for (const item of items) {
      if (seen.has(item.enrollmentId)) continue;
      seen.add(item.enrollmentId);
      try {
        const r = await reportApi.getFollowup(item.enrollmentId);
        if (r.data) {
          const key = `${item.enrollmentId}`;
          map[key] = {
            followStatus: r.data.followStatus || 'pending',
            nextFollowDate: r.data.nextFollowDate || '',
            followResult: r.data.followResult || '',
          };
        }
      } catch {}
    }
    setFollowups(prev => ({ ...prev, ...map }));
  };

  const tabs: { key: TabKey; label: string; count: number; color: string; icon: React.ElementType }[] = [
    { key: 'expiringSoon', label: '快到期', count: expiringSoon.length, color: 'orange', icon: Calendar },
    { key: 'lowHours', label: '剩余课时少', count: lowHours.length, color: 'red', icon: Clock },
    { key: 'longAbsent', label: '长期没上课', count: longAbsent.length, color: 'purple', icon: Users },
  ];

  const currentList: WarningItem[] =
    activeTab === 'expiringSoon' ? expiringSoon : activeTab === 'lowHours' ? lowHours : longAbsent;

  const callParent = (phone: string, name: string) => {
    try {
      window.location.href = `tel:${phone}`;
    } catch {
      alert(`请联系家长：${name}  ${phone}`);
    }
  };

  const openFollowupModal = (item: WarningItem) => {
    const key = `${item.enrollmentId}`;
    const existing = followups[key];
    setFollowupTarget({ item, tab: activeTab });
    setFollowupForm({
      followStatus: existing?.followStatus || 'contacted',
      nextFollowDate: existing?.nextFollowDate || '',
      followResult: existing?.followResult || '',
    });
    setShowFollowupModal(true);
  };

  const handleSaveFollowup = async () => {
    if (!followupTarget) return;
    setSaving(true);
    try {
      const wt = warningTypeMap[followupTarget.tab];
      await reportApi.saveFollowup({
        studentId: followupTarget.item.studentId,
        enrollmentId: followupTarget.item.enrollmentId,
        warningType: wt,
        followStatus: followupForm.followStatus,
        nextFollowDate: followupForm.nextFollowDate || undefined,
        followResult: followupForm.followResult || undefined,
      });
      const key = `${followupTarget.item.enrollmentId}`;
      setFollowups(prev => ({ ...prev, [key]: { ...followupForm } }));
      setShowFollowupModal(false);
      setFollowupTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const getFollowupStatus = (item: WarningItem): FollowupState | undefined => {
    return followups[`${item.enrollmentId}`];
  };

  const renderBadge = (item: WarningItem) => {
    if (activeTab === 'expiringSoon') {
      const days = item.daysLeft ?? 0;
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          days <= 7 ? 'bg-red-100 text-red-700' : days <= 15 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {days <= 0 ? '即将到期' : `还有 ${days} 天`}
        </span>
      );
    }
    if (activeTab === 'lowHours') {
      const h = item.remainingHours;
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          h <= 0 ? 'bg-red-100 text-red-700' : h <= 1 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {h <= 0 ? '已清零' : `剩 ${h} 课时`}
        </span>
      );
    }
    const days = item.daysSince ?? 0;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        days >= 60 ? 'bg-red-100 text-red-700' : days >= 45 ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
      }`}>
        {days} 天未出勤
      </span>
    );
  };

  const renderSubInfo = (item: WarningItem) => {
    if (activeTab === 'expiringSoon') return `有效期至 ${item.expireDate}`;
    if (activeTab === 'longAbsent')
      return item.lastAttendanceDate ? `上次出勤：${item.lastAttendanceDate}` : '暂无出勤记录';
    return `有效期至 ${item.expireDate || '-'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">课时预警看板</h1>
          <p className="text-slate-500 mt-1">识别并跟进课时快到期、课时不足、长期缺课的学员</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const gradient =
            i === 0 ? 'from-orange-500 to-amber-500' : i === 1 ? 'from-red-500 to-rose-500' : 'from-purple-500 to-indigo-500';
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-br ' + gradient + ' text-white border-transparent shadow-lg scale-[1.02]'
                  : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <span className={`text-sm ${activeTab === tab.key ? 'text-white/90' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <p className={`text-3xl font-bold ${activeTab === tab.key ? 'text-white' : 'text-slate-900'}`}>
                  {tab.count}
                </p>
                <ChevronRight className={`w-5 h-5 ${activeTab === tab.key ? 'text-white/80' : 'text-slate-300'}`} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900">
              {tabs.find(t => t.key === activeTab)?.label}学员列表
            </h3>
          </div>
          <span className="text-sm text-slate-500">共 {currentList.length} 人</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-emerald-300" />
            <p className="font-medium text-slate-700">太棒了！当前分类暂无预警</p>
            <p className="text-xs mt-1">切换分类查看其他预警项</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map(item => {
              const fu = getFollowupStatus(item);
              const statusInfo = fu ? statusLabels[fu.followStatus] : null;
              return (
                <div key={`${item.enrollmentId}-${item.studentId}`} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{item.studentName}</p>
                        <span className="text-xs text-slate-400">{item.age}岁</span>
                        {renderBadge(item)}
                        {item.isFrozen ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">已冻结</span>
                        ) : null}
                        {statusInfo && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>课程：{item.courseName}</span>
                        {item.className && <span>班级：{item.className}</span>}
                        <span>剩余课时：<span className="font-medium text-slate-700">{item.remainingHours}</span></span>
                        <span>{renderSubInfo(item)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{item.parentPhone}</span>
                        {fu?.nextFollowDate && (
                          <span className="text-blue-600">下次跟进：{fu.nextFollowDate}</span>
                        )}
                        {fu?.followResult && (
                          <span className="text-slate-500 truncate max-w-[200px]">结果：{fu.followResult}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openFollowupModal(item)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm hover:bg-amber-100 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>跟进</span>
                      </button>
                      <button
                        onClick={() => callParent(item.parentPhone, item.studentName)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>联系</span>
                      </button>
                      <button
                        onClick={() => navigate(`/consultant/students/${item.studentId}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>详情</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showFollowupModal && followupTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">跟进记录 - {followupTarget.item.studentName}</h3>
              <button onClick={() => { setShowFollowupModal(false); setFollowupTarget(null); }}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm">
              <p className="text-slate-600">课程：{followupTarget.item.courseName} · 剩余：{followupTarget.item.remainingHours}课时</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">跟进状态</label>
                <select
                  value={followupForm.followStatus}
                  onChange={(e) => setFollowupForm(prev => ({ ...prev, followStatus: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">待跟进</option>
                  <option value="contacted">已联系</option>
                  <option value="resolved">已解决</option>
                  <option value="ignored">已忽略</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">下次跟进日期</label>
                <input
                  type="date"
                  value={followupForm.nextFollowDate}
                  onChange={(e) => setFollowupForm(prev => ({ ...prev, nextFollowDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">跟进结果</label>
                <textarea
                  value={followupForm.followResult}
                  onChange={(e) => setFollowupForm(prev => ({ ...prev, followResult: e.target.value }))}
                  rows={3}
                  placeholder="如：家长表示考虑续费、下周来上课..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowFollowupModal(false); setFollowupTarget(null); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveFollowup}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
