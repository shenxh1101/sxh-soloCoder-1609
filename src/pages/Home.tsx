import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, CalendarCheck, BookOpen, BarChart3, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: '学员管理',
      description: '完整的学员信息管理，支持咨询记录跟踪和报名流程',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: GraduationCap,
      title: '智能分班',
      description: '基于年龄和意向课程自动推荐匹配班级，支持手动调整',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: CalendarCheck,
      title: '考勤管理',
      description: '教师端便捷签到，自动记录出勤并扣减课时',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: BookOpen,
      title: '课时管理',
      description: '自动计算剩余课时，支持有效期设置和逾期冻结',
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: BarChart3,
      title: '统计报表',
      description: '生成班级名单和出勤统计表，支持数据导出',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Shield,
      title: '多角色权限',
      description: '支持顾问、教师、家长、管理员四种角色权限管理',
      color: 'from-cyan-500 to-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">培训管理系统</h1>
              <p className="text-xs text-slate-500">学员报名与分班管理平台</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            登录系统
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              专业的培训机构管理平台
            </div>
            <h2 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
              让学员管理
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                更简单高效
              </span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              一站式解决学员报名、智能分班、考勤签到、课时管理等全流程业务，
              让培训机构运营更高效、更规范。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2 text-lg"
              >
                立即登录
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 text-lg">
                了解更多
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">核心功能</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              覆盖培训机构日常运营的各个环节，提供全方位的数字化管理解决方案
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold mb-2">4</p>
                <p className="text-slate-400">用户角色</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">17+</p>
                <p className="text-slate-400">功能页面</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">100%</p>
                <p className="text-slate-400">流程覆盖</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">24/7</p>
                <p className="text-slate-400">技术支持</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">选择您的身份</h3>
            <p className="text-slate-600">不同角色拥有不同的功能权限，选择适合您的入口</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { role: 'consultant', label: '课程顾问', color: 'blue' },
              { role: 'teacher', label: '教师', color: 'purple' },
              { role: 'parent', label: '家长', color: 'emerald' },
              { role: 'admin', label: '管理员', color: 'amber' },
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => navigate(`/login?role=${item.role}`)}
                className={`p-6 rounded-2xl border-2 border-${item.color}-200 hover:bg-${item.color}-50 hover:border-${item.color}-400 transition-all group`}
              >
                <p className={`font-semibold text-${item.color}-600 group-hover:text-${item.color}-700`}>
                  {item.label}
                </p>
                <p className="text-sm text-slate-500 mt-1">点击登录</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900">培训管理系统</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2024 培训管理系统. 专注培训机构数字化管理解决方案
          </p>
        </div>
      </footer>
    </div>
  );
}
