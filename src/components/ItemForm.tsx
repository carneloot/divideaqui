import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { maskitoNumberOptionsGenerator } from '@maskito/kit'
import { useMaskito } from '@maskito/react'
import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
	addItemToGroupAtom,
	currencyAtom,
	selectedGroupAtom,
} from '../store/atoms'
import type { ItemType, Person } from '../types'

interface ItemFormProps {
	people: readonly Person[]
}

// Helper function to get currency symbol
function getCurrencySymbol(currency: string, locale: string): string {
	try {
		const formatter = new Intl.NumberFormat(
			locale === 'en' ? 'en-US' : locale,
			{
				style: 'currency',
				currency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}
		)
		const parts = formatter.formatToParts(1)
		const symbolPart = parts.find((part) => part.type === 'currency')
		return symbolPart?.value || currency
	} catch {
		return currency
	}
}

export function ItemForm({ people }: ItemFormProps) {
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const currency = useAtomValue(currencyAtom)
	const addItem = useAtomSet(addItemToGroupAtom)
	const [name, setName] = useState('')
	const [amount, setAmount] = useState('')
	const [price, setPrice] = useState('')
	const [appliesToEveryone, setAppliesToEveryone] = useState(true)
	const [selectedPeople, setSelectedPeople] = useState<string[]>([])
	const [showValidationDialog, setShowValidationDialog] = useState(false)

	const currencySymbol = useMemo(
		() => getCurrencySymbol(currency, i18n.language),
		[currency, i18n.language]
	)
	const maskOptions = useMemo(
		() =>
			maskitoNumberOptionsGenerator({
				min: 0,
				max: 999999.99,
				decimalSeparator: '.',
				thousandSeparator: ',',
				prefix: currencySymbol,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}),
		[currencySymbol]
	)

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

		const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 1
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
				setShowValidationDialog(true)
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
			toast.success(
				t(itemType === 'expense' ? 'item.expenseAdded' : 'item.discountAdded'),
				{
					description: t('item.addedToGroup', { name: name.trim() }),
				}
			)
			// Reset form
			setName('')
			setAmount('')
			setPrice('')
			setAppliesToEveryone(true)
			setSelectedPeople([])
		}
	}

	return (
		<>
			<Card className="border-none bg-white/90 shadow-md ring-1 ring-slate-200/60 backdrop-blur">
				<CardHeader className="space-y-1">
					<CardTitle className="font-semibold text-slate-900 text-xl">
						{t('item.title')}
					</CardTitle>
					<p className="text-slate-500 text-sm">{t('item.subtitle')}</p>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2 sm:col-span-2">
							<Label
								htmlFor="name"
								className="font-medium text-slate-700 text-sm"
							>
								{t('item.name')}
							</Label>
							<Input
								id="name"
								type="text"
								placeholder={t('item.namePlaceholder')}
								value={name}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setName(e.target.value)
								}
								required
								className="h-12 rounded-xl border-slate-200"
							/>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="price"
								className="font-medium text-slate-700 text-sm"
							>
								{t('item.unitPrice')}
							</Label>
							<Input
								id="price"
								ref={priceInputRef}
								type="text"
								placeholder={`e.g. ${currencySymbol}12.50`}
								inputMode="numeric"
								required
								value={price}
								onInput={(e: React.FormEvent<HTMLInputElement>) =>
									setPrice(e.currentTarget.value)
								}
								className="h-12 rounded-xl border-slate-200"
							/>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="amount"
								className="font-medium text-slate-700 text-sm"
							>
								{t('item.quantity')}
							</Label>
							<Input
								id="amount"
								type="text"
								placeholder="e.g. 1"
								inputMode="numeric"
								value={amount}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setAmount(e.target.value)
								}
								className="h-12 rounded-xl border-slate-200"
							/>
							<p className="text-slate-500 text-xs leading-relaxed">
								{t('item.quantityDefaultHint')}
							</p>
						</div>
					</div>
					<div>
						<Label className="font-medium text-slate-700 text-sm">
							{t('item.whoShouldPay')}
						</Label>
						<RadioGroup
							value={appliesToEveryone ? 'everyone' : 'custom'}
							onValueChange={(value: string) =>
								setAppliesToEveryone(value === 'everyone')
							}
							className="mt-3 flex flex-wrap gap-3"
						>
							<div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
								<RadioGroupItem value="everyone" id="everyone" />
								<Label
									htmlFor="everyone"
									className="font-medium text-slate-700 text-sm"
								>
									{t('item.everyone')}
								</Label>
							</div>
							<div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
								<RadioGroupItem value="custom" id="custom" />
								<Label
									htmlFor="custom"
									className="font-medium text-slate-700 text-sm"
								>
									{t('item.choosePeople')}
								</Label>
							</div>
						</RadioGroup>
					</div>
					{!appliesToEveryone && (
						<div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
							{people.length === 0 ? (
								<p className="font-medium text-amber-600 text-sm">
									{t('item.customSplitHint')}
								</p>
							) : (
								<div className="grid gap-2 sm:grid-cols-2">
									{[...people]
										.sort((a, b) => a.name.localeCompare(b.name))
										.map((person) => (
											<label
												key={person.id}
												htmlFor={person.id}
												className="flex items-center gap-3 rounded-xl border border-transparent bg-white px-4 py-2 font-medium text-slate-600 text-sm shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
											>
												<Checkbox
													id={person.id}
													checked={selectedPeople.includes(person.id)}
													onCheckedChange={() => handleTogglePerson(person.id)}
												/>
												<span>{person.name}</span>
											</label>
										))}
								</div>
							)}
						</div>
					)}
					<div className="flex flex-col gap-3 pt-2 sm:flex-row">
						<Button
							type="button"
							onClick={() => handleAddItem('expense')}
							className="h-12 flex-1 rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500"
						>
							{t('item.addExpense')}
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => handleAddItem('discount')}
							className="h-12 flex-1 rounded-xl bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-400"
						>
							{t('item.addDiscount')}
						</Button>
					</div>
				</CardContent>
			</Card>
			{/* Validation Dialog */}
			<Dialog
				open={showValidationDialog}
				onOpenChange={setShowValidationDialog}
			>
				<DialogContent className="rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-semibold text-slate-900 text-xl">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							{t('item.selectionRequired')}
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-sm">
							{t('item.selectPerson')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setShowValidationDialog(false)}
							className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
						>
							{t('item.ok')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
