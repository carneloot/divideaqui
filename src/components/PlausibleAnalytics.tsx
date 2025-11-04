import { init } from '@plausible-analytics/tracker'
import { useEffect } from 'react'

/**
 * Plausible Analytics component that initializes the tracker conditionally
 * based on environment variables.
 *
 * Set VITE_PLAUSIBLE_DOMAIN to your Plausible domain to enable analytics.
 * Example: VITE_PLAUSIBLE_DOMAIN=yourdomain.com
 */
export function PlausibleAnalytics() {
	useEffect(() => {
		const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN

		// Only initialize Plausible if domain is configured
		if (!domain) {
			return
		}

		// Initialize Plausible with automatic SPA pageview tracking
		init({
			domain,
		})
	}, [])

	return null
}
