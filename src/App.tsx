import { useAtom, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { GroupManager } from './components/GroupManager'
import { LanguageSync } from './components/LanguageSync'
import { SettingsModal } from './components/SettingsModal'
import { ThemeSync } from './components/ThemeSync'
import { usePlausible } from './hooks/usePlausible'
import {
	createNewGroupAtom,
	groupsAtom,
	selectedGroupAtom,
	selectedGroupIdAtom,
} from './store/atoms'

function App() {
	const { t } = useTranslation()
	const groups = useAtomValue(groupsAtom)
	const [selectedGroupId, setSelectedGroupId] = useAtom(selectedGroupIdAtom)
	const createNewGroup = useAtomSet(createNewGroupAtom)
	const selectedGroup = useAtomValue(selectedGroupAtom)
	const trackEvent = usePlausible()

	// Initialize selectedGroupId with first group if groups exist and no selection
	useEffect(() => {
		if (groups.length > 0 && !selectedGroupId) {
			setSelectedGroupId(groups[0].id)
		}
	}, [groups, selectedGroupId, setSelectedGroupId])

	const handleCreateGroup = () => {
		createNewGroup({ name: t('group.newGroup') })
		trackEvent('group-created', {
			props: {
				totalGroups: String(groups.length + 1),
			},
		})
	}

	return (
		<div className="min-h-screen overflow-hidden bg-muted/30 text-foreground">
			<LanguageSync />
			<ThemeSync />
			<header>
				<div className="container mx-auto max-w-6xl px-4 py-6 text-ring-foreground">
					<div className="flex items-center justify-between">
						<h1 className="font-semibold text-3xl tracking-tight">
							&#x1F4B8; {t('app.title')}
						</h1>
						<SettingsModal />
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-6xl p-4">
				<div className="space-y-8">
					{groups.length > 0 && (
						<Card className="border-none bg-card shadow-xl ring-1 ring-ring backdrop-blur">
							<CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
								<div className="space-y-1">
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.3em]">
										{t('group.activeGroup')}
									</p>
									<h2 className="font-semibold text-foreground text-xl">
										{t('group.chooseWork')}
									</h2>
								</div>
								<div className="flex w-full flex-col gap-3 md:max-w-md md:flex-row md:items-center">
									<Select
										value={selectedGroupId || ''}
										onValueChange={(value) => setSelectedGroupId(value)}
									>
										<SelectTrigger
											id="group-select"
											className="h-12 flex-1 rounded-xl border border-input bg-background text-left font-medium text-base text-foreground shadow-sm hover:border-border"
										>
											<SelectValue placeholder={t('group.selectGroup')} />
										</SelectTrigger>
										<SelectContent className="rounded-xl border border-border bg-card shadow-lg">
											{groups.map((group) => (
												<SelectItem key={group.id} value={group.id}>
													{group.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										onClick={handleCreateGroup}
										className="h-12 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
									>
										+ {t('group.newGroup')}
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
					{selectedGroup ? (
						<GroupManager />
					) : (
						<Card className="border-none bg-card text-center shadow-xl ring-1 ring-ring backdrop-blur">
							<CardHeader className="space-y-3">
								<CardTitle className="font-semibold text-3xl text-foreground">
									{t('welcome.title')}
								</CardTitle>
								<p className="text-lg text-muted-foreground">
									{t('welcome.subtitle')}
								</p>
							</CardHeader>
							<CardContent className="flex flex-col items-center gap-4 pb-10">
								<Button
									onClick={handleCreateGroup}
									size="lg"
									className="rounded-xl bg-primary px-8 text-base text-primary-foreground shadow-sm hover:bg-primary/90"
								>
									{t('welcome.button')}
								</Button>
								<p className="text-muted-foreground text-sm">
									{t('welcome.hint')}
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</main>
		</div>
	)
}

export default App
