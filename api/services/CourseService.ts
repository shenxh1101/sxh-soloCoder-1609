import courseRepository from '../repositories/CourseRepository';

export class CourseService {
  getAllCourses() {
    return courseRepository.findAll();
  }

  getCourseById(id: number) {
    return courseRepository.findById(id);
  }

  createCourse(data: any) {
    return courseRepository.create(data);
  }

  updateCourse(id: number, data: any) {
    return courseRepository.update(id, data);
  }

  deleteCourse(id: number) {
    return courseRepository.delete(id);
  }
}

export default new CourseService();
