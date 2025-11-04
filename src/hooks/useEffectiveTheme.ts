import { useAtomValue } from '@effect-atom/atom-react'
import { useEffect, useState } from 'react'
import { themeAtom } from '../store/settings'

export function useEffectiveTheme() {
	const theme = useAtomValue(themeAtom)
	const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
		if (theme === 'system') {
			// Initial system preference check
			return window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
		}
		return theme
	})

	useEffect(() => {
		if (theme === 'system') {
			// Detect system preference
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
			const updateTheme = () => {
				setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light')
			}

			// Set initial value
			updateTheme()

			// Listen for changes
			mediaQuery.addEventListener('change', updateTheme)

			return () => {
				mediaQuery.removeEventListener('change', updateTheme)
			}
		} else {
			setEffectiveTheme(theme)
		}
	}, [theme])

	return effectiveTheme
}
