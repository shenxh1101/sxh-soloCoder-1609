import { useState } from 'react';
import { Settings, Database, Clock, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('system');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    autoFreeze: true,
    notifyExpiryDays: 30,
    minAge: 3,
    maxAge: 18,
    maxStudentsPerClass: 20,
  });

  const handleSave = () => {
    setMessage({ type: 'success', text: '设置保存成功！' });
    setTimeout(() => setMessage(null), 3000);
  };

  const tabs = [
    { id: 'system', label: '系统设置', icon: Settings },
    { id: 'attendance', label: '考勤设置', icon: Clock },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'database', label: '数据管理', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
        <p className="text-slate-500 mt-1">配置系统参数和管理功能</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">基本设置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">自动冻结逾期课时</p>
                    <p className="text-sm text-slate-500">课时逾期后自动冻结，无法继续使用</p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, autoFreeze: !formData.autoFreeze })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.autoFreeze ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      formData.autoFreeze ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">到期提醒天数</p>
                    <p className="text-sm text-slate-500">课时到期前多少天开始提醒</p>
                  </div>
                  <input
                    type="number"
                    value={formData.notifyExpiryDays}
                    onChange={(e) => setFormData({ ...formData, notifyExpiryDays: parseInt(e.target.value) })}
                    className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="365"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="font-medium text-slate-900 mb-2">最小招生年龄</p>
                    <input
                      type="number"
                      value={formData.minAge}
                      onChange={(e) => setFormData({ ...formData, minAge: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="font-medium text-slate-900 mb-2">最大招生年龄</p>
                    <input
                      type="number"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({ ...formData, maxAge: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="font-medium text-slate-900 mb-2">每班最大人数</p>
                  <input
                    type="number"
                    value={formData.maxStudentsPerClass}
                    onChange={(e) => setFormData({ ...formData, maxStudentsPerClass: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                保存设置
              </button>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">考勤设置</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">考勤扣减规则</p>
                      <p className="text-sm text-slate-500 mt-1">
                        学员出勤时自动扣减1课时，缺勤和请假不扣减课时。<br/>
                        如需要调整扣减规则，请联系技术支持。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">状态说明</p>
                      <div className="text-sm text-slate-500 mt-1 space-y-1">
                        <p><span className="text-emerald-600 font-medium">出勤</span> - 正常上课，扣减1课时</p>
                        <p><span className="text-red-600 font-medium">缺勤</span> - 未请假缺席，不扣减课时</p>
                        <p><span className="text-amber-600 font-medium">请假</span> - 提前请假，不扣减课时</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">安全设置</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">密码策略</p>
                      <p className="text-sm text-slate-500 mt-1">
                        密码长度至少8位，包含字母和数字。<br/>
                        首次登录后强制修改密码。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">会话超时</p>
                      <p className="text-sm text-slate-500 mt-1">
                        30分钟无操作自动退出登录。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">数据管理</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">数据库路径</p>
                        <p className="text-sm text-slate-500 mt-1 font-mono">data/app.db</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">数据备份提醒</p>
                      <p className="text-sm text-amber-700 mt-1">
                        请定期备份数据库文件，防止数据丢失。<br/>
                        系统会在每日凌晨自动创建备份。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">危险操作</p>
                      <p className="text-sm text-red-700 mt-1">
                        重置数据库将删除所有数据，此操作不可撤销。<br/>
                        请在执行此操作前确保已备份重要数据。
                      </p>
                      <button className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                        重置数据库
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
