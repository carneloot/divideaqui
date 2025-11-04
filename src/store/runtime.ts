import { BrowserKeyValueStore } from '@effect/platform-browser'
import { Atom } from '@effect-atom/atom-react'

import { Layer } from 'effect'

import { PakoCompressorLive } from '../services/pako-compressor'

export const runtimeLayer = Layer.merge(
	BrowserKeyValueStore.layerLocalStorage,
	PakoCompressorLive
)

export const runtimeAtom = Atom.runtime(runtimeLayer)
