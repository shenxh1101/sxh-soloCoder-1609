import { Router } from 'express';
import classService from '../services/ClassService';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req: AuthRequest, res) => {
  try {
    let classes;
    if (req.user?.role === 'teacher') {
      classes = classService.getClassesByTeacher(req.user.id);
    } else {
      classes = classService.getAllClasses();
    }
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取班级列表失败'
    });
  }
});

router.get('/auto-assign', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const results = classService.autoAssign();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '自动分班失败'
    });
  }
});

router.post('/auto-assign', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const { assignments } = req.body;
    const result = classService.autoAssignConfirm(assignments);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '确认分班失败'
    });
  }
});

router.get('/:id', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cls = classService.getClassById(id);
    
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    res.json({
      success: true,
      data: cls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取班级详情失败'
    });
  }
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = classService.createClass(req.body);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建班级失败'
    });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = classService.updateClass(id, req.body);
    
    res.json({
      success,
      message: success ? '更新成功' : '更新失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新班级失败'
    });
  }
});

router.get('/:id/students', authenticateToken, requireRole('consultant', 'admin', 'teacher'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const students = classService.getClassStudents(id);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取班级学员失败'
    });
  }
});

router.post('/:id/assign-student', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const { studentId } = req.body;
    
    const success = classService.assignStudentToClass(classId, studentId);
    
    res.json({
      success,
      message: success ? '分配成功' : '分配失败，班级可能已满'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '分配学员失败'
    });
  }
});

router.post('/:id/remove-student', authenticateToken, requireRole('consultant', 'admin'), (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const { studentId } = req.body;
    
    const success = classService.removeStudentFromClass(classId, studentId);
    
    res.json({
      success,
      message: success ? '移除成功' : '移除失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '移除学员失败'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = classService.deleteClass(id);
    
    res.json({
      success,
      message: success ? '删除成功' : '删除失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除班级失败'
    });
  }
});

export default router;
