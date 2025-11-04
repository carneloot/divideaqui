import { Atom } from '@effect-atom/atom-react'
import { Schema } from 'effect'
import { runtimeAtom } from './runtime'

// Schema for accordion states (not exported)
export const AccordionStateSchema = Schema.Struct({
	people: Schema.Boolean,
	tip: Schema.Boolean,
	item: Schema.Boolean,
	items: Schema.Boolean,
	summary: Schema.Boolean,
})

export type AccordionState = Schema.Schema.Type<typeof AccordionStateSchema>

// Atom for accordion states (persisted in localStorage, not exported)
const accordionStateAtom = Atom.kvs({
	runtime: runtimeAtom,
	key: 'accordion-states',
	schema: AccordionStateSchema,
	defaultValue: (): AccordionState => ({
		people: false,
		tip: false,
		item: false,
		items: false,
		summary: false,
	}),
})

export const peopleAccordionStateAtom = Atom.writable(
	(get) => (get(accordionStateAtom).people ? 'people' : ''),
	(ctx, value: string) =>
		ctx.set(accordionStateAtom, {
			...ctx.get(accordionStateAtom),
			people: value === 'people',
		})
)

export const tipAccordionStateAtom = Atom.writable(
	(get) => (get(accordionStateAtom).tip ? 'tip' : ''),
	(ctx, value: string) =>
		ctx.set(accordionStateAtom, {
			...ctx.get(accordionStateAtom),
			tip: value === 'tip',
		})
)

export const itemAccordionStateAtom = Atom.writable(
	(get) => (get(accordionStateAtom).item ? 'item' : ''),
	(ctx, value: string) =>
		ctx.set(accordionStateAtom, {
			...ctx.get(accordionStateAtom),
			item: value === 'item',
		})
)

export const itemsAccordionStateAtom = Atom.writable(
	(get) => (get(accordionStateAtom).items ? 'items' : ''),
	(ctx, value: string) =>
		ctx.set(accordionStateAtom, {
			...ctx.get(accordionStateAtom),
			items: value === 'items',
		})
)

export const summaryAccordionStateAtom = Atom.writable(
	(get) => (get(accordionStateAtom).summary ? 'summary' : ''),
	(ctx, value: string) =>
		ctx.set(accordionStateAtom, {
			...ctx.get(accordionStateAtom),
			summary: value === 'summary',
		})
)
