import { useAtom, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { useEffect } from 'react'
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
import { SettingsModal } from './components/SettingsModal'
import {
	createNewGroupAtom,
	groupsAtom,
	selectedGroupAtom,
	selectedGroupIdAtom,
} from './store/atoms'

function App() {
	const groups = useAtomValue(groupsAtom)
	const [selectedGroupId, setSelectedGroupId] = useAtom(selectedGroupIdAtom)
	const createNewGroup = useAtomSet(createNewGroupAtom)
	const selectedGroup = useAtomValue(selectedGroupAtom)

	// Initialize selectedGroupId with first group if groups exist and no selection
	useEffect(() => {
		if (groups.length > 0 && !selectedGroupId) {
			setSelectedGroupId(groups[0].id)
		}
	}, [groups, selectedGroupId, setSelectedGroupId])

	const handleCreateGroup = () => {
		createNewGroup({ name: 'New Group' })
	}

	return (
		<div className="min-h-screen overflow-hidden bg-slate-950 text-slate-900">
			<header>
				<div className="container mx-auto max-w-6xl px-4 py-6 text-white">
					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-semibold tracking-tight">
							💰 Divide Aqui
						</h1>
						<SettingsModal />
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-6xl p-4">
				<div className="space-y-8">
					{groups.length > 0 && (
						<Card className="border-none bg-white/90 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
							<CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
								<div className="space-y-1">
									<p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
										Active group
									</p>
									<h2 className="text-xl font-semibold text-slate-800">
										Choose where you want to work
									</h2>
								</div>
								<div className="flex w-full flex-col gap-3 md:max-w-md md:flex-row md:items-center">
									<Select
										value={selectedGroupId || ''}
										onValueChange={(value) => setSelectedGroupId(value)}
									>
										<SelectTrigger
											id="group-select"
											className="h-12 flex-1 rounded-xl border border-slate-200 bg-white/70 text-left text-base font-medium text-slate-800 shadow-sm hover:border-slate-300"
										>
											<SelectValue placeholder="Select a group" />
										</SelectTrigger>
										<SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-lg">
											{groups.map((group) => (
												<SelectItem key={group.id} value={group.id}>
													{group.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										onClick={handleCreateGroup}
										className="h-12 rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800"
									>
										+ New Group
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
					{selectedGroup ? (
						<GroupManager />
					) : (
						<Card className="border-none bg-white/90 text-center shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
							<CardHeader className="space-y-3">
								<CardTitle className="text-3xl font-semibold text-slate-900">
									Welcome! 👋
								</CardTitle>
								<p className="text-lg text-slate-500">
									Create your first group and start balancing receipts together.
								</p>
							</CardHeader>
							<CardContent className="flex flex-col items-center gap-4 pb-10">
								<Button
									onClick={handleCreateGroup}
									size="lg"
									className="rounded-xl px-8 text-base"
								>
									Create your first group
								</Button>
								<p className="text-sm text-slate-400">
									Have a recurring dinner crew? Set them up once and reuse
									anytime.
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
