import { Toaster } from 'sonner'
import { useEffectiveTheme } from '../hooks/useEffectiveTheme'

export function ThemeToaster() {
	const effectiveTheme = useEffectiveTheme()

	return <Toaster theme={effectiveTheme} />
}
