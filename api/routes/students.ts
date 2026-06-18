import { Router } from 'express';
import studentService from '../services/StudentService';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const { status } = req.query;
    const students = studentService.getAllStudents(status as string);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学员列表失败'
    });
  }
});

router.get('/unassigned', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const students = studentService.getUnassignedStudents();
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取待分班学员失败'
    });
  }
});

router.get('/:id', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = studentService.getStudentById(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学员不存在'
      });
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学员详情失败'
    });
  }
});

router.post('/', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const id = studentService.createStudent(req.body);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建学员失败'
    });
  }
});

router.put('/:id', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = studentService.updateStudent(id, req.body);
    
    res.json({
      success,
      message: success ? '更新成功' : '更新失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新学员失败'
    });
  }
});

router.get('/:id/consultations', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = studentService.getStudentById(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学员不存在'
      });
    }
    
    res.json({
      success: true,
      data: (student as any).consultations || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取咨询记录失败'
    });
  }
});

router.post('/:id/consultations', authenticateToken, requireRole('consultant', 'admin'), (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content, followUpStatus } = req.body;
    const consultantId = req.user?.id || 1;
    
    const recordId = studentService.addConsultationRecord(id, content, consultantId, followUpStatus || 'pending');
    
    res.json({
      success: true,
      data: { id: recordId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加咨询记录失败'
    });
  }
});

router.post('/:id/enroll', authenticateToken, requireRole('consultant', 'admin'), (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const enrollmentId = studentService.enrollStudent(id, req.body, req.user?.id || null);
    
    res.json({
      success: true,
      data: { id: enrollmentId }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '报名失败'
    });
  }
});

router.post('/:id/renew', authenticateToken, requireRole('consultant', 'admin'), (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { courseId, addHours, paidAmount, extendDays } = req.body;
    const result = studentService.renewEnrollment(
      id,
      courseId,
      addHours,
      paidAmount || 0,
      extendDays || 0,
      req.user?.id || null
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || '续费失败'
      });
    }
    
    res.json({
      success: true,
      data: { remainingHours: result.remainingHours }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '续费失败'
    });
  }
});

export default router;
