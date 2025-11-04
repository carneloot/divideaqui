import {
	Atom,
	useAtom,
	useAtomSet,
	useAtomValue,
} from '@effect-atom/atom-react'
import { Eye, QrCode, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { useMultiShare } from '@/hooks/useMultiShare'
import { usePlausible } from '@/hooks/usePlausible'
import { summaryAccordionStateAtom } from '../store/accordion'
import { selectedGroupAtom } from '../store/expense-groups'
import { currencyAtom, pixKeyAtom } from '../store/settings'
import type { Person } from '../types'
import { PersonDetailView } from './PersonDetailView'
import { PixExportDialog } from './PixExportDialog'

const groupCalculationsAtom = Atom.make((get) => {
	const group = get(selectedGroupAtom)
	if (!group) {
		return null
	}

	const totals: Record<string, number> = {}
	const tips: Record<string, number> = {}
	const totalsWithTips: Record<string, number> = {}
	const groupedTotals: Record<string, number> = {}
	const groupedTips: Record<string, number> = {}
	const groupedTotalsWithTips: Record<string, number> = {}

	// Initialize all people with 0
	group.people.forEach((person) => {
		totals[person.id] = 0
		tips[person.id] = 0
		totalsWithTips[person.id] = 0
		groupedTotals[person.id] = 0
		groupedTips[person.id] = 0
		groupedTotalsWithTips[person.id] = 0
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

	// Calculate grouped totals based on payment groups
	const paymentGroups = group.paymentGroups || []

	// Build a map of person ID to their payment group
	const personToGroupMap: Record<string, string[]> = {}
	paymentGroups.forEach((paymentGroup) => {
		paymentGroup.forEach((personId: string) => {
			personToGroupMap[personId] = paymentGroup as string[]
		})
	})

	group.people.forEach((person) => {
		// Start with their own total
		groupedTotals[person.id] = totals[person.id] || 0

		// If person is in a payment group, add totals of all other group members
		const paymentGroup = personToGroupMap[person.id]
		if (paymentGroup) {
			paymentGroup.forEach((memberId: string) => {
				if (memberId !== person.id) {
					const memberTotal = totals[memberId] || 0
					groupedTotals[person.id] =
						(groupedTotals[person.id] || 0) + memberTotal
				}
			})
		}
	})

	// Calculate totals for validation
	const totalExpenses = group.items
		.filter((item) => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const totalDiscounts = group.items
		.filter((item) => item.type === 'discount')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const netTotal = totalExpenses - totalDiscounts

	// Calculate tip as a percentage of each person's individual total
	let totalTipAmount = 0
	if (
		group.tipPercentage !== undefined &&
		group.tipPercentage !== null &&
		group.tipPercentage > 0 &&
		netTotal > 0 &&
		group.people.length > 0
	) {
		// Calculate tip for each person based on their individual total
		group.people.forEach((person) => {
			const personTotal = totals[person.id] || 0
			// Only calculate tip on positive amounts (expenses)
			if (personTotal > 0) {
				// biome-ignore lint/style/noNonNullAssertion: this is safe because we check for tipPercentage above
				tips[person.id] = personTotal * (group.tipPercentage! / 100)
				totalsWithTips[person.id] = personTotal + tips[person.id]
			} else {
				tips[person.id] = 0
				totalsWithTips[person.id] = personTotal
			}
		})

		// Calculate grouped tips (tip on individual total + tips of all group members)
		group.people.forEach((person) => {
			const personTip = tips[person.id] || 0
			groupedTips[person.id] = personTip

			// Add tips of all other members in the payment group
			const paymentGroup = personToGroupMap[person.id]
			if (paymentGroup) {
				paymentGroup.forEach((memberId: string) => {
					if (memberId !== person.id) {
						const memberTip = tips[memberId] || 0
						groupedTips[person.id] = (groupedTips[person.id] || 0) + memberTip
					}
				})
			}

			groupedTotalsWithTips[person.id] =
				groupedTotals[person.id] + groupedTips[person.id]
		})

		// Calculate total tip amount for display
		totalTipAmount = Object.values(tips).reduce((sum, val) => sum + val, 0)
	} else {
		// No tip, so totalsWithTips equals totals
		group.people.forEach((person) => {
			totalsWithTips[person.id] = totals[person.id] || 0
			groupedTotalsWithTips[person.id] = groupedTotals[person.id] || 0
		})
	}

	const sumOfShares = Object.values(totals).reduce((sum, val) => sum + val, 0)
	const sumOfSharesWithTips = Object.values(totalsWithTips).reduce(
		(sum, val) => sum + val,
		0
	)

	// Build a map of person to their group members (for display)
	const personGroupMembers: Record<string, string[]> = {}
	group.people.forEach((person) => {
		const paymentGroup = personToGroupMap[person.id]
		if (paymentGroup) {
			// Get all other members in the group
			personGroupMembers[person.id] = paymentGroup.filter(
				(id: string) => id !== person.id
			)
		} else {
			personGroupMembers[person.id] = []
		}
	})

	return {
		totals,
		tips,
		totalsWithTips,
		groupedTotals,
		groupedTips,
		groupedTotalsWithTips,
		personGroupMembers,
		paymentGroups,
		totalExpenses,
		totalDiscounts,
		netTotal,
		sumOfShares,
		totalTips: totalTipAmount,
		sumOfSharesWithTips,
		isValid: Math.abs(netTotal - sumOfShares) < 0.01, // Allow small floating point differences
	}
})

const personRowItemAtom = Atom.family((personId: string) =>
	Atom.make((get) => {
		const group = get(selectedGroupAtom)
		if (!group) return null

		const person = group.people.find((p) => p.id === personId)
		if (!person) return null

		const calculations = get(groupCalculationsAtom)
		if (!calculations) return null

		const baseTotal = calculations.totals[person.id] || 0
		const tip = calculations.tips[person.id] || 0
		const totalWithTip = calculations.totalsWithTips[person.id] || 0
		const groupedTotalWithTip =
			calculations.groupedTotalsWithTips[person.id] || 0
		const hasTip =
			tip > 0 &&
			group.tipPercentage !== undefined &&
			group.tipPercentage !== null &&
			group.tipPercentage > 0

		// Check if person is in a payment group
		const groupMembers = calculations.personGroupMembers[person.id] || []
		const hasPaymentGroup = groupMembers.length > 0
		const hasGroupedTotal = groupedTotalWithTip !== totalWithTip

		// Get names of group members
		const memberNames = groupMembers
			.map((id: string) => group.people.find((p) => p.id === id)?.name)
			.filter(Boolean) as string[]

		return {
			baseTotal,
			hasTip,
			tip,
			hasPaymentGroup,
			memberNames,
			totalWithTip,
			groupedTotalWithTip,
			hasGroupedTotal,
		}
	})
)

function PersonRowItem({ person }: { person: Person }) {
	const { t } = useTranslation()
	const breakdown = useAtomValue(personRowItemAtom(person.id))
	const pixKey = useAtomValue(pixKeyAtom)
	const currency = useAtomValue(currencyAtom)

	const setShowPixError = useAtomSet(showPixErrorAtom)
	const setPixPerson = useAtomSet(pixPersonAtom)
	const setSelectedPerson = useAtomSet(selectedPersonAtom)

	const currencyFormatter = useCurrencyFormatter()

	const handlePixClick = (person: Person, amount: number) => {
		if (!pixKey) {
			setShowPixError(true)
			return
		}
		setPixPerson({ person, amount })
	}

	if (!breakdown) {
		return null
	}

	return (
		<div
			key={person.id}
			className="grid grid-cols-[minmax(0,1fr)_auto] grid-rows-2 gap-2 border-border border-t px-4 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-rows-1 sm:items-center sm:gap-3"
		>
			<div className="flex-1 space-y-1">
				<p className="font-medium text-foreground">{person.name}</p>
				{breakdown.hasTip && (
					<p className="text-muted-foreground text-xs">
						{t('summary.base')} {currencyFormatter.format(breakdown.baseTotal)}{' '}
						· {t('summary.tip')} {currencyFormatter.format(breakdown.tip)}
					</p>
				)}
				{breakdown.hasPaymentGroup && (
					<p className="wrap-break-words text-muted-foreground text-xs">
						{t('summary.inGroupWith')}:{' '}
						<span className="font-medium">
							{breakdown.memberNames.join(', ')}
						</span>
					</p>
				)}
			</div>
			<div className="row-start-2 flex items-center justify-between gap-4 sm:row-auto sm:flex-col sm:items-end sm:justify-center sm:gap-1">
				<div className="flex-1 space-y-1 sm:flex-none sm:text-right">
					<div
						className={`font-semibold text-base ${
							breakdown.totalWithTip >= 0 ? 'text-primary' : 'text-emerald-600'
						}`}
					>
						{currencyFormatter.format(Math.abs(breakdown.totalWithTip))}
						{breakdown.totalWithTip < 0 && (
							<span className="ml-1 text-emerald-600 text-xs uppercase tracking-wide">
								{t('summary.credit')}
							</span>
						)}
					</div>
					{breakdown.hasGroupedTotal && (
						<div className="wrap-break-words text-muted-foreground text-xs sm:text-right">
							{t('summary.groupedTotal')}:{' '}
							<span className="font-semibold">
								{currencyFormatter.format(
									Math.abs(breakdown.groupedTotalWithTip)
								)}
							</span>
						</div>
					)}
				</div>
			</div>
			<div className="col-start-2 row-span-2 flex shrink-0 flex-col items-center justify-center sm:col-auto sm:row-auto sm:flex-row sm:gap-1">
				{breakdown.groupedTotalWithTip > 0 && currency === 'BRL' && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() =>
							handlePixClick(person, breakdown.groupedTotalWithTip)
						}
						aria-label={t('summary.generatePix', {
							name: person.name,
						})}
						className="h-8 w-8 rounded-full text-muted-foreground transition hover:bg-accent hover:text-emerald-600"
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
					className="h-8 w-8 rounded-full text-muted-foreground transition hover:bg-accent hover:text-primary"
				>
					<Eye className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}

// Local atoms for PersonRowsList component
const selectedPersonAtom = Atom.make<Person | null>(null)
const pixPersonAtom = Atom.make<{ person: Person; amount: number } | null>(null)
const showPixErrorAtom = Atom.make(false)

function PersonRowsList() {
	const { t } = useTranslation()
	const [selectedPerson, setSelectedPerson] = useAtom(selectedPersonAtom)
	const [pixPerson, setPixPerson] = useAtom(pixPersonAtom)
	const [showPixError, setShowPixError] = useAtom(showPixErrorAtom)
	const group = useAtomValue(selectedGroupAtom)
	const calculations = useAtomValue(groupCalculationsAtom)

	if (!group || !calculations) {
		return null
	}

	return (
		<>
			<div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
				<div className="hidden border-border border-b bg-muted px-4 py-3 font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.35em] sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3">
					<span>{t('summary.person')}</span>
					<span className="text-right">{t('summary.amount')}</span>
					<span className="text-right">{t('summary.actions')}</span>
				</div>
				{[...group.people]
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((person) => (
						<PersonRowItem person={person} key={person.id} />
					))}
			</div>
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
				<DialogContent className="rounded-xl border-none bg-card shadow-xl ring-1 ring-ring backdrop-blur sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="font-semibold text-foreground text-xl">
							{t('pix.keyNotSet')}
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-sm">
							{t('pix.configurePixKey')}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Button
							onClick={() => setShowPixError(false)}
							className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{t('item.ok')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

export function Summary() {
	const { t } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const calculations = useAtomValue(groupCalculationsAtom)
	const [isAccordionOpen, setIsAccordionOpen] = useAtom(
		summaryAccordionStateAtom
	)

	const currencyFormatter = useCurrencyFormatter()

	const { share: shareContent } = useMultiShare({
		messages: {
			shareSuccess: t('summary.shareSuccess'),
			shareSuccessDescription: t('summary.shareSuccessDescription'),
			shareCopied: t('summary.shareCopied'),
			shareCopiedDescription: t('summary.shareCopiedDescription'),
			shareError: t('summary.shareError'),
			shareErrorDescription: t('summary.shareErrorDescription'),
		},
	})
	const trackEvent = usePlausible()

	const generateSummaryText = () => {
		if (!group || !calculations) return ''

		const lines: string[] = []
		lines.push(group.name || t('summary.title'))
		lines.push('')
		lines.push(
			t('summary.grandTotal') +
				': ' +
				currencyFormatter.format(calculations.sumOfSharesWithTips)
		)
		lines.push('')
		lines.push(
			t('summary.expenses') +
				': ' +
				currencyFormatter.format(calculations.totalExpenses)
		)
		lines.push(
			t('summary.discounts') +
				': ' +
				currencyFormatter.format(calculations.totalDiscounts)
		)

		if (calculations.totalTips > 0) {
			lines.push(
				t('summary.netBeforeTip') +
					': ' +
					currencyFormatter.format(calculations.netTotal)
			)
			lines.push(
				t('summary.tipsAdded') +
					': ' +
					currencyFormatter.format(calculations.totalTips)
			)
		}

		lines.push('')
		lines.push(t('itemsList.title'))
		lines.push('─'.repeat(30))
		group.items.forEach((item) => {
			const itemType =
				item.type === 'expense'
					? t('itemsList.expense')
					: t('itemsList.discount')
			lines.push(
				`${item.name} (${itemType}): ${currencyFormatter.format(item.price)}`
			)
		})

		lines.push('')
		lines.push(`${t('summary.person')} | ${t('summary.amount')}`)
		lines.push('─'.repeat(30))

		const sortedPeople = [...group.people].sort((a, b) =>
			a.name.localeCompare(b.name)
		)

		sortedPeople.forEach((person) => {
			const baseTotal = calculations.totals[person.id] || 0
			const tip = calculations.tips[person.id] || 0
			const totalWithTip = calculations.totalsWithTips[person.id] || 0
			const hasTip =
				tip > 0 &&
				group.tipPercentage !== undefined &&
				group.tipPercentage !== null &&
				group.tipPercentage > 0

			let personLine = `${person.name}: ${currencyFormatter.format(Math.abs(totalWithTip))}`
			if (totalWithTip < 0) {
				personLine += ` (${t('summary.credit')})`
			}
			if (hasTip) {
				personLine += ` [${t('summary.base')}: ${currencyFormatter.format(baseTotal)}, ${t('summary.tip')}: ${currencyFormatter.format(tip)}]`
			}
			lines.push(personLine)
		})

		if (!calculations.isValid) {
			lines.push('')
			lines.push(`⚠️ ${t('summary.calculationMismatch')}`)
		}

		return lines.join('\n')
	}

	const handleShare = async () => {
		const summaryText = generateSummaryText()
		if (!summaryText) return

		await shareContent({
			text: summaryText,
			title: group?.name || t('summary.title'),
		})
		trackEvent('data-shared', {
			props: {
				location: 'summary',
			},
		})
	}

	if (!group || !calculations) {
		return null
	}

	return (
		<Card className="border-none bg-card shadow-lg ring-1 ring-ring backdrop-blur">
			<Accordion
				type="single"
				collapsible
				value={isAccordionOpen}
				onValueChange={setIsAccordionOpen}
				className="w-full"
			>
				<AccordionItem value="summary" className="border-none">
					<CardHeader className="space-y-1">
						<AccordionTrigger className="group py-0 hover:no-underline">
							<div className="text-left">
								<CardTitle className="font-semibold text-foreground text-xl">
									{t('summary.title')}
								</CardTitle>
								<p className="text-muted-foreground text-sm">
									{t('summary.subtitle')}
								</p>
							</div>
						</AccordionTrigger>
					</CardHeader>
					<AccordionContent className="px-6 pb-6">
						<CardContent className="space-y-5 p-0">
							{group.people.length === 0 ? (
								<p className="rounded-2xl border border-border border-dashed bg-muted py-6 text-center font-medium text-muted-foreground text-sm">
									{t('summary.addPeople')}
								</p>
							) : group.items.length === 0 ? (
								<p className="rounded-2xl border border-border border-dashed bg-muted py-6 text-center font-medium text-muted-foreground text-sm">
									{t('summary.addItems')}
								</p>
							) : (
								<>
									<div className="rounded-2xl bg-linear-to-r from-primary/10 via-ring/5 to-background/50 p-5 ring-1 ring-ring/50 ring-inset">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="min-w-0 flex-1">
												<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.35em]">
													{t('summary.grandTotal')}
												</p>
												<p className="wrap-break-words mt-2 font-semibold text-3xl text-foreground">
													{currencyFormatter.format(
														calculations.sumOfSharesWithTips
													)}
												</p>
											</div>
											<div className="grid gap-1 text-muted-foreground text-sm sm:min-w-0 sm:shrink-0 sm:text-right">
												<span>
													{t('summary.expenses')}:{' '}
													{currencyFormatter.format(calculations.totalExpenses)}
												</span>
												<span>
													{t('summary.discounts')}:{' '}
													{currencyFormatter.format(
														calculations.totalDiscounts
													)}
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
									<PersonRowsList />
									<div className="flex justify-end">
										{group.people.length > 0 && group.items.length > 0 && (
											<Button
												variant="outline"
												onClick={(e) => {
													e.stopPropagation()
													handleShare()
												}}
												aria-label={t('summary.share')}
												className="rounded-xl text-foreground hover:bg-primary/10"
											>
												<Share2 className="h-5 w-5" />
												{t('summary.share')}
											</Button>
										)}
									</div>
									{!calculations.isValid && (
										<div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 font-medium text-amber-700 text-sm">
											⚠️ {t('summary.calculationMismatch')}
										</div>
									)}
								</>
							)}
						</CardContent>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</Card>
	)
}
