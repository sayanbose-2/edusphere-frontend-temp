import { Role } from "@/types/enums";

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  section?: string;
}

const adminMenu: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" },

  { label: "Users", path: "/users", icon: "BsPeople", section: "People" },
  {
    label: "Students",
    path: "/students",
    icon: "BsMortarboard",
    section: "People",
  },
  {
    label: "Faculty",
    path: "/faculty",
    icon: "BsPersonBadge",
    section: "People",
  },

  {
    label: "Departments",
    path: "/departments",
    icon: "BsBuilding",
    section: "Academics",
  },
  { label: "Courses", path: "/courses", icon: "BsBook", section: "Academics" },
  {
    label: "Curriculum",
    path: "/curriculum",
    icon: "BsJournalText",
    section: "Academics",
  },
  {
    label: "Exams",
    path: "/exams",
    icon: "BsClipboardCheck",
    section: "Academics",
  },
  {
    label: "Grades",
    path: "/grades",
    icon: "BsBarChart",
    section: "Academics",
  },
  {
    label: "Workloads",
    path: "/workloads",
    icon: "BsBriefcase",
    section: "Academics",
  },

  {
    label: "Research",
    path: "/research",
    icon: "BsSearch",
    section: "Research",
  },
  {
    label: "Thesis",
    path: "/thesis",
    icon: "BsFileEarmarkText",
    section: "Research",
  },
  {
    label: "Documents",
    path: "/documents",
    icon: "BsFolder",
    section: "Research",
  },

  {
    label: "Audits",
    path: "/audits",
    icon: "BsShieldCheck",
    section: "Compliance",
  },
  {
    label: "Compliance",
    path: "/compliance",
    icon: "BsClipboard2Check",
    section: "Compliance",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: "BsFileEarmarkBarGraph",
    section: "Compliance",
  },

  {
    label: "Notifications",
    path: "/notifications",
    icon: "BsBell",
    section: "System",
  },
];

const facultyMenu: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" },
  {
    label: "Exams",
    path: "/exams",
    icon: "BsClipboardCheck",
    section: "Teaching",
  },
  { label: "Grades", path: "/grades", icon: "BsBarChart", section: "Teaching" },
  {
    label: "Workloads",
    path: "/workloads",
    icon: "BsBriefcase",
    section: "Teaching",
  },
  {
    label: "Research",
    path: "/research",
    icon: "BsSearch",
    section: "Research",
  },
  {
    label: "Thesis",
    path: "/thesis",
    icon: "BsFileEarmarkText",
    section: "Research",
  },
  {
    label: "Documents",
    path: "/documents",
    icon: "BsFolder",
    section: "Research",
  },
];

const studentMenu: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" },
  {
    label: "My Grades",
    path: "/grades",
    icon: "BsBarChart",
    section: "Academics",
  },
  {
    label: "My Thesis",
    path: "/thesis",
    icon: "BsFileEarmarkText",
    section: "Academics",
  },
  {
    label: "Research Projects",
    path: "/research",
    icon: "BsSearch",
    section: "Academics",
  },
  {
    label: "My Documents",
    path: "/documents",
    icon: "BsFolder",
    section: "Documents",
  },
];

const deptHeadMenu: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" },
  {
    label: "Department",
    path: "/departments",
    icon: "BsBuilding",
    section: "Department",
  },
  {
    label: "Faculty",
    path: "/faculty",
    icon: "BsPersonBadge",
    section: "Department",
  },
  { label: "Courses", path: "/courses", icon: "BsBook", section: "Department" },
  {
    label: "Curriculum",
    path: "/curriculum",
    icon: "BsJournalText",
    section: "Department",
  },
  {
    label: "Exams",
    path: "/exams",
    icon: "BsClipboardCheck",
    section: "Academics",
  },
  {
    label: "Grades",
    path: "/grades",
    icon: "BsBarChart",
    section: "Academics",
  },
  {
    label: "Workloads",
    path: "/workloads",
    icon: "BsBriefcase",
    section: "Department",
  },
  {
    label: "Compliance",
    path: "/compliance",
    icon: "BsClipboard2Check",
    section: "Oversight",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: "BsFileEarmarkBarGraph",
    section: "Oversight",
  },
];

const complianceMenu: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" },
  {
    label: "Compliance Records",
    path: "/compliance",
    icon: "BsClipboard2Check",
    section: "Monitoring",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: "BsFileEarmarkBarGraph",
    section: "Monitoring",
  },
];

const regulatorMenu: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" },
  {
    label: "Audits",
    path: "/audits",
    icon: "BsShieldCheck",
    section: "Oversight",
  },
  {
    label: "Grades",
    path: "/grades",
    icon: "BsBarChart",
    section: "Oversight",
  },
];

const getMenuForRole = (roles: Role[]): MenuItem[] => {
  if (roles.includes(Role.ADMIN)) return adminMenu;
  if (roles.includes(Role.DEPARTMENT_HEAD)) return deptHeadMenu;
  if (roles.includes(Role.FACULTY)) return facultyMenu;
  if (roles.includes(Role.COMPLIANCE_OFFICER)) return complianceMenu;
  if (roles.includes(Role.REGULATOR)) return regulatorMenu;
  if (roles.includes(Role.STUDENT)) return studentMenu;
  return [{ label: "Dashboard", path: "/dashboard", icon: "BsSpeedometer2" }];
};

export { getMenuForRole };
