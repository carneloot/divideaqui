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
		<Card className="border-none bg-white/90 shadow-md ring-1 ring-slate-200/60 backdrop-blur">
			<CardHeader className="space-y-1">
				<CardTitle className="text-xl font-semibold text-slate-900">
					People
				</CardTitle>
				<p className="text-sm text-slate-500">
					Add friends and keep everyone aligned on what they owe.
				</p>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row">
					<Input
						type="text"
						placeholder="Enter a name (e.g. Alex)"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyPress}
						className="h-12 flex-1 rounded-xl border-slate-200 bg-white text-base"
					/>
					<Button
						onClick={handleAdd}
						className="h-12 rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-slate-800"
					>
						Add person
					</Button>
				</div>
				<div className="space-y-2">
					{people.length === 0 ? (
						<p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-6 text-center text-sm font-medium text-slate-500">
							No people added yet. Invite your crew to begin.
						</p>
					) : (
						[...people]
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((person) => (
								<div
									key={person.id}
									className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
								>
									<span className="text-sm font-medium text-slate-700">
										{person.name}
									</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemove(person.id)}
										aria-label={`Remove ${person.name}`}
										className="h-8 w-8 text-slate-400 hover:text-rose-500"
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
