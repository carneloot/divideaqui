import { RegistryProvider } from '@effect-atom/atom-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PlausibleAnalytics } from './components/PlausibleAnalytics'
import { ThemeToaster } from './components/ThemeToaster'
import './lib/i18n'

// biome-ignore lint/style/noNonNullAssertion: root is always defined
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RegistryProvider>
			<PlausibleAnalytics />
			<App />
			<ThemeToaster />
		</RegistryProvider>
	</StrictMode>
)
