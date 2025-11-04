import { ExternalLink, Github } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function Footer() {
	const { t } = useTranslation()
	const currentYear = new Date().getFullYear()
	const githubUrl = 'https://github.com/carneloot/divideaqui'

	return (
		<footer className="border-border border-t bg-muted/50">
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
					<div className="space-y-1 text-muted-foreground text-sm">
						<p>
							© {currentYear} {t('footer.copyright')}
						</p>
						<p className="text-muted-foreground text-xs">
							{t('footer.license')}
						</p>
					</div>
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="text-muted-foreground hover:text-foreground"
						>
							<a
								href={githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2"
							>
								<Github className="h-4 w-4" />
								<span className="hidden sm:inline">
									{t('footer.viewOnGitHub')}
								</span>
								<span className="sm:hidden">{t('footer.github')}</span>
								<ExternalLink className="h-3 w-3" />
							</a>
						</Button>
					</div>
				</div>
			</div>
		</footer>
	)
}
