import { Map } from 'maplibre-gl'
import { Context, createContext, useContext } from 'react'

const createCtx = <T>() => {
  const context = createContext<T | undefined>(undefined)
  const useCtx = () => {
    const t = useContext(context)
    if (t === undefined) {
      throw new Error('Value was not provided for context')
    }
    return t
  }
  return [useCtx, context.Provider as Context<T>['Provider']] as const
}

export const [useMap, MapContextProvider] = createCtx<Map>()
