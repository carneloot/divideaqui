import { Atom, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { Percent, PiggyBank, Receipt, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
	currencyAtom,
	deleteGroupAtom,
	selectedGroupAtom,
	updateGroupNameAtom,
} from '../store/atoms'
import { ItemForm } from './ItemForm'
import { ItemsList } from './ItemsList'
import { PeopleManager } from './PeopleManager'
import { Summary } from './Summary'
import { TipForm } from './TipForm'

const groupStatsAtom = Atom.make((get) => {
	const group = get(selectedGroupAtom)
	if (!group) return null

	const totalExpenses = group.items
		.filter((item) => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const totalDiscounts = group.items
		.filter((item) => item.type === 'discount')
		.reduce((sum, item) => sum + item.amount * item.price, 0)
	const netTotal = totalExpenses - totalDiscounts
	const tipPercentage = group.tipPercentage
	const tipIsEnabled =
		tipPercentage !== undefined && tipPercentage !== null && tipPercentage > 0
	const totalTipAmount =
		tipIsEnabled && netTotal > 0 && tipPercentage !== undefined
			? (netTotal * tipPercentage) / 100
			: 0

	return {
		peopleCount: group.people.length,
		itemCount: group.items.length,
		netTotal,
		tipIsEnabled,
		totalTipAmount,
		tipPercentage,
	}
})

export function GroupManager() {
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const deleteGroup = useAtomSet(deleteGroupAtom)
	const updateGroupName = useAtomSet(updateGroupNameAtom)
	const groupStats = useAtomValue(groupStatsAtom)

	const [groupName, setGroupName] = useState(group?.name || '')
	const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
	const currency = useAtomValue(currencyAtom)
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)

	// Sync local state with group when it changes
	useEffect(() => {
		if (group) {
			setGroupName(group.name)
		}
	}, [group])

	if (!group || !groupStats) {
		return null
	}

	const {
		peopleCount,
		itemCount,
		netTotal,
		tipIsEnabled,
		totalTipAmount,
		tipPercentage: activeTipPercentage,
	} = groupStats

	const handleUpdateName = () => {
		if (groupName.trim()) {
			updateGroupName({ id: group.id, name: groupName.trim() })
		}
	}

	const stats = [
		{
			label: t('stats.people'),
			value: peopleCount.toString(),
			icon: Users,
		},
		{
			label: t('stats.itemsTracked'),
			value: itemCount.toString(),
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
				tipIsEnabled && activeTipPercentage !== undefined
					? `${activeTipPercentage}% · ${currencyFormatter.format(totalTipAmount)}`
					: t('stats.noTip'),
			icon: Percent,
		},
	]

	return (
		<Card className="overflow-hidden border-none bg-card shadow-2xl ring-1 ring-ring backdrop-blur">
			<div className="relative overflow-hidden border-white/10 border-b bg-linear-to-br from-ring/70 to-primary">
				<div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
					<div className="w-full max-w-xl space-y-4">
						<div>
							<p className="font-semibold text-white/70 text-xs uppercase tracking-[0.35em]">
								{t('group.name')}
							</p>
							<Input
								type="text"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								onBlur={handleUpdateName}
								onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
								className="mt-2 h-14 rounded-xl border border-white/20 bg-white/15 px-5 font-semibold text-lg text-white placeholder:text-white/50 focus-visible:ring-white/60"
								placeholder={t('group.placeholder')}
							/>
						</div>
						<p className="text-sm text-white/80">{t('group.renameHint')}</p>
					</div>
					<Button
						variant="ghost"
						onClick={() => setShowDeleteConfirmDialog(true)}
						aria-label={t('group.deleteGroup')}
						className="h-11 rounded-lg border border-primary-foreground text-primary-foreground hover:border-transparent"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						{t('group.deleteGroup')}
					</Button>
				</div>
			</div>
			<div className="grid gap-3 bg-muted px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map(({ label, value, icon: Icon }) => (
					<div
						key={label}
						className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 shadow-sm"
					>
						<span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
							<Icon className="h-5 w-5" />
						</span>
						<div>
							<p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
								{label}
							</p>
							<p className="mt-1 font-semibold text-base text-foreground">
								{value}
							</p>
						</div>
					</div>
				))}
			</div>
			<div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.1fr,0.9fr]">
				<div className="space-y-6">
					<PeopleManager people={group.people} />
					<TipForm />
					<ItemForm people={group.people} />
				</div>
				<div className="space-y-6">
					<ItemsList items={group.items} people={group.people} />
					<Summary />
				</div>
			</div>
			{/* Delete Confirmation Dialog */}
			<Dialog
				open={showDeleteConfirmDialog}
				onOpenChange={setShowDeleteConfirmDialog}
			>
				<DialogContent className="rounded-xl border-none bg-card shadow-xl ring-1 ring-ring backdrop-blur sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="font-semibold text-foreground text-xl">
							{t('group.confirmDelete')}
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-sm">
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
							className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t('group.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
