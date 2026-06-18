import { Router } from 'express';
import courseService from '../services/CourseService';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const courses = courseService.getAllCourses();
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课程列表失败'
    });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const course = courseService.getCourseById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课程详情失败'
    });
  }
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = courseService.createCourse(req.body);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建课程失败'
    });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = courseService.updateCourse(id, req.body);
    
    res.json({
      success,
      message: success ? '更新成功' : '更新失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新课程失败'
    });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = courseService.deleteCourse(id);
    
    res.json({
      success,
      message: success ? '删除成功' : '删除失败'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除课程失败'
    });
  }
});

export default router;
