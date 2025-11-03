import { BrowserKeyValueStore } from '@effect/platform-browser'
import { Atom } from '@effect-atom/atom-react'
import { Effect, Layer, Schema } from 'effect'
import { Compressor } from '../services/compressor'
import { PakoCompressorLive } from '../services/pako-compressor'
import {
	type ExpenseGroup,
	ExpenseGroupSchema,
	type Item,
	type Person,
} from '../types'

// Create atoms for managing expense groups
// Merge all required layers for the runtime
const runtimeLayer = Layer.merge(
	BrowserKeyValueStore.layerLocalStorage,
	PakoCompressorLive
)

const runtimeAtom = Atom.runtime(runtimeLayer)

// Settings schema (includes pixKey which should not be exported)
export const SettingsSchema = Schema.Struct({
	currency: Schema.String,
	pixKey: Schema.optional(Schema.String),
	language: Schema.optional(Schema.String),
	theme: Schema.Literal('system', 'dark', 'light'),
})

export type Settings = Schema.Schema.Type<typeof SettingsSchema>

// Atom for expense groups persisted in localStorage
export const groupsAtom = Atom.kvs({
	runtime: runtimeAtom,
	key: 'expense-groups',
	schema: Schema.Array(ExpenseGroupSchema),
	defaultValue: () => [],
})

// Atom for selected group ID
export const selectedGroupIdAtom = Atom.make<string | null>(null).pipe(
	Atom.keepAlive
)

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

// Atom for selected group (derived from groups and selectedGroupId)
export const selectedGroupAtom = Atom.make((get) => {
	const groups = get(groupsAtom)
	const selectedGroupId = get(selectedGroupIdAtom)
	return groups.find((g) => g.id === selectedGroupId) || null
})

export const createNewGroupAtom = Atom.fnSync(
	(input: { name: string }, get) => {
		const newGroup: ExpenseGroup = {
			id: crypto.randomUUID(),
			name: input.name,
			people: [],
			items: [],
		}
		get.set(groupsAtom, [...get(groupsAtom), newGroup])
		get.set(selectedGroupIdAtom, newGroup.id)
	}
)

export const deleteGroupAtom = Atom.fnSync((input: { id: string }, get) => {
	get.set(
		groupsAtom,
		get(groupsAtom).filter((g) => g.id !== input.id)
	)
	if (get(selectedGroupIdAtom) === input.id) {
		get.set(selectedGroupIdAtom, null)
	}
})

export const updateGroupNameAtom = Atom.fnSync(
	(
		input: {
			id: string
			name: string
		},
		get
	) => {
		get.set(
			groupsAtom,
			get(groupsAtom).map((g) =>
				g.id === input.id ? { ...g, name: input.name } : g
			)
		)
	}
)

export const updateGroupTipPercentageAtom = Atom.fnSync(
	(input: { id: string; tipPercentage: number | undefined }, get) => {
		get.set(
			groupsAtom,
			get(groupsAtom).map((g) =>
				g.id === input.id ? { ...g, tipPercentage: input.tipPercentage } : g
			)
		)
	}
)

export const groupTipPercentageAtom = Atom.make((get) => {
	const selectedGroup = get(selectedGroupAtom)
	return selectedGroup?.tipPercentage ?? 0
})

export const addPersonToGroupAtom = Atom.fnSync(
	(input: { groupId: string; person: Person }, get) => {
		const groups = get(groupsAtom)
		get.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? { ...g, people: [...g.people, input.person] }
					: g
			)
		)
	}
)

export const removePersonFromGroupAtom = Atom.fnSync(
	(input: { groupId: string; personId: string }, get) => {
		const groups = get(groupsAtom)
		const group = groups.find((g) => g.id === input.groupId)
		if (!group) return

		const updatedPeople = group.people.filter((p) => p.id !== input.personId)
		const updatedItems = group.items.map((item) => ({
			...item,
			selectedPeople: item.selectedPeople.filter((id) => id !== input.personId),
		}))

		get.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? { ...g, people: updatedPeople, items: updatedItems }
					: g
			)
		)
	}
)

export const addItemToGroupAtom = Atom.fnSync(
	(input: { groupId: string; item: Item }, get) => {
		const groups = get(groupsAtom)
		get.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId ? { ...g, items: [...g.items, input.item] } : g
			)
		)
	}
)

export const removeItemFromGroupAtom = Atom.fnSync(
	(input: { groupId: string; itemId: string }, get) => {
		const groups = get(groupsAtom)
		get.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? { ...g, items: g.items.filter((item) => item.id !== input.itemId) }
					: g
			)
		)
	}
)

// Export/Import atoms
const ExportDataSchema = Schema.parseJson(
	Schema.Struct({
		groups: Schema.Array(ExpenseGroupSchema),
		settings: SettingsSchema.pipe(Schema.omit('pixKey')), // Use export schema that excludes pixKey
		version: Schema.Literal('1.0.0'),
	})
)

export const exportDataAtom = runtimeAtom.fn(
	Effect.fn(function* (_input: undefined, get: Atom.FnContext) {
		const compressor = yield* Compressor
		const groups = get(groupsAtom)
		const settings = get(settingsAtom)

		const jsonString = yield* Schema.encode(ExportDataSchema)({
			groups,
			settings,
			version: '1.0.0',
		})

		const compressed = yield* compressor.compress(jsonString)

		return compressed
	})
)

export const importDataAtom = runtimeAtom.fn(
	Effect.fn(function* (input: { dataString: string }, get: Atom.FnContext) {
		const compressor = yield* Compressor
		const { dataString } = input

		const decompressed = yield* compressor.decompress(dataString)

		const validated = yield* Schema.decode(ExportDataSchema)(decompressed)

		// Restore data (preserve pixKey from current settings, don't overwrite it)
		const currentSettings = get(settingsAtom)
		get.set(groupsAtom, validated.groups)
		get.set(settingsAtom, {
			currency: validated.settings.currency,
			language: validated.settings.language,
			theme: validated.settings.theme,
			pixKey: currentSettings.pixKey, // Preserve existing pixKey
		})

		// Reset selected group ID if it doesn't exist in imported groups
		const selectedGroupId = get(selectedGroupIdAtom)
		if (
			selectedGroupId &&
			!validated.groups.some((g) => g.id === selectedGroupId)
		) {
			get.set(
				selectedGroupIdAtom,
				validated.groups.length > 0 ? validated.groups[0].id : null
			)
		} else if (validated.groups.length > 0 && !selectedGroupId) {
			get.set(selectedGroupIdAtom, validated.groups[0].id)
		}
	})
)
