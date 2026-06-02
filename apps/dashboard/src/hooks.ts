import { useEffect, useState } from 'react'

export function useApi<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial)
  const [error, setError] = useState('')
  useEffect(() => {
    loader().then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : 'Request failed'))
  }, [])
  return { data, error }
}
