import studentRepository from '../repositories/StudentRepository';
import courseRepository from '../repositories/CourseRepository';
import type { CreateStudentRequest, EnrollRequest } from '../../shared/types';

export class StudentService {
  getAllStudents(status?: string) {
    return studentRepository.findAll(status);
  }

  getStudentById(id: number) {
    const student = studentRepository.findById(id);
    if (!student) return null;
    
    const enrollments = studentRepository.getEnrollments(id);
    const consultations = studentRepository.getConsultationRecords(id);
    
    return {
      ...student,
      enrollments,
      consultations
    };
  }

  createStudent(data: CreateStudentRequest) {
    return studentRepository.create(data);
  }

  updateStudent(id: number, data: any) {
    return studentRepository.update(id, data);
  }

  addConsultationRecord(studentId: number, content: string, consultantId: number, followUpStatus: string) {
    return studentRepository.addConsultationRecord(studentId, content, consultantId, followUpStatus);
  }

  enrollStudent(studentId: number, data: EnrollRequest, operatorId: number | null = null) {
    const student = studentRepository.findById(studentId);
    if (!student) {
      throw new Error('学员不存在');
    }
    
    if (!data.courseId || data.courseId <= 0) {
      throw new Error('请选择有效的课程');
    }
    
    if (!data.totalHours || data.totalHours <= 0) {
      throw new Error('总课时必须大于0');
    }
    
    if (data.paidAmount === undefined || data.paidAmount === null || data.paidAmount < 0) {
      throw new Error('缴费金额不能为负数');
    }
    
    const course = courseRepository.findById(data.courseId);
    if (!course) {
      throw new Error('所选课程不存在');
    }
    
    return studentRepository.enroll(studentId, data.courseId, data.totalHours, data.paidAmount, operatorId);
  }

  getStudentsByParentPhone(parentPhone: string) {
    return studentRepository.findByParentPhone(parentPhone);
  }

  getUnassignedStudents() {
    return studentRepository.getUnassignedStudents();
  }
}

export default new StudentService();
