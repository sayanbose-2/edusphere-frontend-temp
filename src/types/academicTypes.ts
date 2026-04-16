import { Status, ExamType, GradeStatus, ProjectStatus, ThesisStatus, DocumentType, Role } from '@/types/enums';

export interface IPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface IBaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

export interface IUser extends IBaseEntity {
  name: string;
  email: string;
  phone: string;
  status: Status;
  roles: Role[];
}

export interface IStudent extends IBaseEntity {
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

export interface ICreateStudentRequest {
  userId: string;
  dob: string;
  gender: string;
  address: string;
}

export interface IStudentSelfCreateRequest {
  dob: string;
  gender: string;
  address: string;
}

export interface IFaculty extends IBaseEntity {
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

export interface ICreateFacultyRequest {
  userId: string;
  position: string;
  departmentId: string;
  status: Status;
}

export interface IFacultySelfCreateRequest {
  position?: string;
}

export interface IDepartment {
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

export interface ICreateDepartmentRequest {
  departmentName: string;
  departmentCode: string;
  contactInfo: string;
  status: Status;
}

export interface ICourse {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  credits: number;
  duration: number;
  status: Status;
}

export interface ICreateCourseRequest {
  title: string;
  departmentId: string;
  credits: number;
  duration: number;
  status?: Status;
}

export interface ICurriculum {
  id: string;
  courseId: string;
  description: string;
  modulesJSON: string;
  status: Status;
}

export interface ICreateCurriculumRequest {
  courseId: string;
  description: string;
  modulesJSON: string;
  status?: Status;
}

export interface IExam {
  id: string;
  courseId: string;
  type: ExamType;
  date: string;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateExamRequest {
  courseId: string;
  type: ExamType;
  date: string;
  status?: Status;
}

export interface IGrade {
  id?: string;
  examId: string;
  studentId: string;
  score: number;
  grade: string;
  status: GradeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateGradeRequest {
  examId: string;
  studentId: string;
  score: number;
  grade: string;
  status: GradeStatus;
}

export interface IWorkload {
  id?: string;
  facultyId: string;
  courseId: string;
  hours: number;
  semester: string;
  status: Status;
}

export interface ICreateWorkloadRequest {
  facultyId: string;
  courseId: string;
  hours: number;
  semester: string;
  status: Status;
}

export interface IResearchProject {
  id: string;
  title: string;
  facultyId: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  facultyMembersIdList: string[];
  studentsList: string[];
}

export interface ICreateResearchProjectRequest {
  title: string;
  facultyId: string;
  facultyMembers: string[];
  students: string[];
  startDate: string;
  endDate: string;
  status: ProjectStatus;
}

export interface IThesis {
  id?: string;
  studentId: string;
  title: string;
  supervisorId: string;
  submissionDate: string;
  status: ThesisStatus;
}

export interface ICreateThesisRequest {
  studentId?: string;
  title: string;
  supervisorId: string;
  submissionDate: string;
  status?: ThesisStatus;
}

export interface IStudentDocument {
  studentDocumentId: string;
  studentId: string;
  studentName?: string;
  docType: DocumentType;
  downloadUrl: string;
  verificationStatus: boolean;
}
