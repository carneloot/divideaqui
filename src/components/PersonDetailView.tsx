import { Atom, useAtomValue } from '@effect-atom/atom-react'
import { Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { useMultiShare } from '@/hooks/useMultiShare'
import { usePlausible } from '@/hooks/usePlausible'
import { selectedGroupAtom } from '../store/expense-groups'
import type { Item, Person } from '../types'

interface PersonDetailViewProps {
	person: Person
	open: boolean
	onOpenChange: (open: boolean) => void
}

interface PersonItemBreakdown {
	item: Item
	applicablePeople: Person[]
	perPerson: number
	totalValue: number
}

interface PersonBreakdown {
	applicableItems: PersonItemBreakdown[]
	baseTotal: number
	tip: number
	totalWithTip: number
	hasTip: boolean
	tipPercentage?: number
	paymentGroupIndex?: number
	paymentGroupTotal?: number
	paymentGroupMembers?: Person[]
}

const personBreakdownAtom = Atom.family((personId: string) =>
	Atom.make<PersonBreakdown | null>((get) => {
		const group = get(selectedGroupAtom)
		if (!group) return null

		const person = group.people.find((p) => p.id === personId)
		if (!person) return null

		const applicableItems = group.items
			.map((item) => {
				const applicablePeople = item.appliesToEveryone
					? group.people
					: group.people.filter((p) => item.selectedPeople.includes(p.id))

				if (!applicablePeople.some((p) => p.id === personId)) {
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
			.filter((entry): entry is PersonItemBreakdown => entry !== null)

		const baseTotal = applicableItems.reduce(
			(sum, entry) => sum + entry.perPerson,
			0
		)

		const tipPercentage = group.tipPercentage
		const hasTip =
			tipPercentage !== undefined && tipPercentage !== null && tipPercentage > 0
		const tip =
			hasTip && baseTotal > 0 && tipPercentage !== undefined
				? baseTotal * (tipPercentage / 100)
				: 0
		const totalWithTip = baseTotal + tip

		// Calculate payment group info
		let paymentGroupIndex: number | undefined
		let paymentGroupMembers: Person[] = []
		let paymentGroupTotal: number | undefined

		const paymentGroups = group.paymentGroups || []
		paymentGroups.forEach((pgIds, index) => {
			if (pgIds.includes(personId)) {
				paymentGroupIndex = index
				paymentGroupMembers = group.people.filter((p) => pgIds.includes(p.id))
				// Calculate total for this payment group
				paymentGroupTotal = pgIds.reduce((sum, memberId) => {
					const memberItems = group.items
						.map((item) => {
							const applicablePeople = item.appliesToEveryone
								? group.people
								: group.people.filter((p) => item.selectedPeople.includes(p.id))

							if (!applicablePeople.some((p) => p.id === memberId)) {
								return 0
							}

							const totalValue = item.amount * item.price
							const amount = item.type === 'expense' ? totalValue : -totalValue
							const perPerson = amount / applicablePeople.length

							return perPerson
						})
						.reduce((itemSum, val) => itemSum + val, 0)

					// Add member's share of tips
					let memberTip = 0
					if (hasTip && memberItems > 0 && tipPercentage !== undefined) {
						memberTip = memberItems * (tipPercentage / 100)
					}

					return sum + memberItems + memberTip
				}, 0)
			}
		})

		return {
			applicableItems,
			baseTotal,
			tip,
			totalWithTip,
			hasTip,
			tipPercentage,
			paymentGroupIndex,
			paymentGroupTotal,
			paymentGroupMembers,
		}
	})
)

export function PersonDetailView({
	person,
	open,
	onOpenChange,
}: PersonDetailViewProps) {
	const { t } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const breakdown = useAtomValue(personBreakdownAtom(person.id))
	const currencyFormatter = useCurrencyFormatter()

	const { share: shareContent } = useMultiShare({
		messages: {
			shareSuccess: t('personDetail.shareSuccess'),
			shareSuccessDescription: t('personDetail.shareSuccessDescription'),
			shareCopied: t('personDetail.shareCopied'),
			shareCopiedDescription: t('personDetail.shareCopiedDescription'),
			shareError: t('personDetail.shareError'),
			shareErrorDescription: t('personDetail.shareErrorDescription'),
		},
	})
	const trackEvent = usePlausible()

	if (!group || !breakdown) {
		return null
	}

	const { applicableItems, baseTotal, tip, totalWithTip } = breakdown

	const generateSummaryText = () => {
		if (!group) return ''

		const lines: string[] = []
		lines.push(t('personDetail.title', { name: person.name }))
		lines.push('')

		if (breakdown?.paymentGroupIndex !== undefined) {
			lines.push(
				`${t('people.paymentGroups.group')} ${breakdown.paymentGroupIndex + 1}`
			)
			lines.push(
				`${t('summary.grandTotal')}: ${currencyFormatter.format(breakdown.paymentGroupTotal || 0)}`
			)
			if (
				breakdown.paymentGroupMembers &&
				breakdown.paymentGroupMembers.length > 1
			) {
				const memberNames = breakdown.paymentGroupMembers
					.map((m) => m.name)
					.join(', ')
				lines.push(`${t('summary.inGroupWith')}: ${memberNames}`)
			}
			lines.push('')
		}

		lines.push(`${t('personDetail.itemsBreakdown')}:`)
		lines.push('')

		applicableItems.forEach(({ item, applicablePeople, perPerson }) => {
			const itemType =
				item.type === 'expense'
					? t('itemsList.expense')
					: t('itemsList.discount')
			const totalValue = item.amount * item.price
			const sharedText = item.appliesToEveryone
				? t('item.everyone')
				: applicablePeople
						.map((p) => (p.id === person.id ? t('personDetail.you') : p.name))
						.sort((a, b) => {
							if (a === t('personDetail.you')) return -1
							if (b === t('personDetail.you')) return 1
							return a.localeCompare(b)
						})
						.join(', ')

			lines.push(`• ${item.name} (${itemType})`)
			lines.push(
				`  ${item.amount} × ${currencyFormatter.format(item.price)} = ${currencyFormatter.format(totalValue)}`
			)
			lines.push(
				`  ${t('personDetail.sharedWith')} ${sharedText} (${t('personDetail.splitAmongPlural', { count: applicablePeople.length })})`
			)
			lines.push(
				`  ${perPerson >= 0 ? '+' : '-'}${currencyFormatter.format(Math.abs(perPerson))}`
			)
			lines.push('')
		})

		lines.push(
			`${t('personDetail.baseTotal')}: ${currencyFormatter.format(Math.abs(baseTotal))}`
		)
		if (baseTotal < 0) {
			lines.push(`  ${t('summary.credit')}`)
		}

		if (tip > 0) {
			lines.push(
				`${t('personDetail.tipLabel', { percentage: group.tipPercentage })}: ${currencyFormatter.format(tip)}`
			)
		}

		lines.push('')
		lines.push(
			`${t('personDetail.totalAmount')}: ${currencyFormatter.format(Math.abs(totalWithTip))}`
		)
		if (totalWithTip < 0) {
			lines.push(`  ${t('summary.credit')}`)
		}

		return lines.join('\n')
	}

	const handleShare = async () => {
		const summaryText = generateSummaryText()

		if (!summaryText) return

		await shareContent({
			text: summaryText,
			title: t('personDetail.title', { name: person.name }),
		})
		trackEvent('data-shared', {
			props: {
				location: 'person-detail',
			},
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border-none bg-card p-0 shadow-2xl ring-1 ring-ring">
				<div className="border-border border-b bg-linear-to-r from-primary/10 via-ring/5 to-accent/10 px-6 py-6">
					<DialogHeader>
						<div className="flex items-center gap-3">
							{applicableItems.length > 0 && (
								<Button
									variant="ghost"
									size="icon"
									onClick={handleShare}
									aria-label={t('personDetail.share')}
									className="h-10 w-10 rounded-xl text-foreground hover:bg-primary/10"
								>
									<Share2 className="h-5 w-5" />
								</Button>
							)}
							<DialogTitle className="font-semibold text-2xl text-foreground">
								{t('personDetail.title', { name: person.name })}
							</DialogTitle>
						</div>
					</DialogHeader>
				</div>
				<div className="space-y-6 px-6 py-6">
					{applicableItems.length === 0 ? (
						<p className="rounded-2xl border border-border border-dashed bg-muted py-8 text-center font-medium text-muted-foreground text-sm">
							{t('personDetail.noItems', { name: person.name })}
						</p>
					) : (
						<>
							<div className="space-y-3">
								<h3 className="font-semibold text-foreground text-lg">
									{t('personDetail.itemsBreakdown')}
								</h3>
								<div className="grid grid-cols-1 gap-4">
									{applicableItems.map(
										({ item, applicablePeople, perPerson }) => (
											<Card
												key={item.id}
												className={`overflow-hidden border-none shadow-md ring-1 ${
													item.type === 'expense'
														? 'bg-linear-to-br from-primary/10 to-primary/20 ring-ring'
														: 'bg-linear-to-br from-accent/50 to-accent/60 ring-accent-foreground'
												}`}
											>
												<CardContent className="relative z-10 space-y-4 px-5 py-5">
													<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
														<div>
															<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.35em]">
																{item.type === 'expense'
																	? t('itemsList.expense')
																	: t('itemsList.discount')}
															</p>
															<h4 className="mt-2 font-semibold text-foreground text-lg">
																{item.name}
															</h4>
															<p className="text-muted-foreground text-sm">
																{item.amount} ×{' '}
																{currencyFormatter.format(item.price)} ={' '}
																{currencyFormatter.format(
																	item.amount * item.price
																)}
															</p>
														</div>
														<div className="text-right">
															<p
																className={`font-semibold text-lg ${
																	perPerson >= 0
																		? 'text-primary'
																		: 'text-accent-foreground'
																}`}
															>
																{perPerson >= 0 ? '+' : '-'}
																{currencyFormatter.format(Math.abs(perPerson))}
															</p>
															<p className="text-muted-foreground text-xs">
																{applicablePeople.length === 1
																	? t('personDetail.splitAmong', { count: 1 })
																	: t('personDetail.splitAmongPlural', {
																			count: applicablePeople.length,
																		})}
															</p>
														</div>
													</div>
													{applicablePeople.length > 1 && (
														<div className="flex flex-wrap gap-2 rounded-xl bg-muted px-3 py-2 text-muted-foreground text-xs">
															<span className="font-medium text-foreground">
																{t('personDetail.sharedWith')}
															</span>
															{item.appliesToEveryone
																? t('item.everyone')
																: applicablePeople
																		.map((p) =>
																			p.id === person.id
																				? t('personDetail.you')
																				: p.name
																		)
																		.sort((a, b) => {
																			if (a === t('personDetail.you')) return -1
																			if (b === t('personDetail.you')) return 1
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
							</div>
							<div className="rounded-2xl border border-border bg-muted px-5 py-5">
								<div className="flex justify-between text-muted-foreground text-sm">
									<span>{t('personDetail.baseTotal')}</span>
									<span className="font-semibold text-foreground">
										{currencyFormatter.format(Math.abs(baseTotal))}
										{baseTotal < 0 && (
											<span className="ml-1 text-emerald-600 text-xs uppercase">
												{t('summary.credit')}
											</span>
										)}
									</span>
								</div>
								{tip > 0 && (
									<div className="flex justify-between text-muted-foreground text-sm">
										<span>
											{t('personDetail.tipLabel', {
												percentage: group.tipPercentage,
											})}
										</span>
										<span className="font-semibold text-foreground">
											{currencyFormatter.format(tip)}
										</span>
									</div>
								)}
								<div className="mt-4 flex items-center justify-between border-border border-t pt-4">
									<span className="font-semibold text-base text-foreground">
										{t('personDetail.totalAmount')}
									</span>
									<span
										className={`font-semibold text-xl ${
											totalWithTip >= 0 ? 'text-primary' : 'text-emerald-600'
										}`}
									>
										{currencyFormatter.format(Math.abs(totalWithTip))}
										{totalWithTip < 0 && (
											<span className="ml-1 text-xs uppercase">
												{t('summary.credit')}
											</span>
										)}
									</span>
								</div>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
