import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	addPersonToGroupAtom,
	groupsAtom,
	removePersonFromGroupAtom,
	selectedGroupAtom,
} from '../store/atoms'
import type { Person } from '../types'
import { AutocompleteInput } from './AutocompleteInput'

interface PeopleManagerProps {
	people: readonly Person[]
}

export function PeopleManager({ people }: PeopleManagerProps) {
	const { t } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const groups = useAtomValue(groupsAtom)
	const addPerson = useAtomSet(addPersonToGroupAtom)
	const removePerson = useAtomSet(removePersonFromGroupAtom)
	const [name, setName] = useState('')

	// Get unique member names from other groups
	const otherGroupMemberNames = useMemo(() => {
		if (!group) return []
		const currentMemberNames = new Set(people.map((p) => p.name.toLowerCase()))
		const allNames = new Set<string>()

		groups.forEach((g) => {
			if (g.id !== group.id) {
				g.people.forEach((person) => {
					const nameLower = person.name.toLowerCase()
					// Only include names that aren't already in current group
					if (!currentMemberNames.has(nameLower)) {
						allNames.add(person.name)
					}
				})
			}
		})

		return Array.from(allNames).sort((a, b) => a.localeCompare(b))
	}, [groups, group, people])

	const handleAdd = () => {
		if (name.trim() && group) {
			addPerson({
				groupId: group.id,
				person: {
					id: crypto.randomUUID(),
					name: name.trim(),
				},
			})
			setName('')
		}
	}

	const handleRemove = (id: string) => {
		if (group) {
			removePerson({ groupId: group.id, personId: id })
		}
	}

	return (
		<Card className="border-none bg-card shadow-md ring-1 ring-ring backdrop-blur">
			<CardHeader className="space-y-1">
				<CardTitle className="font-semibold text-foreground text-xl">
					{t('people.title')}
				</CardTitle>
				<p className="text-muted-foreground text-sm">{t('people.subtitle')}</p>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row">
					<AutocompleteInput
						value={name}
						onChange={setName}
						suggestions={otherGroupMemberNames}
						onEnter={handleAdd}
						placeholder={t('people.placeholder')}
						className="h-12 flex-1 rounded-xl border-input bg-background text-base"
					/>
					<Button
						onClick={handleAdd}
						className="h-12 rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
					>
						{t('people.addPerson')}
					</Button>
				</div>
				<div className="space-y-2">
					{people.length === 0 ? (
						<p className="rounded-xl border border-border border-dashed bg-muted py-6 text-center font-medium text-muted-foreground text-sm">
							{t('people.empty')}
						</p>
					) : (
						[...people]
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((person) => (
								<div
									key={person.id}
									className="hover:-translate-y-0.5 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm transition hover:shadow-md"
								>
									<span className="font-medium text-foreground text-sm">
										{person.name}
									</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemove(person.id)}
										aria-label={t('people.remove', { name: person.name })}
										className="h-8 w-8 text-muted-foreground hover:text-destructive"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))
					)}
				</div>
			</CardContent>
		</Card>
	)
}
