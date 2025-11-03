import { Toaster } from 'sonner'
import { useEffectiveTheme } from '../lib/useEffectiveTheme'

export function ThemeToaster() {
	const effectiveTheme = useEffectiveTheme()

	return <Toaster theme={effectiveTheme} />
}
