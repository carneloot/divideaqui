import { RegistryProvider } from '@effect-atom/atom-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

// biome-ignore lint/style/noNonNullAssertion: root is always defined
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RegistryProvider>
			<App />
			<Toaster />
		</RegistryProvider>
	</StrictMode>
)
