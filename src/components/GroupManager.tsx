import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	deleteGroupAtom,
	selectedGroupAtom,
	updateGroupAtom,
} from '../store/atoms'
import { ItemForm } from './ItemForm'
import { ItemsList } from './ItemsList'
import { PeopleManager } from './PeopleManager'
import { Summary } from './Summary'

export function GroupManager() {
	const group = useAtomValue(selectedGroupAtom)
	const deleteGroup = useAtomSet(deleteGroupAtom)
	const updateGroup = useAtomSet(updateGroupAtom)

	const [groupName, setGroupName] = useState(group?.name || '')
	const [tipPercentage, setTipPercentage] = useState(
		group?.tipPercentage?.toString() || ''
	)

	// Sync local state with group when it changes
	useEffect(() => {
		if (group) {
			setGroupName(group.name)
			setTipPercentage(group.tipPercentage?.toString() || '')
		}
	}, [group])

	if (!group) {
		return null
	}

	const handleUpdateName = () => {
		if (groupName.trim()) {
			updateGroup({ id: group.id, name: groupName.trim() })
		}
	}

	const handleUpdateTipPercentage = () => {
		const tipValue =
			tipPercentage.trim() === '' ? undefined : parseFloat(tipPercentage)
		updateGroup({
			id: group.id,
			tipPercentage:
				tipValue !== undefined && !Number.isNaN(tipValue) && tipValue >= 0
					? tipValue
					: undefined,
		})
	}

	return (
		<Card>
			<div className="flex items-center justify-between p-6 border-b bg-muted/50">
				<Input
					type="text"
					value={groupName}
					onChange={(e) => setGroupName(e.target.value)}
					onBlur={handleUpdateName}
					onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
					className="text-2xl font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-w-md"
				/>
				<Button
					variant="destructive"
					onClick={() => deleteGroup({ id: group.id })}
					aria-label="Delete group"
				>
					<Trash2 className="h-4 w-4 mr-2" />
					Delete Group
				</Button>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
				<div className="space-y-6">
					<PeopleManager people={group.people} />
					<Card>
						<CardHeader>
							<CardTitle>Tip Settings</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="tip-percentage">Tip Percentage</Label>
								<div className="flex gap-2">
									<Input
										id="tip-percentage"
										type="number"
										placeholder="Enter tip % (optional)"
										value={tipPercentage}
										onChange={(e) => setTipPercentage(e.target.value)}
										onBlur={handleUpdateTipPercentage}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleUpdateTipPercentage()
											}
										}}
										min="0"
										max="100"
										step="0.1"
										className="flex-1"
									/>
								</div>
								<p className="text-sm text-muted-foreground">
									The tip will be calculated on the total bill and split equally
									among all people.
								</p>
							</div>
						</CardContent>
					</Card>
					<ItemForm people={group.people} />
				</div>
				<div className="space-y-6">
					<ItemsList items={group.items} people={group.people} />
					<Summary />
				</div>
			</div>
		</Card>
	)
}
