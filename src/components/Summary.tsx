import { Atom, useAtomValue } from '@effect-atom/atom-react'
import { Eye, QrCode } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { currencyAtom, pixKeyAtom, selectedGroupAtom } from '../store/atoms'
import type { Person } from '../types'
import { PersonDetailView } from './PersonDetailView'
import { PixExportDialog } from './PixExportDialog'

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
		group.tipPercentage > 0 &&
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
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const calculations = useAtomValue(groupCalculationsAtom)
	const currency = useAtomValue(currencyAtom)
	const pixKey = useAtomValue(pixKeyAtom)
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
	const [pixPerson, setPixPerson] = useState<{
		person: Person
		amount: number
	} | null>(null)
	const [showPixError, setShowPixError] = useState(false)
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)

	const handlePixClick = (person: Person, amount: number) => {
		if (!pixKey) {
			setShowPixError(true)
			return
		}
		setPixPerson({ person, amount })
	}

	if (!group || !calculations) {
		return null
	}

	return (
		<>
			<Card className="border-none bg-white/90 shadow-lg ring-1 ring-slate-200/60 backdrop-blur">
				<CardHeader className="space-y-1">
					<CardTitle className="font-semibold text-slate-900 text-xl">
						{t('summary.title')}
					</CardTitle>
					<p className="text-slate-500 text-sm">{t('summary.subtitle')}</p>
				</CardHeader>
				<CardContent className="space-y-5">
					{group.people.length === 0 ? (
						<p className="rounded-2xl border border-slate-300 border-dashed bg-slate-50/80 py-6 text-center font-medium text-slate-500 text-sm">
							{t('summary.addPeople')}
						</p>
					) : group.items.length === 0 ? (
						<p className="rounded-2xl border border-slate-300 border-dashed bg-slate-50/80 py-6 text-center font-medium text-slate-500 text-sm">
							{t('summary.addItems')}
						</p>
					) : (
						<>
							<div className="rounded-2xl bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-sky-500/10 p-5 ring-1 ring-indigo-200/50 ring-inset">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
									<div>
										<p className="font-semibold text-slate-500 text-xs uppercase tracking-[0.35em]">
											{t('summary.grandTotal')}
										</p>
										<p className="mt-2 font-semibold text-3xl text-slate-900">
											{currencyFormatter.format(
												calculations.sumOfSharesWithTips
											)}
										</p>
									</div>
									<div className="grid gap-1 text-slate-600 text-sm sm:text-right">
										<span>
											{t('summary.expenses')}:{' '}
											{currencyFormatter.format(calculations.totalExpenses)}
										</span>
										<span>
											{t('summary.discounts')}:{' '}
											{currencyFormatter.format(calculations.totalDiscounts)}
										</span>
										{calculations.totalTips > 0 && (
											<>
												<span>
													{t('summary.netBeforeTip')}:{' '}
													{currencyFormatter.format(calculations.netTotal)}
												</span>
												<span>
													{t('summary.tipsAdded')}:{' '}
													{currencyFormatter.format(calculations.totalTips)}
												</span>
											</>
										)}
									</div>
								</div>
							</div>
							<div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
								<div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 border-slate-200/80 border-b bg-slate-50 px-4 py-3 font-semibold text-[0.68rem] text-slate-500 uppercase tracking-[0.35em]">
									<span>{t('summary.person')}</span>
									<span className="text-right">{t('summary.amount')}</span>
									<span className="text-right">{t('summary.actions')}</span>
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
											group.tipPercentage !== null &&
											group.tipPercentage > 0

										return (
											<div
												key={person.id}
												className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 border-slate-200/70 border-t px-4 py-4 text-sm"
											>
												<div className="space-y-1">
													<p className="font-medium text-slate-900">
														{person.name}
													</p>
													{hasTip && (
														<p className="text-slate-500 text-xs">
															{t('summary.base')}{' '}
															{currencyFormatter.format(baseTotal)} ·{' '}
															{t('summary.tip')} {currencyFormatter.format(tip)}
														</p>
													)}
												</div>
												<div
													className={`text-right font-semibold text-base ${
														totalWithTip >= 0
															? 'text-indigo-600'
															: 'text-emerald-600'
													}`}
												>
													{currencyFormatter.format(Math.abs(totalWithTip))}
													{totalWithTip < 0 && (
														<span className="ml-1 text-emerald-600 text-xs uppercase tracking-wide">
															{t('summary.credit')}
														</span>
													)}
												</div>
												<div className="flex items-center gap-1">
													{totalWithTip > 0 && currency === 'BRL' && (
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																handlePixClick(person, totalWithTip)
															}
															aria-label={t('summary.generatePix', {
																name: person.name,
															})}
															className="h-8 w-8 rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
														>
															<QrCode className="h-4 w-4" />
														</Button>
													)}
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setSelectedPerson(person)}
														aria-label={t('summary.viewDetails', {
															name: person.name,
														})}
														className="h-8 w-8 rounded-full text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
													>
														<Eye className="h-4 w-4" />
													</Button>
												</div>
											</div>
										)
									})}
							</div>
							{!calculations.isValid && (
								<div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 font-medium text-amber-700 text-sm">
									⚠️ {t('summary.calculationMismatch')}
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
			{pixPerson && (
				<PixExportDialog
					person={pixPerson.person}
					amount={pixPerson.amount}
					open={!!pixPerson}
					onOpenChange={(open) => {
						if (!open) {
							setPixPerson(null)
						}
					}}
				/>
			)}
			<Dialog open={showPixError} onOpenChange={setShowPixError}>
				<DialogContent className="rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="font-semibold text-slate-900 text-xl">
							{t('pix.keyNotSet')}
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-sm">
							{t('pix.configurePixKey')}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Button
							onClick={() => setShowPixError(false)}
							className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
						>
							{t('item.ok')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
