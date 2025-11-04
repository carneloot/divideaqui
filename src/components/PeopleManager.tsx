import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	type UniqueIdentifier,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'

import { Atom, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { ChevronDown, ChevronUp, GripVertical, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	addPersonToGroupAtom,
	groupsAtom,
	removePersonFromGroupAtom,
	selectedGroupAtom,
	updatePaymentGroupsAtom,
} from '../store/atoms'
import type { Person } from '../types'
import { AutocompleteInput } from './AutocompleteInput'

interface PeopleManagerProps {
	people: readonly Person[]
}

interface DraggablePersonProps {
	person: Person
	groupId?: string
}

function DraggablePerson({ person, groupId }: DraggablePersonProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: person.id,
		data: {
			type: 'person',
			person,
			groupId,
		},
	})

	return (
		<div
			ref={setNodeRef}
			style={{ opacity: isDragging ? 0.5 : 1 }}
			className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm"
		>
			<button
				{...attributes}
				{...listeners}
				className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<span className="flex-1 font-medium text-foreground text-sm">
				{person.name}
			</span>
		</div>
	)
}

const otherGroupMemberNamesAtom = Atom.make((get) => {
	const group = get(selectedGroupAtom)
	if (!group) return [] as string[]

	const currentMemberNames = new Set(
		group.people.map((person) => person.name.toLowerCase())
	)
	const allNames = new Set<string>()

	const groups = get(groupsAtom)
	for (const candidateGroup of groups) {
		if (candidateGroup.id === group.id) continue
		for (const person of candidateGroup.people) {
			const nameLower = person.name.toLowerCase()
			if (!currentMemberNames.has(nameLower)) {
				allNames.add(person.name)
			}
		}
	}

	return Array.from(allNames).sort((a, b) => a.localeCompare(b))
})

const paymentGroupsAtom = Atom.make((get) => {
	const group = get(selectedGroupAtom)
	if (!group?.paymentGroups) return [] as string[][]

	return group.paymentGroups.map((paymentGroup) => [...paymentGroup])
})

const unassignedPeopleAtom = Atom.make((get) => {
	const group = get(selectedGroupAtom)
	if (!group) return [] as Person[]

	const peopleInGroups = new Set<string>()
	for (const paymentGroup of group.paymentGroups ?? []) {
		for (const personId of paymentGroup) {
			peopleInGroups.add(personId)
		}
	}

	return group.people.filter((person) => !peopleInGroups.has(person.id))
})

interface PaymentGroupProps {
	groupIndex: number
	personIds: string[]
	people: readonly Person[]
	onRemoveGroup: () => void
}

function PaymentGroup({
	groupIndex,
	personIds,
	people,
	onRemoveGroup,
}: PaymentGroupProps) {
	const { t } = useTranslation()
	const { setNodeRef, isOver } = useDroppable({
		id: `group-${groupIndex}`,
	})
	const groupPeople = personIds
		.map((id) => people.find((p) => p.id === id))
		.filter(Boolean) as Person[]

	return (
		<div
			ref={setNodeRef}
			className={`space-y-2 rounded-lg border border-border bg-background p-3 ${
				isOver ? 'border-primary bg-primary/5' : ''
			}`}
		>
			<div className="flex items-center justify-between">
				<p className="font-medium text-foreground text-sm">
					{t('people.paymentGroups.group')} {groupIndex + 1}
				</p>
				<Button
					variant="ghost"
					size="icon"
					onClick={onRemoveGroup}
					className="h-6 w-6 text-muted-foreground hover:text-destructive"
				>
					<Trash2 className="h-3 w-3" />
				</Button>
			</div>
			<div className="space-y-2">
				{groupPeople.map((person) => (
					<DraggablePerson
						key={person.id}
						person={person}
						groupId={groupIndex.toString()}
					/>
				))}
			</div>
		</div>
	)
}

function UnassignedDroppable({ children }: { children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({
		id: 'unassigned',
	})

	return (
		<div
			ref={setNodeRef}
			className={`space-y-2 rounded-lg border border-border bg-background p-3 ${
				isOver ? 'border-primary bg-primary/5' : ''
			}`}
		>
			{children}
		</div>
	)
}

export function PeopleManager({ people }: PeopleManagerProps) {
	const { t } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const addPerson = useAtomSet(addPersonToGroupAtom)
	const removePerson = useAtomSet(removePersonFromGroupAtom)
	const updatePaymentGroups = useAtomSet(updatePaymentGroupsAtom)
	const otherGroupMemberNames = useAtomValue(otherGroupMemberNamesAtom)
	const paymentGroups = useAtomValue(paymentGroupsAtom)
	const unassignedPeople = useAtomValue(unassignedPeopleAtom)
	const [name, setName] = useState('')
	const [showPaymentGroups, setShowPaymentGroups] = useState(false)
	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
	)

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

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id)
	}

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveId(null)
		if (!group) return

		const { active, over } = event
		if (!over) return

		const activeId = active.id as string
		const overId = over.id as string

		// Find which group the person is currently in (if any)
		let sourceGroupIndex = -1
		for (let i = 0; i < paymentGroups.length; i++) {
			const index = paymentGroups[i].indexOf(activeId)
			if (index !== -1) {
				sourceGroupIndex = i
				break
			}
		}

		const updatedGroups = paymentGroups.map((paymentGroup) => [...paymentGroup])

		// Check if dropping on a group or unassigned
		if (overId === 'unassigned') {
			// Remove from current group
			if (sourceGroupIndex !== -1) {
				updatedGroups[sourceGroupIndex] = updatedGroups[
					sourceGroupIndex
				].filter((id: string) => id !== activeId)
			}
		} else if (typeof overId === 'string' && overId.startsWith('group-')) {
			// Dropping on a group
			const targetGroupIndex = parseInt(overId.replace('group-', ''), 10)
			if (targetGroupIndex >= 0 && targetGroupIndex < updatedGroups.length) {
				// Remove from source group if it exists
				if (sourceGroupIndex !== -1 && sourceGroupIndex !== targetGroupIndex) {
					updatedGroups[sourceGroupIndex] = updatedGroups[
						sourceGroupIndex
					].filter((id: string) => id !== activeId)
				}
				// Add to target group if not already there
				if (!updatedGroups[targetGroupIndex].includes(activeId)) {
					updatedGroups[targetGroupIndex] = [
						...updatedGroups[targetGroupIndex],
						activeId,
					]
				}
			}
		} else if (typeof overId === 'string' && overId.startsWith('person-')) {
			// Dropping on another person - find which group that person is in
			const targetPersonId = overId.replace('person-', '')
			let targetGroupIndex = -1
			for (let i = 0; i < updatedGroups.length; i++) {
				if (updatedGroups[i].includes(targetPersonId)) {
					targetGroupIndex = i
					break
				}
			}
			if (targetGroupIndex !== -1) {
				// Remove from source group if it exists and is different
				if (sourceGroupIndex !== -1 && sourceGroupIndex !== targetGroupIndex) {
					updatedGroups[sourceGroupIndex] = updatedGroups[
						sourceGroupIndex
					].filter((id: string) => id !== activeId)
				}
				// Add to target group if not already there
				if (!updatedGroups[targetGroupIndex].includes(activeId)) {
					updatedGroups[targetGroupIndex] = [
						...updatedGroups[targetGroupIndex],
						activeId,
					]
				}
			}
		}

		// Remove any empty groups after the drop operation
		const normalizedGroups = updatedGroups
			.map((paymentGroup) => paymentGroup.filter((id) => Boolean(id)))
			.filter((paymentGroup) => paymentGroup.length > 0) as string[][]

		updatePaymentGroups({
			groupId: group.id,
			paymentGroups: normalizedGroups,
		})
	}

	const handleCreateGroup = () => {
		if (!group) return
		const newGroups = [...paymentGroups, []] as string[][]
		updatePaymentGroups({
			groupId: group.id,
			paymentGroups: newGroups,
		})
	}

	const handleRemoveGroup = (groupIndex: number) => {
		if (!group) return
		const newGroups = paymentGroups.filter(
			(_, i) => i !== groupIndex
		) as string[][]
		updatePaymentGroups({
			groupId: group.id,
			paymentGroups: newGroups,
		})
	}

	const activePerson = activeId ? people.find((p) => p.id === activeId) : null

	const dragOverlayContent = activePerson ? (
		<div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
			<GripVertical className="h-4 w-4 text-muted-foreground" />
			<span className="font-medium text-foreground text-sm">
				{activePerson.name}
			</span>
		</div>
	) : null

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
				{people.length > 1 && (
					<div className="space-y-3">
						<Button
							variant="ghost"
							onClick={() => setShowPaymentGroups(!showPaymentGroups)}
							className="flex w-full items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 text-left hover:bg-muted/80"
						>
							<span className="font-medium text-foreground text-sm">
								{t('people.paymentGroups.title')}
							</span>
							{showPaymentGroups ? (
								<ChevronUp className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							)}
						</Button>
						{showPaymentGroups && (
							<DndContext
								sensors={sensors}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
							>
								<div className="space-y-4 rounded-xl border border-border bg-muted p-4">
									<p className="text-muted-foreground text-xs">
										{t('people.paymentGroups.subtitle')}
									</p>
									<div className="space-y-4">
										{/* Payment Groups */}
										{paymentGroups.map((paymentGroup, index) => {
											// Create a unique key based on group members
											const groupKey = `group-${index}-${paymentGroup.join('-')}`
											return (
												<div
													key={groupKey}
													className="rounded-lg border-2 border-primary/30 border-dashed p-2"
												>
													<PaymentGroup
														groupIndex={index}
														personIds={[...paymentGroup]}
														people={people}
														onRemoveGroup={() => handleRemoveGroup(index)}
													/>
												</div>
											)
										})}

										{/* Unassigned People */}
										<UnassignedDroppable>
											<p className="font-medium text-foreground text-sm">
												{t('people.paymentGroups.unassigned')}
											</p>
											<div className="space-y-2">
												{unassignedPeople.map((person) => (
													<DraggablePerson key={person.id} person={person} />
												))}
											</div>
										</UnassignedDroppable>

										{/* Create Group Button */}
										<Button
											onClick={handleCreateGroup}
											variant="outline"
											className="w-full"
										>
											{t('people.paymentGroups.createGroup')}
										</Button>
									</div>
								</div>
								{createPortal(
									<DragOverlay>{dragOverlayContent}</DragOverlay>,
									document.body
								)}
							</DndContext>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
