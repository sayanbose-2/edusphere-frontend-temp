import { Role } from "@/types/enums";
import {
  BsPeople,
  BsMortarboard,
  BsPersonBadge,
  BsBuilding,
  BsBook,
  BsClipboardCheck,
  BsShieldCheck,
  BsBriefcase,
  BsSearch,
  BsFileEarmarkText,
  BsFolder,
  BsBarChart,
  BsClipboard2Check,
  BsFileEarmarkBarGraph,
  BsListUl,
  BsJournalText,
} from "react-icons/bs";

// ─── helpers ────────────────────────────────────────────────────────────────

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const dateStr = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export { greet, dateStr };

export const getLen = (r: PromiseSettledResult<unknown>): number => {
  if (r.status !== "fulfilled") return 0;
  const d = (r.value as { data: unknown[] | { content?: unknown[] } }).data;
  return Array.isArray(d) ? d.length : (d?.content?.length ?? 0);
};

// ─── types ───────────────────────────────────────────────────────────────────

export type StatCard = {
  label: string;
  value: number;
  icon: React.ReactNode;
  tw: string;
  path: string;
  sub?: string;
};
export type QuickLink = { label: string; path: string; icon: React.ReactNode };

export interface RoleConfig {
  bannerClass: string;
  bannerIcon: React.ReactNode;
  subtitle: string;
  statKeys: string[];
  endpoints: string[];
  buildStats: (counts: number[]) => StatCard[];
  quickLinks: QuickLink[];
  sectionLabel?: string;
}

// ─── role config ─────────────────────────────────────────────────────────────

export const roleConfigs: Partial<Record<Role, RoleConfig>> = {
  [Role.ADMIN]: {
    bannerClass: "welcome-banner--admin",
    bannerIcon: <BsShieldCheck size={56} className="opacity-8" />,
    subtitle: "Administrator · Here's your institution at a glance",
    statKeys: [
      "users",
      "students",
      "faculty",
      "departments",
      "courses",
      "exams",
    ],
    endpoints: [
      "/users",
      "/students",
      "/faculties",
      "/departments",
      "/courses",
      "/exams",
    ],
    buildStats: ([users, students, faculty, departments, courses, exams]) => [
      {
        label: "Users",
        value: users,
        icon: <BsPeople size={18} />,
        tw: "bg-blue-dim text-blue",
        path: "/users",
      },
      {
        label: "Students",
        value: students,
        icon: <BsMortarboard size={18} />,
        tw: "bg-success/10 text-success",
        path: "/students",
      },
      {
        label: "Faculty",
        value: faculty,
        icon: <BsPersonBadge size={18} />,
        tw: "bg-info/10 text-info",
        path: "/faculty",
      },
      {
        label: "Departments",
        value: departments,
        icon: <BsBuilding size={18} />,
        tw: "bg-purple-100/60 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
        path: "/departments",
      },
      {
        label: "Courses",
        value: courses,
        icon: <BsBook size={18} />,
        tw: "bg-warning/10 text-warning",
        path: "/courses",
      },
      {
        label: "Exams",
        value: exams,
        icon: <BsClipboardCheck size={18} />,
        tw: "bg-danger/10 text-danger",
        path: "/exams",
      },
    ],
    quickLinks: [],
  },
  [Role.FACULTY]: {
    bannerClass: "welcome-banner--faculty",
    bannerIcon: <BsPersonBadge size={56} className="opacity-8" />,
    subtitle: "Faculty Portal · Academic Year 2025–26",
    statKeys: ["exams", "research", "workloads"],
    endpoints: ["/exams", "/research-projects", "/workloads"],
    buildStats: ([exams, research, workloads]) => [
      {
        label: "Exams",
        value: exams,
        icon: <BsClipboardCheck size={18} />,
        tw: "bg-blue-dim text-blue",
        path: "/exams",
        sub: "Active exams",
      },
      {
        label: "Research",
        value: research,
        icon: <BsSearch size={18} />,
        tw: "bg-success/10 text-success",
        path: "/research",
        sub: "Research projects",
      },
      {
        label: "Workload",
        value: workloads,
        icon: <BsBriefcase size={18} />,
        tw: "bg-warning/10 text-warning",
        path: "/workloads",
        sub: "Assigned workloads",
      },
    ],
    quickLinks: [
      {
        label: "Grade Submissions",
        path: "/grades",
        icon: <BsClipboardCheck size={14} />,
      },
      {
        label: "Thesis Supervision",
        path: "/thesis",
        icon: <BsFileEarmarkText size={14} />,
      },
      { label: "Documents", path: "/documents", icon: <BsFolder size={14} /> },
    ],
    sectionLabel: "Quick Access",
  },
  [Role.STUDENT]: {
    bannerClass: "welcome-banner--student5",
    bannerIcon: <BsMortarboard size={56} className="opacity-8" />,
    subtitle: "Student Portal · Academic Year 2025–26",
    statKeys: [],
    endpoints: [],
    buildStats: () => [],
    quickLinks: [
      { label: "My Grades", path: "/grades", icon: <BsBarChart size={18} /> },
      {
        label: "My Thesis",
        path: "/thesis",
        icon: <BsFileEarmarkText size={18} />,
      },
      {
        label: "Research Projects",
        path: "/research",
        icon: <BsSearch size={18} />,
      },
      {
        label: "My Documents",
        path: "/documents",
        icon: <BsFolder size={18} />,
      },
    ],
    sectionLabel: "Your Academics",
  },
  [Role.DEPARTMENT_HEAD]: {
    bannerClass: "welcome-banner--dept-head",
    bannerIcon: <BsBuilding size={56} className="opacity-8" />,
    subtitle: "Department Head · Manage your department",
    statKeys: [],
    endpoints: [],
    buildStats: () => [],
    quickLinks: [
      {
        label: "My Department",
        path: "/departments",
        icon: <BsBuilding size={18} />,
      },
      { label: "Faculty", path: "/faculty", icon: <BsPersonBadge size={18} /> },
      { label: "Courses", path: "/courses", icon: <BsBook size={18} /> },
      {
        label: "Curriculum",
        path: "/curriculum",
        icon: <BsJournalText size={18} />,
      },
      {
        label: "Workloads",
        path: "/workloads",
        icon: <BsBriefcase size={18} />,
      },
      {
        label: "Compliance",
        path: "/compliance",
        icon: <BsClipboard2Check size={18} />,
      },
      {
        label: "Reports",
        path: "/reports",
        icon: <BsFileEarmarkBarGraph size={18} />,
      },
    ],
    sectionLabel: "Department Management",
  },
  [Role.COMPLIANCE_OFFICER]: {
    bannerClass: "welcome-banner--compliance",
    bannerIcon: <BsShieldCheck size={56} className="opacity-8" />,
    subtitle: "Compliance Officer · Monitoring overview",
    statKeys: ["pending", "records", "reports"],
    endpoints: ["/audits", "/compliance-records", "/reports"],
    buildStats: ([pending, records, reports]) => [
      {
        label: "Pending Audits",
        value: pending,
        icon: <BsShieldCheck size={18} />,
        tw: "bg-warning/10 text-warning",
        path: "/audits",
      },
      {
        label: "Compliance Records",
        value: records,
        icon: <BsClipboard2Check size={18} />,
        tw: "bg-blue-dim text-blue",
        path: "/compliance",
      },
      {
        label: "Reports",
        value: reports,
        icon: <BsFileEarmarkBarGraph size={18} />,
        tw: "bg-success/10 text-success",
        path: "/reports",
      },
    ],
    quickLinks: [
      { label: "Audits", path: "/audits", icon: <BsShieldCheck size={14} /> },
      { label: "Audit Logs", path: "/audits", icon: <BsListUl size={14} /> },
      {
        label: "Research Compliance",
        path: "/compliance",
        icon: <BsSearch size={14} />,
      },
    ],
    sectionLabel: "Quick Access",
  },
  [Role.REGULATOR]: {
    bannerClass: "welcome-banner--regulator",
    bannerIcon: <BsShieldCheck size={56} className="opacity-8" />,
    subtitle: "Regulator · Oversight & monitoring",
    statKeys: ["flagged", "records", "reports"],
    endpoints: ["/audits", "/compliance-records", "/reports"],
    buildStats: ([flagged, records, reports]) => [
      {
        label: "Flagged Audits",
        value: flagged,
        icon: <BsShieldCheck size={18} />,
        tw: "bg-danger/10 text-danger",
        path: "/audits",
      },
      {
        label: "Compliance Records",
        value: records,
        icon: <BsClipboard2Check size={18} />,
        tw: "bg-blue-dim text-blue",
        path: "/compliance",
      },
      {
        label: "Reports",
        value: reports,
        icon: <BsFileEarmarkBarGraph size={18} />,
        tw: "bg-success/10 text-success",
        path: "/reports",
      },
    ],
    quickLinks: [
      { label: "Audits", path: "/audits", icon: <BsShieldCheck size={14} /> },
      { label: "Audit Logs", path: "/audits", icon: <BsListUl size={14} /> },
      {
        label: "Research Compliance",
        path: "/compliance",
        icon: <BsSearch size={14} />,
      },
    ],
    sectionLabel: "Quick Access",
  },
};

export const ROLE_ORDER = [
  Role.ADMIN,
  Role.DEPARTMENT_HEAD,
  Role.FACULTY,
  Role.COMPLIANCE_OFFICER,
  Role.REGULATOR,
  Role.STUDENT,
];
