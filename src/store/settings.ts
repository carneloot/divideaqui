import { Atom } from '@effect-atom/atom-react'

import { Schema } from 'effect'

import { runtimeAtom } from './runtime'

// Settings schema (includes pixKey which should not be exported)
export const SettingsSchema = Schema.Struct({
	currency: Schema.String,
	pixKey: Schema.optional(Schema.String),
	language: Schema.optional(Schema.String),
	theme: Schema.Literal('system', 'dark', 'light'),
})

export type Settings = Schema.Schema.Type<typeof SettingsSchema>

// Atom for settings (persisted in localStorage)
export const settingsAtom = Atom.kvs({
	runtime: runtimeAtom,
	key: 'settings',
	schema: SettingsSchema,
	defaultValue: (): Settings => ({ currency: 'BRL', theme: 'system' }),
})

// Derived atom for currency (for backward compatibility and convenience)
export const currencyAtom = Atom.writable(
	(get) => get(settingsAtom).currency,
	(ctx, currency: string) =>
		ctx.set(settingsAtom, { ...ctx.get(settingsAtom), currency })
)

// Derived atom for pixKey
export const pixKeyAtom = Atom.writable(
	(get) => {
		const settings = get(settingsAtom)
		return settings.pixKey ?? null
	},
	(ctx, pixKey: string | null) => {
		const currentSettings = ctx.get(settingsAtom)
		ctx.set(settingsAtom, {
			...currentSettings,
			pixKey: pixKey?.trim() ?? undefined,
		})
	}
)

// Derived atom for language
export const languageAtom = Atom.writable(
	(get) => {
		const settings = get(settingsAtom)
		return settings.language ?? 'pt-BR'
	},
	(ctx, language: string) => {
		const currentSettings = ctx.get(settingsAtom)
		ctx.set(settingsAtom, {
			...currentSettings,
			language,
		})
	}
)

// Derived atom for theme
export const themeAtom = Atom.writable(
	(get) => {
		const settings = get(settingsAtom)
		return settings.theme ?? 'system'
	},
	(ctx, theme: Settings['theme']) => {
		const currentSettings = ctx.get(settingsAtom)
		ctx.set(settingsAtom, {
			...currentSettings,
			theme,
		})
	}
)
