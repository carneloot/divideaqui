import { Atom, useAtomValue } from '@effect-atom/atom-react'
import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { selectedGroupAtom } from '../store/atoms'
import type { Person } from '../types'
import { PersonDetailView } from './PersonDetailView'

// Atom for summary calculations (derived from selected group)
const groupCalculationsAtom = Atom.make((get) => {
	const group = get(selectedGroupAtom)
	if (!group) {
		return null
	}

	const totals: Record<string, number> = {}
	const tips: Record<string, number> = {}
	const totalsWithTips: Record<string, number> = {}

	// Initialize all people with 0
	group.people.forEach((person) => {
		totals[person.id] = 0
		tips[person.id] = 0
		totalsWithTips[person.id] = 0
	})

	// Calculate each person's share
	group.items.forEach((item) => {
		const totalValue = item.amount * item.price
		const amount = item.type === 'expense' ? totalValue : -totalValue
		const applicablePeople = item.appliesToEveryone
			? group.people
			: group.people.filter((p) => item.selectedPeople.includes(p.id))

		if (applicablePeople.length === 0) return

		const perPerson = amount / applicablePeople.length
		applicablePeople.forEach((person) => {
			totals[person.id] = (totals[person.id] || 0) + perPerson
		})
	})

	// Calculate totals for validation
	const totalExpenses = group.items
		.filter((item) => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const totalDiscounts = group.items
		.filter((item) => item.type === 'discount')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const netTotal = totalExpenses - totalDiscounts

	// Calculate global tip on net total and split equally among all people
	let totalTipAmount = 0
	let tipPerPerson = 0
	if (
		group.tipPercentage !== undefined &&
		group.tipPercentage !== null &&
		netTotal > 0 &&
		group.people.length > 0
	) {
		totalTipAmount = netTotal * (group.tipPercentage / 100)
		tipPerPerson = totalTipAmount / group.people.length

		// Assign tip to each person
		group.people.forEach((person) => {
			tips[person.id] = tipPerPerson
			totalsWithTips[person.id] = (totals[person.id] || 0) + tipPerPerson
		})
	} else {
		// No tip, so totalsWithTips equals totals
		group.people.forEach((person) => {
			totalsWithTips[person.id] = totals[person.id] || 0
		})
	}

	const sumOfShares = Object.values(totals).reduce((sum, val) => sum + val, 0)
	const sumOfSharesWithTips = Object.values(totalsWithTips).reduce(
		(sum, val) => sum + val,
		0
	)

	return {
		totals,
		tips,
		totalsWithTips,
		totalExpenses,
		totalDiscounts,
		netTotal,
		sumOfShares,
		totalTips: totalTipAmount,
		sumOfSharesWithTips,
		isValid: Math.abs(netTotal - sumOfShares) < 0.01, // Allow small floating point differences
	}
})

export function Summary() {
	const group = useAtomValue(selectedGroupAtom)
	const calculations = useAtomValue(groupCalculationsAtom)
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
	const currencyFormatter = useMemo(
		() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
		[]
	)

	if (!group || !calculations) {
		return null
	}

	return (
		<>
			<Card className="border-none bg-white/90 shadow-lg ring-1 ring-slate-200/60 backdrop-blur">
				<CardHeader className="space-y-1">
					<CardTitle className="text-xl font-semibold text-slate-900">
						Summary
					</CardTitle>
					<p className="text-sm text-slate-500">
						See who owes what, including discounts and tip adjustments.
					</p>
				</CardHeader>
				<CardContent className="space-y-5">
					{group.people.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 py-6 text-center text-sm font-medium text-slate-500">
							Add people to unlock the summary view.
						</p>
					) : group.items.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 py-6 text-center text-sm font-medium text-slate-500">
							Add items to calculate balances for everyone.
						</p>
					) : (
						<>
							<div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-sky-500/10 p-5 ring-1 ring-inset ring-indigo-200/50">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
											Grand total
										</p>
										<p className="mt-2 text-3xl font-semibold text-slate-900">
											{currencyFormatter.format(calculations.sumOfSharesWithTips)}
										</p>
									</div>
									<div className="grid gap-1 text-sm text-slate-600 sm:text-right">
										<span>
											Expenses: {currencyFormatter.format(calculations.totalExpenses)}
										</span>
										<span>
											Discounts: {currencyFormatter.format(calculations.totalDiscounts)}
										</span>
										<span>
											Net before tip: {currencyFormatter.format(calculations.netTotal)}
										</span>
										{calculations.totalTips > 0 && (
											<span>
												Tips added: {currencyFormatter.format(calculations.totalTips)}
											</span>
										)}
									</div>
								</div>
							</div>
							<div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
								<div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-200/80 bg-slate-50 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
									<span>Person</span>
									<span className="text-right">Amount</span>
									<span className="text-right">Details</span>
								</div>
								{[...group.people]
									.sort((a, b) => a.name.localeCompare(b.name))
									.map((person) => {
										const baseTotal = calculations.totals[person.id] || 0
										const tip = calculations.tips[person.id] || 0
										const totalWithTip =
											calculations.totalsWithTips[person.id] || 0
										const hasTip =
											tip > 0 &&
											group.tipPercentage !== undefined &&
											group.tipPercentage !== null

										return (
											<div
												key={person.id}
												className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-slate-200/70 px-4 py-4 text-sm"
											>
												<div className="space-y-1">
													<p className="font-medium text-slate-900">{person.name}</p>
													{hasTip && (
														<p className="text-xs text-slate-500">
															Base {currencyFormatter.format(baseTotal)} · Tip {currencyFormatter.format(tip)}
														</p>
													)}
												</div>
												<div
													className={`text-right text-base font-semibold ${
														totalWithTip >= 0 ? 'text-indigo-600' : 'text-emerald-600'
													}`}
												>
													{currencyFormatter.format(Math.abs(totalWithTip))}
													{totalWithTip < 0 && (
														<span className="ml-1 text-xs uppercase tracking-wide text-emerald-600">
															credit
														</span>
													)}
												</div>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setSelectedPerson(person)}
													aria-label={`View details for ${person.name}`}
													className="h-8 w-8 rounded-full text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
												>
													<Eye className="h-4 w-4" />
												</Button>
											</div>
										)
									})}
							</div>
							{!calculations.isValid && (
								<div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-700">
									⚠️ Calculation mismatch detected. Double-check your item splits.
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
			{selectedPerson && (
				<PersonDetailView
					person={selectedPerson}
					open={!!selectedPerson}
					onOpenChange={(open) => {
						if (!open) {
							setSelectedPerson(null)
						}
					}}
				/>
			)}
		</>
	)
}
