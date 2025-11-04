import { Schema } from 'effect'

// Define schemas for validation and serialization
export class ItemTypeSchema extends Schema.Literal('expense', 'discount') {}

export class PersonSchema extends Schema.Class<PersonSchema>('PersonSchema')({
	id: Schema.String,
	name: Schema.String,
}) {}

export class ItemSchema extends Schema.Class<ItemSchema>('ItemSchema')({
	id: Schema.String,
	name: Schema.String,
	amount: Schema.Number, // Quantity
	price: Schema.Number, // Unit price
	type: ItemTypeSchema,
	appliesToEveryone: Schema.Boolean,
	selectedPeople: Schema.Array(Schema.String), // Person IDs
}) {}

export class ExpenseGroupSchema extends Schema.Class<ExpenseGroupSchema>(
	'ExpenseGroupSchema'
)({
	id: Schema.String,
	name: Schema.String,
	people: Schema.Array(PersonSchema),
	items: Schema.Array(ItemSchema),
	tipPercentage: Schema.optional(Schema.Number),
	paymentGroups: Schema.optional(Schema.Array(Schema.Array(Schema.String))),
}) {}

export type ExpenseGroup = Schema.Schema.Type<typeof ExpenseGroupSchema>
export type Person = Schema.Schema.Type<typeof PersonSchema>
export type Item = Schema.Schema.Type<typeof ItemSchema>
export type ItemType = Schema.Schema.Type<typeof ItemTypeSchema>
