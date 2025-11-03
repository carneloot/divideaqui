import { useAtomValue } from '@effect-atom/atom-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { currencyAtom, selectedGroupAtom } from '../store/atoms'
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
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const currency = useAtomValue(currencyAtom)
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)

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
		group.tipPercentage > 0 &&
		netTotal > 0 &&
		group.people.length > 0
	) {
		const totalTipAmount = netTotal * (group.tipPercentage / 100)
		tip = totalTipAmount / group.people.length
	}

	const totalWithTip = baseTotal + tip

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border-none bg-white/95 p-0 shadow-2xl ring-1 ring-slate-200/70">
				<div className="border-slate-200/70 border-b bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-sky-500/10 px-6 py-6">
					<DialogHeader>
						<DialogTitle className="font-semibold text-2xl text-slate-900">
							{t('personDetail.title', { name: person.name })}
						</DialogTitle>
					</DialogHeader>
				</div>
				<div className="space-y-6 px-6 py-6">
					{applicableItems.length === 0 ? (
						<p className="rounded-2xl border border-slate-300 border-dashed bg-slate-50/80 py-8 text-center font-medium text-slate-500 text-sm">
							{t('personDetail.noItems', { name: person.name })}
						</p>
					) : (
						<>
							<div className="space-y-3">
								<h3 className="font-semibold text-lg text-slate-900">
									{t('personDetail.itemsBreakdown')}
								</h3>
								<div className="grid grid-cols-1 gap-4">
									{applicableItems.map(
										({ item, applicablePeople, perPerson }) => (
											<Card
												key={item.id}
												className={`overflow-hidden border-none shadow-md ring-1 ring-slate-200/60 ${
													item.type === 'expense'
														? 'bg-linear-to-br from-white via-indigo-50 to-indigo-100/60'
														: 'bg-linear-to-br from-white via-emerald-50 to-emerald-100/60'
												}`}
											>
												<CardContent className="relative z-10 space-y-4 px-5 py-5">
													<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
														<div>
															<p className="font-semibold text-slate-500 text-xs uppercase tracking-[0.35em]">
																{item.type === 'expense'
																	? t('itemsList.expense')
																	: t('itemsList.discount')}
															</p>
															<h4 className="mt-2 font-semibold text-lg text-slate-900">
																{item.name}
															</h4>
															<p className="text-slate-600 text-sm">
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
																		? 'text-indigo-600'
																		: 'text-emerald-600'
																}`}
															>
																{perPerson >= 0 ? '+' : '-'}
																{currencyFormatter.format(Math.abs(perPerson))}
															</p>
															<p className="text-slate-500 text-xs">
																{applicablePeople.length === 1
																	? t('personDetail.splitAmong', { count: 1 })
																	: t('personDetail.splitAmongPlural', {
																			count: applicablePeople.length,
																		})}
															</p>
														</div>
													</div>
													{applicablePeople.length > 1 && (
														<div className="flex flex-wrap gap-2 rounded-xl bg-white/70 px-3 py-2 text-slate-500 text-xs">
															<span className="font-medium text-slate-600">
																{t('personDetail.sharedWith')}
															</span>
															{applicablePeople
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
							<div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-5 py-5">
								<div className="flex justify-between text-slate-600 text-sm">
									<span>{t('personDetail.baseTotal')}</span>
									<span className="font-semibold text-slate-900">
										{currencyFormatter.format(Math.abs(baseTotal))}
										{baseTotal < 0 && (
											<span className="ml-1 text-emerald-600 text-xs uppercase">
												{t('summary.credit')}
											</span>
										)}
									</span>
								</div>
								{tip > 0 && (
									<div className="flex justify-between text-slate-600 text-sm">
										<span>
											{t('personDetail.tipLabel', {
												percentage: group.tipPercentage,
											})}
										</span>
										<span className="font-semibold text-slate-900">
											{currencyFormatter.format(tip)}
										</span>
									</div>
								)}
								<div className="mt-4 flex items-center justify-between border-slate-200/70 border-t pt-4">
									<span className="font-semibold text-base text-slate-900">
										{t('personDetail.totalAmount')}
									</span>
									<span
										className={`font-semibold text-xl ${
											totalWithTip >= 0 ? 'text-indigo-600' : 'text-emerald-600'
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
