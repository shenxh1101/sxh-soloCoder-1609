import { Router } from 'express';
import parentService from '../services/ParentService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/remaining-hours', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user?.phone) {
      return res.status(400).json({
        success: false,
        message: '未绑定手机号'
      });
    }
    
    const hours = parentService.getRemainingHours(req.user.phone);
    
    res.json({
      success: true,
      data: hours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取剩余课时失败'
    });
  }
});

router.get('/attendance-records', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user?.phone) {
      return res.status(400).json({
        success: false,
        message: '未绑定手机号'
      });
    }
    
    const records = parentService.getAttendanceRecords(req.user.phone);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取上课记录失败'
    });
  }
});

router.get('/students', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user?.phone) {
      return res.status(400).json({
        success: false,
        message: '未绑定手机号'
      });
    }
    
    const students = parentService.getStudentInfo(req.user.phone);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学员信息失败'
    });
  }
});

export default router;
