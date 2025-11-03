import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { Percent, PiggyBank, Receipt, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
	currencyAtom,
	deleteGroupAtom,
	selectedGroupAtom,
	updateGroupAtom,
} from '../store/atoms'
import { ItemForm } from './ItemForm'
import { ItemsList } from './ItemsList'
import { PeopleManager } from './PeopleManager'
import { Summary } from './Summary'

export function GroupManager() {
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const deleteGroup = useAtomSet(deleteGroupAtom)
	const updateGroup = useAtomSet(updateGroupAtom)

	const [groupName, setGroupName] = useState(group?.name || '')
	const [tipPercentage, setTipPercentage] = useState(
		group?.tipPercentage?.toString() || ''
	)
	const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
	const currency = useAtomValue(currencyAtom)
	const currencyFormatter = useMemo(
		() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, { style: 'currency', currency }),
		[currency, i18n.language]
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
		const tipValue = tipPercentage.trim() === '' ? 0 : parseFloat(tipPercentage)
		updateGroup({
			id: group.id,
			tipPercentage:
				tipValue !== undefined && !Number.isNaN(tipValue) && tipValue >= 0
					? tipValue
					: 0,
		})
	}

	const totalExpenses = group.items
		.filter((item) => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const totalDiscounts = group.items
		.filter((item) => item.type === 'discount')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const netTotal = totalExpenses - totalDiscounts
	const totalTipAmount =
		group.tipPercentage !== undefined &&
		group.tipPercentage !== null &&
		netTotal > 0
			? (netTotal * group.tipPercentage) / 100
			: 0

	const stats = [
		{
			label: t('stats.people'),
			value: group.people.length.toString(),
			icon: Users,
		},
		{
			label: t('stats.itemsTracked'),
			value: group.items.length.toString(),
			icon: Receipt,
		},
		{
			label: t('stats.netTotal'),
			value: currencyFormatter.format(netTotal),
			icon: PiggyBank,
		},
		{
			label: t('stats.tipSetting'),
			value:
				group.tipPercentage !== undefined && group.tipPercentage !== null
					? `${group.tipPercentage}% · ${currencyFormatter.format(totalTipAmount)}`
					: t('stats.noTip'),
			icon: Percent,
		},
	]

	return (
		<Card className="overflow-hidden border-none bg-white/95 shadow-2xl ring-1 ring-slate-200/70 backdrop-blur">
			<div className="relative overflow-hidden border-b border-white/10 bg-linear-to-br from-indigo-500 via-purple-500 to-sky-500">
				<div className="absolute -left-16 -top-32 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
				<div className="absolute -right-20 top-12 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
				<div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
					<div className="w-full max-w-xl space-y-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
								{t('group.name')}
							</p>
							<Input
								type="text"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								onBlur={handleUpdateName}
								onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
								className="mt-2 h-14 rounded-xl border border-white/20 bg-white/15 px-5 text-lg font-semibold text-white placeholder:text-white/50 focus-visible:ring-white/60"
								placeholder={t('group.placeholder')}
							/>
						</div>
						<p className="text-sm text-white/80">
							{t('group.renameHint')}
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => setShowDeleteConfirmDialog(true)}
						aria-label={t('group.deleteGroup')}
						className="h-11 rounded-lg border-white/40 bg-white/10 text-white transition hover:bg-white/20 hover:text-white"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						{t('group.deleteGroup')}
					</Button>
				</div>
			</div>
			<div className="grid gap-3 bg-white/70 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map(({ label, value, icon: Icon }) => (
					<div
						key={label}
						className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-4 shadow-sm"
					>
						<span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
							<Icon className="h-5 w-5" />
						</span>
						<div>
							<p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
								{label}
							</p>
							<p className="mt-1 text-base font-semibold text-slate-900">
								{value}
							</p>
						</div>
					</div>
				))}
			</div>
			<div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.1fr,0.9fr]">
				<div className="space-y-6">
					<PeopleManager people={group.people} />
					<Card className="border-none bg-white/90 shadow-md ring-1 ring-slate-200/60">
						<CardHeader className="space-y-1">
							<CardTitle className="text-xl font-semibold text-slate-900">
								{t('tip.title')}
							</CardTitle>
							<p className="text-sm text-slate-500">
								{t('tip.subtitle')}
							</p>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="tip-percentage"
									className="text-sm font-medium text-slate-700"
								>
									{t('tip.percentage')}
								</Label>
								<div className="flex flex-col gap-3 sm:flex-row">
									<Input
										id="tip-percentage"
										type="number"
										placeholder={t('tip.placeholder')}
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
										className="flex-1 rounded-xl"
									/>
									<div className="flex items-center text-sm text-slate-500">
										{totalTipAmount > 0 ? (
											<span>
												{t('tip.adds', { amount: currencyFormatter.format(totalTipAmount) })}
											</span>
										) : (
											<span>{t('tip.notAdded')}</span>
										)}
									</div>
								</div>
								<p className="text-xs leading-relaxed text-slate-500">
									{t('tip.calculationHint')}
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
			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
				<DialogContent className="sm:max-w-md rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold text-slate-900">
							{t('group.confirmDelete')}
						</DialogTitle>
						<DialogDescription className="text-sm text-slate-500">
							{t('group.confirmDeleteMessage', { name: group.name })}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex gap-2">
						<Button
							onClick={() => setShowDeleteConfirmDialog(false)}
							variant="outline"
							className="rounded-xl"
						>
							{t('group.cancel')}
						</Button>
						<Button
							onClick={() => {
								deleteGroup({ id: group.id })
								setShowDeleteConfirmDialog(false)
							}}
							className="rounded-xl bg-red-600 text-white hover:bg-red-700"
						>
							{t('group.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
