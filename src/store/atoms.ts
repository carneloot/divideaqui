import { BrowserKeyValueStore } from '@effect/platform-browser'
import { Atom, Registry } from '@effect-atom/atom-react'
import { Effect, Schema } from 'effect'
import {
	type ExpenseGroup,
	ExpenseGroupSchema,
	type Item,
	type Person,
} from '../types'

// Create atoms for managing expense groups
const runtimeAtom = Atom.runtime(BrowserKeyValueStore.layerLocalStorage)

// Settings schema
export const SettingsSchema = Schema.Struct({
	currency: Schema.String,
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
	defaultValue: () => ({ currency: 'USD' }),
})

// Derived atom for currency (for backward compatibility and convenience)
export const currencyAtom = Atom.writable(
	(get) => get(settingsAtom).currency,
	(ctx, currency: string) => ctx.set(settingsAtom, { ...ctx.get(settingsAtom), currency })
)

// Atom for selected group (derived from groups and selectedGroupId)
export const selectedGroupAtom = Atom.make((get) => {
	const groups = get(groupsAtom)
	const selectedGroupId = get(selectedGroupIdAtom)
	return groups.find((g) => g.id === selectedGroupId) || null
})

export const createNewGroupAtom = Atom.fn(
	Effect.fn(function* (input: { name: string }) {
		const ctx = yield* Registry.AtomRegistry
		const newGroup: ExpenseGroup = {
			id: crypto.randomUUID(),
			name: input.name,
			people: [],
			items: [],
		}

		ctx.set(groupsAtom, [...ctx.get(groupsAtom), newGroup])
		ctx.set(selectedGroupIdAtom, newGroup.id)
	})
)

export const deleteGroupAtom = Atom.fn(
	Effect.fn(function* (input: { id: string }) {
		const ctx = yield* Registry.AtomRegistry
		ctx.set(
			groupsAtom,
			ctx.get(groupsAtom).filter((g) => g.id !== input.id)
		)
		if (ctx.get(selectedGroupIdAtom) === input.id) {
			ctx.set(selectedGroupIdAtom, null)
		}
	})
)

export const updateGroupAtom = Atom.fn(
	Effect.fn(function* (input: {
		id: string
		name?: string
		tipPercentage?: number
	}) {
		const ctx = yield* Registry.AtomRegistry
		ctx.set(
			groupsAtom,
			ctx.get(groupsAtom).map((g) =>
				g.id === input.id
					? {
							...g,
							name: input.name ?? g.name,
							tipPercentage: input.tipPercentage ?? g.tipPercentage,
						}
					: g
			)
		)
	})
)

export const groupTipPercentageAtom = Atom.make((get) => {
	const selectedGroup = get(selectedGroupAtom)
	return selectedGroup?.tipPercentage ?? 0
})

export const addPersonToGroupAtom = Atom.fn(
	Effect.fn(function* (input: { groupId: string; person: Person }) {
		const ctx = yield* Registry.AtomRegistry
		const groups = ctx.get(groupsAtom)
		ctx.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? { ...g, people: [...g.people, input.person] }
					: g
			)
		)
	})
)

export const removePersonFromGroupAtom = Atom.fn(
	Effect.fn(function* (input: { groupId: string; personId: string }) {
		const ctx = yield* Registry.AtomRegistry
		const groups = ctx.get(groupsAtom)
		const group = groups.find((g) => g.id === input.groupId)
		if (!group) return

		const updatedPeople = group.people.filter((p) => p.id !== input.personId)
		const updatedItems = group.items.map((item) => ({
			...item,
			selectedPeople: item.selectedPeople.filter((id) => id !== input.personId),
		}))

		ctx.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? { ...g, people: updatedPeople, items: updatedItems }
					: g
			)
		)
	})
)

export const addItemToGroupAtom = Atom.fn(
	Effect.fn(function* (input: { groupId: string; item: Item }) {
		const ctx = yield* Registry.AtomRegistry
		const groups = ctx.get(groupsAtom)
		ctx.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId ? { ...g, items: [...g.items, input.item] } : g
			)
		)
	})
)

export const removeItemFromGroupAtom = Atom.fn(
	Effect.fn(function* (input: { groupId: string; itemId: string }) {
		const ctx = yield* Registry.AtomRegistry
		const groups = ctx.get(groupsAtom)
		ctx.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? { ...g, items: g.items.filter((item) => item.id !== input.itemId) }
					: g
			)
		)
	})
)
