import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { maskitoNumberOptionsGenerator } from '@maskito/kit'
import { useMaskito } from '@maskito/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { addItemToGroupAtom, selectedGroupAtom } from '../store/atoms'
import type { ItemType, Person } from '../types'

interface ItemFormProps {
	people: readonly Person[]
}

const maskOptions = maskitoNumberOptionsGenerator({
	min: 0,
	max: 999999.99,
	decimalSeparator: '.',
	thousandSeparator: ',',
	prefix: '$',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
})

export function ItemForm({ people }: ItemFormProps) {
	const group = useAtomValue(selectedGroupAtom)
	const addItem = useAtomSet(addItemToGroupAtom)
	const [name, setName] = useState('')
	const [amount, setAmount] = useState('')
	const [price, setPrice] = useState('')
	const [appliesToEveryone, setAppliesToEveryone] = useState(true)
	const [selectedPeople, setSelectedPeople] = useState<string[]>([])

	const priceInputRef = useMaskito({ options: maskOptions })

	const handleTogglePerson = (personId: string) => {
		setSelectedPeople((prev) =>
			prev.includes(personId)
				? prev.filter((id) => id !== personId)
				: [...prev, personId]
		)
	}

	const handleAddItem = (itemType: ItemType) => {
		if (!group) return

		const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0
		const numPrice =
			parseFloat(price.replace(/[^0-9.]/g, '')) ||
			parseFloat(price.slice(1)) ||
			0
		if (
			name.trim() &&
			!Number.isNaN(numAmount) &&
			numAmount > 0 &&
			!Number.isNaN(numPrice) &&
			numPrice > 0
		) {
			if (!appliesToEveryone && selectedPeople.length === 0) {
				alert('Please select at least one person when using custom selection.')
				return
			}
			addItem({
				groupId: group.id,
				item: {
					id: crypto.randomUUID(),
					name: name.trim(),
					amount: numAmount,
					price: numPrice,
					type: itemType,
					appliesToEveryone,
					selectedPeople: appliesToEveryone ? [] : selectedPeople,
				},
			})
			// Reset form
			setName('')
			setAmount('')
			setPrice('')
			setAppliesToEveryone(true)
			setSelectedPeople([])
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Item</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label htmlFor="name">Item Name</Label>
					<Input
						id="name"
						type="text"
						placeholder="Item name (e.g., 'Pizza', '10% discount')"
						value={name}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setName(e.target.value)
						}
						required
					/>
				</div>
				<div>
					<Label htmlFor="amount">Quantity</Label>
					<Input
						id="amount"
						type="text"
						placeholder="Quantity (e.g., 2)"
						inputMode="numeric"
						required
						value={amount}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setAmount(e.target.value)
						}
					/>
				</div>
				<div>
					<Label htmlFor="price">Unit Price</Label>
					<Input
						id="price"
						ref={priceInputRef}
						type="text"
						placeholder="Unit price"
						inputMode="numeric"
						required
						value={price}
						onInput={(e: React.FormEvent<HTMLInputElement>) =>
							setPrice(e.currentTarget.value)
						}
					/>
				</div>
				<div>
					<RadioGroup
						value={appliesToEveryone ? 'everyone' : 'custom'}
						onValueChange={(value: string) =>
							setAppliesToEveryone(value === 'everyone')
						}
						className="flex gap-6"
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="everyone" id="everyone" />
							<Label htmlFor="everyone">Everyone</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="custom" id="custom" />
							<Label htmlFor="custom">Custom</Label>
						</div>
					</RadioGroup>
				</div>
				{!appliesToEveryone && (
					<div className="space-y-2 p-4 border rounded-md">
						{people.length === 0 ? (
							<p className="text-sm text-yellow-600 italic">
								Add people first before selecting custom
							</p>
						) : (
							[...people]
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((person) => (
									<div key={person.id} className="flex items-center space-x-2">
										<Checkbox
											id={person.id}
											checked={selectedPeople.includes(person.id)}
											onCheckedChange={() => handleTogglePerson(person.id)}
										/>
										<Label
											htmlFor={person.id}
											className="text-sm font-normal cursor-pointer"
										>
											{person.name}
										</Label>
									</div>
								))
						)}
					</div>
				)}
				<div className="flex gap-3 pt-2">
					<Button
						type="button"
						onClick={() => handleAddItem('expense')}
						className="flex-1"
					>
						Add Expense
					</Button>
					<Button
						type="button"
						variant="default"
						onClick={() => handleAddItem('discount')}
						className="flex-1 bg-green-600 hover:bg-green-700"
					>
						Add Discount
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
