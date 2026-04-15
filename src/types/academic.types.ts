import { Status, ExamType, GradeStatus, ProjectStatus, ThesisStatus, DocumentType, Role } from '@/types/enums';

// ========================
// Pagination
// ========================

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ========================
// Base Entity
// ========================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

// ========================
// User
// ========================

export interface User extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  status: Status;
  roles: Role[];
}

// ========================
// Student
// ========================

export interface Student extends BaseEntity {
  userId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  enrollmentDate: string;
  status: Status;
}

/** Matches backend StudentRequestDTO — sent to POST /students and PUT /students/{id} */
export interface CreateStudentRequest {
  userId: string;
  dob: string;
  gender: string;
  address: string;
}

/** Matches backend StudentSelfRequestDTO — sent to POST /students/me (student self-creates on first login) */
export interface StudentSelfCreateRequest {
  dob: string;
  gender: string;
  address: string;
}

// ========================
// Faculty
// ========================

export interface Faculty extends BaseEntity {
  userId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName?: string;
  position: string;
  joinDate: string;
  status: Status;
}

/** Matches backend FacultyRequestDTO — sent to POST /faculties and PUT /faculties/{id} */
export interface CreateFacultyRequest {
  userId: string;
  position: string;
  departmentId: string;
  status: Status;
}

/** Matches backend FacultySelfRequestDTO — sent to POST /faculties/me (faculty self-creates stub on first login) */
export interface FacultySelfCreateRequest {
  position?: string;
}

// ========================
// Department
// ========================

export interface Department {
  id: string;
  departmentName: string;
  departmentCode: string;
  contactInfo: string;
  status: Status;
  headId?: string;
  headName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  departmentName: string;
  departmentCode: string;
  contactInfo: string;
  status: Status;
}

// ========================
// Course
// ========================

export interface Course {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  credits: number;
  duration: number;
  status: Status;
}

export interface CreateCourseRequest {
  title: string;
  departmentId: string;
  credits: number;
  duration: number;
  status?: Status;
}

// ========================
// Curriculum
// ========================

export interface Curriculum {
  id: string;
  courseId: string;
  description: string;
  modulesJSON: string;
  status: Status;
}

export interface CreateCurriculumRequest {
  courseId: string;
  description: string;
  modulesJSON: string;
  status?: Status;
}

// ========================
// Exam
// ========================

export interface Exam {
  id: string;
  courseId: string;
  type: ExamType;
  date: string;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExamRequest {
  courseId: string;
  type: ExamType;
  date: string;
  status?: Status;
}

// ========================
// Grade
// ========================

export interface Grade {
  id?: string;
  examId: string;
  studentId: string;
  score: number;
  grade: string;
  status: GradeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGradeRequest {
  examId: string;
  studentId: string;
  score: number;
  grade: string;
  status: GradeStatus;
}

// ========================
// Workload
// ========================

export interface Workload {
  id?: string;
  facultyId: string;
  courseId: string;
  hours: number;
  semester: string;
  status: Status;
}

export interface CreateWorkloadRequest {
  facultyId: string;
  courseId: string;
  hours: number;
  semester: string;
  status: Status;
}

// ========================
// Research Project
// ========================

export interface ResearchProject {
  id: string;
  title: string;
  facultyId: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  facultyMembersIdList: string[];
  studentsList: string[];
}

export interface CreateResearchProjectRequest {
  title: string;
  facultyId: string;
  facultyMembers: string[];
  students: string[];
  startDate: string;
  endDate: string;
  status: ProjectStatus;
}

// ========================
// Thesis
// ========================

export interface Thesis {
  id?: string;
  studentId: string;
  title: string;
  supervisorId: string;
  submissionDate: string;
  status: ThesisStatus;
}

export interface CreateThesisRequest {
  studentId?: string;
  title: string;
  supervisorId: string;
  submissionDate: string;
  status?: ThesisStatus;
}

// ========================
// Student Document
// ========================

export interface StudentDocument {
  studentDocumentId: string;
  studentId: string;
  studentName?: string;
  docType: DocumentType;
  downloadUrl: string;
  verificationStatus: boolean;
}
