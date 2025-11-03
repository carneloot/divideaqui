import { useAtomValue } from '@effect-atom/atom-react'
import { Card, CardContent } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { selectedGroupAtom } from '../store/atoms'
import type { Person } from '../types'

interface PersonDetailViewProps {
	person: Person
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function PersonDetailView({
	person,
	open,
	onOpenChange,
}: PersonDetailViewProps) {
	const group = useAtomValue(selectedGroupAtom)

	if (!group) {
		return null
	}

	// Calculate items that apply to this person
	const applicableItems = group.items
		.map((item) => {
			const applicablePeople = item.appliesToEveryone
				? group.people
				: group.people.filter((p) => item.selectedPeople.includes(p.id))

			// Check if this person is in the applicable people
			if (!applicablePeople.find((p) => p.id === person.id)) {
				return null
			}

			const totalValue = item.amount * item.price
			const amount = item.type === 'expense' ? totalValue : -totalValue
			const perPerson = amount / applicablePeople.length

			return {
				item,
				applicablePeople,
				perPerson,
				totalValue,
			}
		})
		.filter((result): result is NonNullable<typeof result> => result !== null)

	// Calculate totals
	const baseTotal = applicableItems.reduce(
		(sum, { perPerson }) => sum + perPerson,
		0
	)

	// Calculate tip
	const totalExpenses = group.items
		.filter((item) => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const totalDiscounts = group.items
		.filter((item) => item.type === 'discount')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const netTotal = totalExpenses - totalDiscounts

	let tip = 0
	if (
		group.tipPercentage !== undefined &&
		group.tipPercentage !== null &&
		netTotal > 0 &&
		group.people.length > 0
	) {
		const totalTipAmount = netTotal * (group.tipPercentage / 100)
		tip = totalTipAmount / group.people.length
	}

	const totalWithTip = baseTotal + tip

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{person.name}'s Cost Breakdown
					</DialogTitle>
				</DialogHeader>
				<div className="pt-6">
					{applicableItems.length === 0 ? (
						<p className="text-muted-foreground text-center py-8 italic">
							No items apply to {person.name} yet.
						</p>
					) : (
						<div className="space-y-6">
							{/* Items Breakdown */}
							<div className="space-y-3">
								<h3 className="font-semibold text-lg mb-4">Items Breakdown</h3>
								{applicableItems.map(
									({ item, applicablePeople, perPerson }) => (
										<Card
											key={item.id}
											className={
												item.type === 'expense'
													? 'border-l-4 border-l-blue-500'
													: 'border-l-4 border-l-green-500'
											}
										>
											<CardContent className="pt-4">
												<div className="flex items-start justify-between mb-2">
													<div className="flex-1">
														<h4 className="font-semibold">{item.name}</h4>
														<div className="text-sm text-muted-foreground mt-1">
															{item.amount} × ${item.price.toFixed(2)} = $
															{(item.amount * item.price).toFixed(2)}
															{item.type === 'expense'
																? ' (expense)'
																: ' (discount)'}
														</div>
													</div>
													<div className="text-right">
														<div
															className={`text-lg font-semibold ${
																perPerson >= 0
																	? 'text-blue-600'
																	: 'text-green-600'
															}`}
														>
															{perPerson >= 0 ? '+' : ''}$
															{Math.abs(perPerson).toFixed(2)}
														</div>
														<div className="text-xs text-muted-foreground">
															Split among {applicablePeople.length} person
															{applicablePeople.length !== 1 ? 's' : ''}
														</div>
													</div>
												</div>
												{applicablePeople.length > 1 && (
													<div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
														Shared with:{' '}
														{applicablePeople
															.map((p) => (p.id === person.id ? 'you' : p.name))
															.sort((a, b) => {
																// Put "you" first
																if (a === 'you') return -1
																if (b === 'you') return 1
																return a.localeCompare(b)
															})
															.join(', ')}
													</div>
												)}
											</CardContent>
										</Card>
									)
								)}
							</div>

							{/* Summary */}
							<div className="space-y-2 p-4 bg-muted rounded-md border-t pt-6">
								<div className="flex justify-between">
									<span>Base Total (items):</span>
									<span className="font-semibold">
										${Math.abs(baseTotal).toFixed(2)}
										{baseTotal < 0 && ' (credit)'}
									</span>
								</div>
								{tip > 0 && (
									<div className="flex justify-between">
										<span>Tip ({group.tipPercentage}%):</span>
										<span className="font-semibold">${tip.toFixed(2)}</span>
									</div>
								)}
								<div className="flex justify-between pt-2 border-t font-bold text-lg">
									<span>Total Amount:</span>
									<span
										className={
											totalWithTip >= 0 ? 'text-blue-600' : 'text-green-600'
										}
									>
										${Math.abs(totalWithTip).toFixed(2)}
										{totalWithTip < 0 && ' (credit)'}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
