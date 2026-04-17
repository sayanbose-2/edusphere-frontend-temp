import { useNavigate } from "react-router-dom";
import * as BsIcons from "react-icons/bs";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuForRole } from "@/utils/sidebarMenu";

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const dateStr = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const bannerClass: Record<string, string> = {
  ADMIN: "welcome-banner--admin",
  DEPARTMENT_HEAD: "welcome-banner--dept-head",
  FACULTY: "welcome-banner--faculty",
  COMPLIANCE_OFFICER: "welcome-banner--compliance",
  REGULATOR: "welcome-banner--regulator",
  STUDENT: "welcome-banner--student",
};

const sectionColors: Record<string, string> = {
  People: "bg-blue-dim text-blue",
  Academics: "bg-success/10 text-success",
  Teaching: "bg-success/10 text-success",
  Research: "bg-info/10 text-info",
  Compliance: "bg-warning/10 text-warning",
  Monitoring: "bg-warning/10 text-warning",
  Oversight: "bg-danger/10 text-danger",
  Department:
    "bg-purple-100/60 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  System: "bg-secondary/10 text-secondary",
  Documents:
    "bg-orange-100/60 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const primaryRole = user.roles[0] ?? "STUDENT";
  const menu = getMenuForRole(user.roles).filter(
    (item) => item.path !== "/dashboard",
  );

  // group by section
  const sections: Record<string, typeof menu> = {};
  menu.forEach((item) => {
    const key = item.section ?? "General";
    if (!sections[key]) sections[key] = [];
    sections[key].push(item);
  });

  return (
    <>
      <div
        className={`welcome-banner ${bannerClass[primaryRole] ?? "welcome-banner--admin"} mb-6`}
      >
        <div className="relative z-10">
          <p className="m-0 text-xs opacity-55 tracking-wide uppercase">
            {dateStr()}
          </p>
          <h2 className="m-0 text-3xl font-black tracking-tight -ml-0.5">
            {greet()}, {user.name?.split(" ")[0]}
          </h2>
          <p className="m-0 text-base opacity-60">
            {user.roles.map((r) => r.replace(/_/g, " ")).join(" · ")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(sections).map(([section, items]) => {
          const color = sectionColors[section] ?? "bg-blue-dim text-blue";
          return (
            <div key={section}>
              <p className="text-xs font-bold text-tertiary mb-3 uppercase tracking-wider">
                {section}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {items.map((item) => {
                  const Icon = (BsIcons as Record<string, React.ElementType>)[
                    item.icon
                  ];
                  return (
                    <div
                      key={item.path}
                      className="feature-card cursor-pointer"
                      onClick={() => navigate(item.path)}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}
                      >
                        {Icon && <Icon size={18} />}
                      </div>
                      <p className="m-0 font-semibold text-sm text-base">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default DashboardPage;
