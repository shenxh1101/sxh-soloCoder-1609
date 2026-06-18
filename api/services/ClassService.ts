import classRepository from '../repositories/ClassRepository';
import studentRepository from '../repositories/StudentRepository';
import type { CreateClassRequest, AutoAssignResult } from '../../shared/types';

export class ClassService {
  getAllClasses() {
    return classRepository.findAll();
  }

  getClassById(id: number) {
    const cls = classRepository.findById(id);
    if (!cls) return null;
    
    const students = classRepository.getStudents(id);
    
    return {
      ...cls,
      students
    };
  }

  getClassesByTeacher(teacherId: number) {
    return classRepository.findByTeacherId(teacherId);
  }

  createClass(data: CreateClassRequest) {
    return classRepository.create(data);
  }

  updateClass(id: number, data: any) {
    return classRepository.update(id, data);
  }

  getClassStudents(classId: number) {
    return classRepository.getStudents(classId);
  }

  assignStudentToClass(classId: number, studentId: number) {
    const student = studentRepository.findById(studentId);
    if (!student) {
      throw new Error('学员不存在');
    }
    
    if (student.status !== 'enrolled') {
      throw new Error('学员未报名，无法分班');
    }
    
    return classRepository.assignStudent(classId, studentId);
  }

  removeStudentFromClass(classId: number, studentId: number) {
    return classRepository.removeStudent(classId, studentId);
  }

  autoAssign(): AutoAssignResult[] {
    const unassignedStudents = studentRepository.getUnassignedStudents();
    const results: AutoAssignResult[] = [];
    
    for (const student of unassignedStudents) {
      if (!student.intendedCourseId) {
        results.push({
          studentId: student.id,
          studentName: student.name,
          recommendedClassId: 0,
          recommendedClassName: '',
          matchScore: 0,
          reason: '未设置意向课程'
        });
        continue;
      }
      
      const matchingClasses = classRepository.findMatchingClasses(
        student.age,
        student.intendedCourseId
      );
      
      if (matchingClasses.length === 0) {
        results.push({
          studentId: student.id,
          studentName: student.name,
          recommendedClassId: 0,
          recommendedClassName: '',
          matchScore: 0,
          reason: '没有匹配的班级'
        });
        continue;
      }
      
      const bestClass = matchingClasses[0];
      const ageMatchScore = 100 - Math.abs(student.age - (bestClass.minAge + bestClass.maxAge) / 2) * 10;
      const availabilityScore = ((bestClass.maxStudents - bestClass.currentStudents) / bestClass.maxStudents) * 100;
      const matchScore = Math.round((ageMatchScore * 0.6 + availabilityScore * 0.4));
      
      results.push({
        studentId: student.id,
        studentName: student.name,
        recommendedClassId: bestClass.id,
        recommendedClassName: bestClass.name,
        matchScore,
        reason: `年龄${student.age}岁匹配班级年龄段${bestClass.minAge}-${bestClass.maxAge}岁，当前人数${bestClass.currentStudents}/${bestClass.maxStudents}`
      });
    }
    
    return results;
  }

  autoAssignConfirm(assignments: { studentId: number; classId: number }[]) {
    let successCount = 0;
    let failCount = 0;
    
    for (const assignment of assignments) {
      const success = classRepository.assignStudent(assignment.classId, assignment.studentId);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    return { successCount, failCount };
  }

  deleteClass(id: number) {
    return classRepository.delete(id);
  }
}

export default new ClassService();
