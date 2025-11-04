import { useEffect } from 'react'
import { useEffectiveTheme } from '../hooks/useEffectiveTheme'

export function ThemeSync() {
	const effectiveTheme = useEffectiveTheme()

	// Update HTML class based on effective theme
	useEffect(() => {
		const root = document.documentElement
		if (effectiveTheme === 'dark') {
			root.classList.add('dark')
		} else {
			root.classList.remove('dark')
		}
	}, [effectiveTheme])

	return null
}
