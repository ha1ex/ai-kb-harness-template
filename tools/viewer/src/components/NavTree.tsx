import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export function NavTree({
  id,
  title,
  to,
  children,
  paths = [],
}: {
  id: string;
  title: string;
  to: string;
  children: React.ReactNode;
  paths?: string[];
}) {
  const location = useLocation();
  const [open, setOpen] = useState(
    () => localStorage.getItem("nav:" + id) === "true",
  );
  useEffect(() => {
    if (
      location.pathname.startsWith(to + "/") ||
      location.pathname === to ||
      paths.includes(location.pathname)
    )
      setOpen(true);
  }, [location.pathname, to]);
  return (
    <div className="nav-tree">
      <div>
        <button
          aria-label={"Раскрыть " + title}
          aria-expanded={open}
          onClick={() =>
            setOpen((v) => {
              localStorage.setItem("nav:" + id, String(!v));
              return !v;
            })
          }
        >
          {open ? "⌄" : "›"}
        </button>
        <NavLink to={to}>{title}</NavLink>
      </div>
      {open && <div className="nav-children">{children}</div>}
    </div>
  );
}
