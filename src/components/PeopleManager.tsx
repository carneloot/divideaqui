import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	addPersonToGroupAtom,
	removePersonFromGroupAtom,
	selectedGroupAtom,
} from '../store/atoms'
import type { Person } from '../types'

interface PeopleManagerProps {
	people: readonly Person[]
}

export function PeopleManager({ people }: PeopleManagerProps) {
	const group = useAtomValue(selectedGroupAtom)
	const addPerson = useAtomSet(addPersonToGroupAtom)
	const removePerson = useAtomSet(removePersonFromGroupAtom)
	const [name, setName] = useState('')

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

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleAdd()
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>People</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Input
						type="text"
						placeholder="Enter person's name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyPress}
						className="flex-1"
					/>
					<Button onClick={handleAdd}>Add Person</Button>
				</div>
				<div className="space-y-2">
					{people.length === 0 ? (
						<p className="text-muted-foreground text-center py-4 italic">
							No people added yet. Add someone to get started!
						</p>
					) : (
						[...people]
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((person) => (
								<div
									key={person.id}
									className="flex items-center justify-between p-3 bg-card border rounded-md"
								>
									<span>{person.name}</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemove(person.id)}
										aria-label={`Remove ${person.name}`}
										className="h-8 w-8"
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
