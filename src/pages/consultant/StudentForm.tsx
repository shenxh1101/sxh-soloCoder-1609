import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { studentApi, courseApi } from '../../utils/api';
import type { Course } from '../../../shared/types';

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    parentPhone: '',
    intendedCourseId: '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  useEffect(() => {
    loadCourses();
    if (isEdit) {
      loadStudent();
    }
  }, [id]);

  const loadCourses = async () => {
    const res = await courseApi.getAll();
    setCourses(res.data || []);
  };

  const loadStudent = async () => {
    if (!id) return;
    const res = await studentApi.getById(parseInt(id));
    if (res.data) {
      setFormData({
        name: res.data.name,
        age: res.data.age.toString(),
        parentPhone: res.data.parentPhone,
        intendedCourseId: res.data.intendedCourseId?.toString() || '',
      });
    }
    setInitialLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        age: parseInt(formData.age),
        parentPhone: formData.parentPhone,
        intendedCourseId: formData.intendedCourseId ? parseInt(formData.intendedCourseId) : undefined,
      };

      if (isEdit && id) {
        await studentApi.update(parseInt(id), data);
      } else {
        await studentApi.create(data);
      }

      navigate('/consultant/students');
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? '编辑学员' : '新增学员'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? '修改学员基本信息' : '录入新学员基本信息'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                学员姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入学员姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                年龄 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="2"
                max="18"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入年龄"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                家长手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入家长手机号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                意向课程
              </label>
              <select
                name="intendedCourseId"
                value={formData.intendedCourseId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">请选择意向课程</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}（{course.totalHours}课时，¥{course.price}）
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
