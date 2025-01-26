import { createContext } from 'react'
import { SettingsConfig } from '../interface'
import { defaultConfig } from '../config'

// This file is for small context

export const configContext = createContext<SettingsConfig>(defaultConfig)
