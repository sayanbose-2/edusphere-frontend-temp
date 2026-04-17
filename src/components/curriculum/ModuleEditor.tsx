import { BsPlus, BsDashCircle } from "react-icons/bs";

interface IModuleEntry {
  title: string;
  description: string;
  topics: string;
}

interface Props {
  modules: IModuleEntry[];
  onChange: (modules: IModuleEntry[]) => void;
}

export const ModuleEditor = ({ modules, onChange }: Props) => {
  const updMod = (i: number, field: keyof IModuleEntry, v: string) =>
    onChange(modules.map((m, idx) => (idx === i ? { ...m, [field]: v } : m)));

  return (
    <>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-xs font-semibold">Modules</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() =>
            onChange([...modules, { title: "", description: "", topics: "" }])
          }
        >
          <BsPlus className="me-1" />
          Add Module
        </button>
      </div>
      {modules.map((mod, i) => (
        <div
          key={i}
          className="border border-light rounded-lg p-3.5 mb-3 bg-base"
        >
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-tertiary uppercase tracking-wider">
              Module {i + 1}
            </span>
            <button
              className="icon-btn icon-btn-danger"
              onClick={() =>
                onChange(
                  modules.length > 1
                    ? modules.filter((_, idx) => idx !== i)
                    : modules,
                )
              }
              disabled={modules.length === 1}
            >
              <BsDashCircle size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div>
              <label className="form-label">Title</label>
              <input
                className="form-control"
                value={mod.title}
                onChange={(e) => updMod(i, "title", e.target.value)}
                placeholder="Module title"
              />
            </div>
            <div>
              <label className="form-label">Topics (comma-separated)</label>
              <input
                className="form-control"
                value={mod.topics}
                onChange={(e) => updMod(i, "topics", e.target.value)}
                placeholder="Topic 1, Topic 2"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <input
              className="form-control"
              value={mod.description}
              onChange={(e) => updMod(i, "description", e.target.value)}
              placeholder="Brief description"
            />
          </div>
        </div>
      ))}
    </>
  );
};
