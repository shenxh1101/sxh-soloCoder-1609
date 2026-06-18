import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, UserCheck, MessageSquare, Clock, BookOpen, Plus, Save } from 'lucide-react';
import { studentApi, courseApi, classApi } from '../../utils/api';
import type { ConsultationRecord, Enrollment, Course, ClassWithStats } from '../../../shared/types';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentId = id ? parseInt(id) : 0;

  const [student, setStudent] = useState<any>(null);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ courseId: '', totalHours: '', paidAmount: '' });
  const [consultationForm, setConsultationForm] = useState({ content: '', followUpStatus: 'pending' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      const [studentRes, coursesRes, classesRes] = await Promise.all([
        studentApi.getById(studentId),
        courseApi.getAll(),
        classApi.getAll(),
      ]);

      if (studentRes.data) {
        setStudent(studentRes.data);
        setConsultations(studentRes.data.consultations || []);
        setEnrollments(studentRes.data.enrollments || []);
      }
      setCourses(coursesRes.data || []);
      setClasses(classesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollForm.courseId || !enrollForm.totalHours || !enrollForm.paidAmount) {
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const res = await studentApi.enroll(studentId, {
        courseId: parseInt(enrollForm.courseId),
        totalHours: parseInt(enrollForm.totalHours),
        paidAmount: parseFloat(enrollForm.paidAmount),
      });

      if (res.success) {
        alert('报名成功！');
        setShowEnrollModal(false);
        loadData();
      } else {
        alert(res.message || '报名失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddConsultation = async () => {
    if (!consultationForm.content) {
      alert('请填写咨询内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await studentApi.addConsultation(studentId, consultationForm);
      
      if (res.success) {
        alert('记录成功！');
        setShowConsultationModal(false);
        setConsultationForm({ content: '', followUpStatus: 'pending' });
        loadData();
      } else {
        alert(res.message || '记录失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignClass = async (classId: number) => {
    const res = await classApi.assignStudent(classId, studentId);
    if (res.success) {
      alert('分班成功！');
      loadData();
    } else {
      alert(res.message || '分班失败');
    }
  };

  const statusColors: Record<string, string> = {
    consulting: 'bg-amber-100 text-amber-700',
    enrolled: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    consulting: '咨询中',
    enrolled: '已报名',
    suspended: '已停课',
  };

  const followUpColors: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    enrolled: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-gray-100 text-gray-700',
  };

  const followUpLabels: Record<string, string> = {
    pending: '待跟进',
    contacted: '已联系',
    enrolled: '已报名',
    lost: '已流失',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-12 text-slate-500">学员不存在</div>;
  }

  const selectedCourse = courses.find(c => c.id === parseInt(enrollForm.courseId));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
          <p className="text-slate-500 mt-1">学员详情管理</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[student.status]}`}>
            {statusLabels[student.status]}
          </span>
          <button
            onClick={() => navigate(`/consultant/students/${student.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>编辑</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">基本信息</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{student.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{student.name}</p>
                <p className="text-sm text-slate-500">{student.age}岁</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">家长电话</span>
                <span className="font-medium text-slate-900">{student.parentPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">意向课程</span>
                <span className="font-medium text-slate-900">{student.intendedCourseName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">所在班级</span>
                <span className="font-medium text-slate-900">{student.className || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {student.status === 'consulting' && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">学员尚未报名</h3>
                  <p className="text-blue-100 mb-4">完成报名后可进行分班操作</p>
                </div>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>立即报名</span>
                </button>
              </div>
            </div>
          )}

          {student.status === 'enrolled' && !student.classId && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">学员待分班</h3>
                  <p className="text-amber-100 mb-4">请为学员分配合适的班级</p>
                </div>
                <button
                  onClick={() => navigate('/consultant/auto-assign')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-colors font-medium"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>去分班</span>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes
                  .filter(c => c.courseId === student.intendedCourseId && c.status === 'active' && c.currentStudents < c.maxStudents)
                  .filter(c => student.age >= c.minAge && student.age <= c.maxAge)
                  .slice(0, 4)
                  .map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => handleAssignClass(cls.id)}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors"
                    >
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-amber-100">{cls.schedule}</p>
                      <p className="text-xs text-amber-100 mt-1">{cls.currentStudents}/{cls.maxStudents}人</p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {enrollments.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">报名信息</h2>
                <span className="text-sm text-slate-500">共 {enrollments.length} 门课程</span>
              </div>
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
                  const course = courses.find(c => c.id === enrollment.courseId);
                  const progress = ((enrollment.totalHours - enrollment.remainingHours) / enrollment.totalHours) * 100;
                  return (
                    <div key={enrollment.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-900">{course?.name || `课程 #${enrollment.courseId}`}</p>
                          <p className="text-sm text-slate-500">
                            报名日期：{enrollment.enrollDate} · 到期日期：{enrollment.expireDate}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          enrollment.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {enrollment.isFrozen ? '已冻结' : '有效'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500">课时进度</span>
                            <span className="font-medium text-slate-900">
                              {enrollment.totalHours - enrollment.remainingHours} / {enrollment.totalHours} 课时
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">剩余课时</p>
                          <p className="text-xl font-bold text-blue-600">{enrollment.remainingHours}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-sm">
                        <span className="text-slate-500">缴费金额</span>
                        <span className="font-medium text-slate-900">¥{enrollment.paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">咨询记录</h2>
              <button
                onClick={() => setShowConsultationModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>添加记录</span>
              </button>
            </div>
            <div className="space-y-4">
              {consultations.length === 0 ? (
                <p className="text-center py-8 text-slate-500">暂无咨询记录</p>
              ) : (
                consultations.map((record) => (
                  <div key={record.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{record.consultantName || '顾问'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${followUpColors[record.followUpStatus]}`}>
                          {followUpLabels[record.followUpStatus]}
                        </span>
                        <span className="text-xs text-slate-400">{record.createdAt}</span>
                      </div>
                    </div>
                    <p className="text-slate-700">{record.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">学员报名</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">选择课程</label>
                <select
                  value={enrollForm.courseId}
                  onChange={(e) => setEnrollForm(prev => ({ ...prev, courseId: e.target.value, totalHours: '' }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">请选择课程</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}（{course.totalHours}课时，¥{course.price}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  总课时 {selectedCourse && <span className="text-slate-400">（默认：{selectedCourse.totalHours}）</span>}
                </label>
                <input
                  type="number"
                  value={enrollForm.totalHours}
                  onChange={(e) => setEnrollForm(prev => ({ ...prev, totalHours: e.target.value }))}
                  placeholder={selectedCourse?.totalHours?.toString()}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  缴费金额 {selectedCourse && <span className="text-slate-400">（默认：¥{selectedCourse.price}）</span>}
                </label>
                <input
                  type="number"
                  value={enrollForm.paidAmount}
                  onChange={(e) => setEnrollForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                  placeholder={selectedCourse?.price?.toString()}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '处理中...' : '确认报名'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConsultationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">添加咨询记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">咨询内容</label>
                <textarea
                  value={consultationForm.content}
                  onChange={(e) => setConsultationForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  placeholder="请输入咨询内容..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">跟进状态</label>
                <select
                  value={consultationForm.followUpStatus}
                  onChange={(e) => setConsultationForm(prev => ({ ...prev, followUpStatus: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="pending">待跟进</option>
                  <option value="contacted">已联系</option>
                  <option value="enrolled">已报名</option>
                  <option value="lost">已流失</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConsultationModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddConsultation}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '保存中...' : '保存记录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
