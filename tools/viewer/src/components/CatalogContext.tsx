import { createContext, useContext } from "react";
import type { Catalog } from "@/api";

export const CatalogContext = createContext<Catalog | null>(null);
export const useCatalog = () => useContext(CatalogContext);
