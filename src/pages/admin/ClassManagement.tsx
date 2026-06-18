import { useEffect, useState } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, Users, Clock, Download, Search } from 'lucide-react';
import { classApi, courseApi, userApi, reportApi } from '../../utils/api';
import type { ClassWithStats, Course, User } from '../../../shared/types';

export default function AdminClassManagement() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    maxStudents: '15',
    minAge: '4',
    maxAge: '6',
    schedule: '',
    teacherId: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, coursesRes, teachersRes] = await Promise.all([
        classApi.getAll(),
        courseApi.getAll(),
        userApi.getTeachers(),
      ]);
      setClasses(classesRes.data || []);
      setCourses(coursesRes.data || []);
      setTeachers(teachersRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.schedule.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const data = {
        ...formData,
        courseId: parseInt(formData.courseId),
        maxStudents: parseInt(formData.maxStudents),
        minAge: parseInt(formData.minAge),
        maxAge: parseInt(formData.maxAge),
        teacherId: formData.teacherId ? parseInt(formData.teacherId) : undefined,
      };
      
      if (editingClass) {
        await classApi.update(editingClass.id, data);
      } else {
        await classApi.create(data);
      }
      
      await loadData();
      setShowModal(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls: ClassWithStats) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      courseId: cls.courseId.toString(),
      maxStudents: cls.maxStudents.toString(),
      minAge: cls.minAge.toString(),
      maxAge: cls.maxAge.toString(),
      schedule: cls.schedule,
      teacherId: cls.teacherId?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个班级吗？')) {
      await classApi.delete(id);
      await loadData();
    }
  };

  const handleExportRoster = (classId: number) => {
    reportApi.exportRoster(classId);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      courseId: '',
      maxStudents: '15',
      minAge: '4',
      maxAge: '6',
      schedule: '',
      teacherId: '',
    });
    setEditingClass(null);
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
          <p className="text-slate-500 mt-1">管理所有班级信息和设置</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增班级
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索班级名称、课程、上课时间..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{cls.courseName}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  cls.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  cls.status === 'full' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {cls.status === 'active' ? '招生中' : cls.status === 'full' ? '已满员' : '已结束'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>年龄：{cls.minAge}-{cls.maxAge}岁</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>教师：{cls.teacherName || '未分配'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{cls.schedule}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>班级人数</span>
                  <span>{cls.currentStudents}/{cls.maxStudents}人</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (cls.currentStudents / cls.maxStudents) >= 0.9 ? 'bg-red-500' :
                      (cls.currentStudents / cls.maxStudents) >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(cls)}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  编辑
                </button>
                <button
                  onClick={() => handleExportRoster(cls.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  导出
                </button>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>暂无班级信息</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {editingClass ? '编辑班级' : '新增班级'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">班级名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：少儿美术A班"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">所属课程</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择课程</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.totalHours}课时)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">最大人数</label>
                  <input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">最小年龄</label>
                  <input
                    type="number"
                    value={formData.minAge}
                    onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">最大年龄</label>
                  <input
                    type="number"
                    value={formData.maxAge}
                    onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">上课时间</label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：每周六上午9:00-10:30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">授课教师</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择教师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50"
                >
                  {submitting ? '提交中...' : (editingClass ? '保存' : '创建')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
