import { createContext } from 'react'
import { SettingsConfig } from '../interface'
import { defaultConfig } from '../filesMange/config'

// This file is for small context

export const configContext = createContext<SettingsConfig>(defaultConfig)
