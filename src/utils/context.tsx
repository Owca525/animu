import { createContext } from "react";
import { SettingsConfig } from "./interface";

export const configContext = createContext<SettingsConfig | undefined>(undefined)