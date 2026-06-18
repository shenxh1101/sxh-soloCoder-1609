import { Router } from 'express';
import attendanceService from '../services/AttendanceService';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, requireRole('teacher', 'admin'), (req: AuthRequest, res) => {
  try {
    const result = attendanceService.submitAttendance(req.body, req.user?.id || null);
    
    if (result.success && result.warnings.length > 0) {
      res.json({
        success: true,
        message: '签到完成（部分学员有提示）',
        warnings: result.warnings
      });
    } else {
      res.json({
        success: result.success,
        message: result.success ? '签到成功' : '签到失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '签到失败'
    });
  }
});

router.get('/class/:classId', authenticateToken, requireRole('teacher', 'admin', 'consultant'), (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const { date } = req.query;
    
    const records = attendanceService.getClassAttendance(classId, date as string);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取出勤记录失败'
    });
  }
});

router.get('/student/:studentId', authenticateToken, (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const records = attendanceService.getStudentAttendance(studentId);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学员出勤记录失败'
    });
  }
});

router.get('/statistics/:classId', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const statistics = attendanceService.getAttendanceStatistics(classId);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取出勤统计失败'
    });
  }
});

router.get('/check/:classId/:date', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const date = req.params.date;
    const exists = attendanceService.hasAttendanceForDate(classId, date);
    
    res.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查签到状态失败'
    });
  }
});

export default router;
