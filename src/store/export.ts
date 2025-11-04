import type { Atom } from '@effect-atom/atom-react'
import { Effect, Schema } from 'effect'

import { Compressor } from '../services/compressor'
import { ExpenseGroupSchema } from '../types'
import { groupsAtom, selectedGroupIdAtom } from './expense-groups'
import { runtimeAtom } from './runtime'
import { SettingsSchema, settingsAtom } from './settings'

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
