import { type CustomProperties, track } from '@plausible-analytics/tracker'

/**
 * Hook for tracking custom events with Plausible Analytics
 *
 * @example
 * ```tsx
 * const trackEvent = usePlausible()
 * trackEvent('button-click', { props: { buttonName: 'submit', count: '5' } })
 * ```
 *
 * Note: Plausible only accepts string values for props.
 * Numbers and booleans will be automatically converted to strings.
 */
export function usePlausible() {
	return (
		eventName: string,
		options?: { props?: Record<string, string | number | boolean> }
	) => {
		const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN

		// Only track if Plausible is configured
		if (!domain) {
			return
		}

		// Convert props to string-only format (Plausible requirement)
		const plausibleOptions: { props?: CustomProperties } = {}
		if (options?.props) {
			plausibleOptions.props = Object.fromEntries(
				Object.entries(options.props).map(([key, value]) => [
					key,
					String(value),
				])
			) as CustomProperties
		}

		// Track the event using the official package
		track(eventName, plausibleOptions)
	}
}
