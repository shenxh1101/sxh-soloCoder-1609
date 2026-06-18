import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Clock, UserCheck, Eye, Download } from 'lucide-react';
import { classApi, reportApi } from '../../utils/api';
import type { ClassWithStats } from '../../../shared/types';

export default function ClassList() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const filtered = classes.filter(c => 
      c.name.includes(searchTerm) || 
      c.courseName.includes(searchTerm) ||
      c.schedule.includes(searchTerm)
    );
    setFilteredClasses(filtered);
  }, [searchTerm, classes]);

  const loadClasses = async () => {
    try {
      const res = await classApi.getAll();
      setClasses(res.data || []);
      setFilteredClasses(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRoster = async (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    reportApi.exportRoster(classId);
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    full: 'bg-amber-100 text-amber-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    active: '招生中',
    full: '已满员',
    completed: '已结束',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">班级管理</h1>
          <p className="text-slate-500 mt-1">查看所有班级信息和学员情况</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索班级名称、课程或上课时间..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            onClick={() => navigate(`/consultant/classes/${cls.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{cls.name}</h3>
                <p className="text-sm text-slate-500">{cls.courseName}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[cls.status]}`}>
                {statusLabels[cls.status]}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="truncate">{cls.schedule}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>年龄 {cls.minAge}-{cls.maxAge} 岁</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>{cls.teacherName || '未分配老师'}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">学员人数</span>
                <span className="font-medium text-slate-900">
                  {cls.currentStudents} / {cls.maxStudents} 人
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (cls.currentStudents / cls.maxStudents) >= 0.9
                      ? 'bg-red-500'
                      : (cls.currentStudents / cls.maxStudents) >= 0.7
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/consultant/classes/${cls.id}`);
                }}
              >
                <Eye className="w-4 h-4" />
                <span>详情</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm"
                onClick={(e) => handleExportRoster(cls.id, e)}
              >
                <Download className="w-4 h-4" />
                <span>导出名单</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <p className="text-slate-500">暂无班级数据</p>
        </div>
      )}
    </div>
  );
}
