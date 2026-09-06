import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "@/v2/hooks/use-theme";
import { ThemeToggle } from "@/v2/layout/ThemeToggle";
import { getCatalog, type Catalog } from "@/api";
import {
  CatalogContext,
  AppSidebar,
  Home,
  Library,
  SpacePage,
  CommandPalette,
} from "@/components/Workspace";
import { DocumentView } from "@/routes/DocumentView";
import { KbLayer } from "@/routes/KbLayer";
import { Search } from "@/routes/Search";
import { GraphPage } from "@/routes/Graph";
import { OpenQuestions } from "@/routes/OpenQuestions";
import { SkillOpt } from "@/routes/SkillOpt";
import "./styles/workspace.css";
export default function App() {
  const { isDark } = useTheme();
  const [data, setData] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getCatalog()
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.title = data?.config.name || "AI KB Harness";
  }, [isDark, data]);
  return (
    <CatalogContext.Provider value={data}>
      <div
        className={"v2 workspace " + (isDark ? "dark" : "")}
        style={
          data?.config.accent
            ? ({
                "--project-accent": data.config.accent,
              } as React.CSSProperties)
            : undefined
        }
      >
        <a className="skip-link" href="#main">
          К содержанию
        </a>
        <header className="workspace-header">
          <a href="/" className="brand">
            {data?.config.name || "AI KB Harness"}
          </a>
          <div>
            <CommandPalette />
            <ThemeToggle />
          </div>
        </header>
        <div className="workspace-layout">
          <AppSidebar />
          <main id="main">
            {error ? (
              <p role="alert">Не удалось загрузить проект: {error}</p>
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/space/:id" element={<SpacePage />} />
                <Route path="/layer/:layer" element={<KbLayer />} />
                <Route path="/doc/*" element={<DocumentView />} />
                <Route path="/search" element={<Search />} />
                <Route path="/graph" element={<GraphPage />} />
                <Route path="/open-questions" element={<OpenQuestions />} />
                <Route path="/skillopt" element={<SkillOpt />} />
                <Route
                  path="*"
                  element={
                    <div className="workspace-page">
                      Страница не найдена. <a href="/">На главную</a>
                    </div>
                  }
                />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </CatalogContext.Provider>
  );
}
