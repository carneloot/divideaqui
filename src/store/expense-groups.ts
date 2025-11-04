import { Atom } from '@effect-atom/atom-react'
import { Schema } from 'effect'
import {
	type ExpenseGroup,
	ExpenseGroupSchema,
	type Item,
	type Person,
} from '../types'
import { runtimeAtom } from './runtime'

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

		// Clean up payment groups - remove person from their payment group
		const currentPaymentGroups = group.paymentGroups || []
		const updatedPaymentGroups = currentPaymentGroups
			.map((paymentGroup) =>
				paymentGroup.filter((id: string) => id !== input.personId)
			)
			.filter((paymentGroup) => paymentGroup.length > 0) // Remove empty groups

		get.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? {
							...g,
							people: updatedPeople,
							items: updatedItems,
							paymentGroups:
								updatedPaymentGroups.length > 0
									? updatedPaymentGroups
									: undefined,
						}
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

export const updatePaymentGroupsAtom = Atom.fnSync(
	(
		input: {
			groupId: string
			paymentGroups: string[][]
		},
		get
	) => {
		const groups = get(groupsAtom)
		const normalizedGroups = input.paymentGroups.map((group) => [...group])
		get.set(
			groupsAtom,
			groups.map((g) =>
				g.id === input.groupId
					? {
							...g,
							paymentGroups:
								normalizedGroups.length > 0 ? normalizedGroups : undefined,
						}
					: g
			)
		)
	}
)
