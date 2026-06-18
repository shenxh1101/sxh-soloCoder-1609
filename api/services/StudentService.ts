import studentRepository from '../repositories/StudentRepository';
import classRepository from '../repositories/ClassRepository';
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

  enrollStudent(studentId: number, data: EnrollRequest) {
    const student = studentRepository.findById(studentId);
    if (!student) {
      throw new Error('学员不存在');
    }
    
    return studentRepository.enroll(studentId, data.courseId, data.totalHours, data.paidAmount);
  }

  getStudentsByParentPhone(parentPhone: string) {
    return studentRepository.findByParentPhone(parentPhone);
  }

  getUnassignedStudents() {
    return studentRepository.getUnassignedStudents();
  }
}

export default new StudentService();
