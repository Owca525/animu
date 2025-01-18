import { createContext } from 'react'
import { SettingsConfig } from '../interface'

// This file is for small context

export const configContext = createContext<SettingsConfig | undefined>(undefined)
