// App.tsx — корневой компонент. 6 generic-страниц + общий layout.

import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Index } from "@/routes/Index";
import { DocumentView } from "@/routes/DocumentView";
import { KbLayer } from "@/routes/KbLayer";
import { Search } from "@/routes/Search";
import { GraphPage } from "@/routes/Graph";
import { OpenQuestions } from "@/routes/OpenQuestions";

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/layer/:layer" element={<KbLayer />} />
            <Route path="/doc/*" element={<DocumentView />} />
            <Route path="/search" element={<Search />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/open-questions" element={<OpenQuestions />} />
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-[600px] px-6 py-20 text-center text-muted-foreground">
                  Страница не найдена. <a href="/" className="text-foreground underline">На главную</a>.
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
