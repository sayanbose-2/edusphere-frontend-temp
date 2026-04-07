import { Role } from '@/types/enums';

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  section?: string;
}

const adminMenu: MenuItem[] = [
  { label: 'Dashboard',     path: '/dashboard',          icon: 'BsSpeedometer2' },

  { label: 'Users',         path: '/admin/users',        icon: 'BsPeople',              section: 'People' },
  { label: 'Students',      path: '/admin/students',     icon: 'BsMortarboard',         section: 'People' },
  { label: 'Faculty',       path: '/admin/faculties',    icon: 'BsPersonBadge',         section: 'People' },

  { label: 'Departments',   path: '/admin/departments',  icon: 'BsBuilding',            section: 'Academics' },
  { label: 'Courses',       path: '/admin/courses',      icon: 'BsBook',                section: 'Academics' },
  { label: 'Curriculum',    path: '/admin/curriculum',   icon: 'BsJournalText',         section: 'Academics' },
  { label: 'Exams',         path: '/admin/exams',        icon: 'BsClipboardCheck',      section: 'Academics' },
  { label: 'Grades',        path: '/admin/grades',       icon: 'BsBarChart',            section: 'Academics' },
  { label: 'Workloads',     path: '/admin/workloads',    icon: 'BsBriefcase',           section: 'Academics' },

  { label: 'Research',      path: '/admin/research',     icon: 'BsSearch',              section: 'Research' },
  { label: 'Thesis',        path: '/admin/thesis',       icon: 'BsFileEarmarkText',     section: 'Research' },
  { label: 'Documents',     path: '/admin/documents',    icon: 'BsFolder',              section: 'Research' },

  { label: 'Audits',        path: '/admin/audits',       icon: 'BsShieldCheck',         section: 'Compliance' },
  { label: 'Audit Logs',    path: '/admin/audit-logs',   icon: 'BsListUl',              section: 'Compliance' },
  { label: 'Compliance',    path: '/admin/compliance',   icon: 'BsClipboard2Check',     section: 'Compliance' },
  { label: 'Reports',       path: '/admin/reports',      icon: 'BsFileEarmarkBarGraph', section: 'Compliance' },

  { label: 'Notifications', path: '/admin/notifications',icon: 'BsBell',                section: 'System' },
];

const facultyMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard',          icon: 'BsSpeedometer2' },
  { label: 'Exams',     path: '/faculty/exams',      icon: 'BsClipboardCheck',  section: 'Teaching' },
  { label: 'Grades',    path: '/faculty/grades',     icon: 'BsBarChart',        section: 'Teaching' },
  { label: 'Workload',  path: '/faculty/workload',   icon: 'BsBriefcase',       section: 'Teaching' },
  { label: 'Research',  path: '/faculty/research',   icon: 'BsSearch',          section: 'Research' },
  { label: 'Thesis',    path: '/faculty/thesis',     icon: 'BsFileEarmarkText', section: 'Research' },
  { label: 'Documents', path: '/faculty/documents',  icon: 'BsFolder',          section: 'Research' },
];

const studentMenu: MenuItem[] = [
  { label: 'Dashboard',          path: '/dashboard',        icon: 'BsSpeedometer2' },
  { label: 'My Grades',          path: '/student/grades',   icon: 'BsBarChart',        section: 'Academics' },
  { label: 'My Thesis',          path: '/student/thesis',   icon: 'BsFileEarmarkText', section: 'Academics' },
  { label: 'Research Projects',  path: '/student/research', icon: 'BsSearch',          section: 'Academics' },
  { label: 'My Documents',       path: '/student/documents',icon: 'BsFolder',          section: 'Documents' },
];

const deptHeadMenu: MenuItem[] = [
  { label: 'Dashboard',      path: '/dashboard',         icon: 'BsSpeedometer2' },
  { label: 'My Department',  path: '/dept/department',   icon: 'BsBuilding',            section: 'Department' },
  { label: 'Faculty',        path: '/dept/faculty',      icon: 'BsPersonBadge',         section: 'Department' },
  { label: 'Courses',        path: '/dept/courses',      icon: 'BsBook',                section: 'Department' },
  { label: 'Curriculum',     path: '/dept/curriculum',   icon: 'BsJournalText',         section: 'Department' },
  { label: 'Workloads',      path: '/dept/workloads',    icon: 'BsBriefcase',           section: 'Department' },
  { label: 'Compliance',     path: '/dept/compliance',   icon: 'BsClipboard2Check',     section: 'Oversight' },
  { label: 'Reports',        path: '/dept/reports',      icon: 'BsFileEarmarkBarGraph', section: 'Oversight' },
];

const complianceMenu: MenuItem[] = [
  { label: 'Dashboard',           path: '/dashboard',              icon: 'BsSpeedometer2' },
  { label: 'Audits',              path: '/compliance/audits',      icon: 'BsShieldCheck',         section: 'Monitoring' },
  { label: 'Audit Logs',          path: '/compliance/audit-logs',  icon: 'BsListUl',              section: 'Monitoring' },
  { label: 'Compliance Records',  path: '/compliance/records',     icon: 'BsClipboard2Check',     section: 'Monitoring' },
  { label: 'Grades',              path: '/compliance/grades',      icon: 'BsBarChart',            section: 'Records' },
  { label: 'Research',            path: '/compliance/research',    icon: 'BsSearch',              section: 'Records' },
  { label: 'Reports',             path: '/compliance/reports',     icon: 'BsFileEarmarkBarGraph', section: 'Records' },
];

export function getMenuForRole(roles: Role[]): MenuItem[] {
  if (roles.includes(Role.ADMIN))             return adminMenu;
  if (roles.includes(Role.DEPARTMENT_HEAD))   return deptHeadMenu;
  if (roles.includes(Role.FACULTY))           return facultyMenu;
  if (roles.includes(Role.COMPLIANCE_OFFICER))return complianceMenu;
  if (roles.includes(Role.STUDENT))           return studentMenu;
  return [{ label: 'Dashboard', path: '/dashboard', icon: 'BsSpeedometer2' }];
}
