'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseDataFetchOptions {
  defaultPage?: number
  defaultLimit?: number
}

interface UseDataFetchReturn<T> {
  data: T[]
  total: number
  page: number
  setPage: (page: number) => void
  search: string
  setSearch: (search: string) => void
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDataFetch<T>(
  url: string,
  options?: UseDataFetchOptions
): UseDataFetchReturn<T> {
  const { defaultPage = 1, defaultLimit = 20 } = options ?? {}

  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(defaultPage)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(defaultLimit))
    if (search) params.set('search', search)

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${url}?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success) {
          setData(json.data ?? [])
          setTotal(json.total ?? 0)
        } else {
          setError(json.error ?? 'Failed to fetch data')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [url, page, search, defaultLimit, refreshKey])

  return { data, total, page, setPage, search, setSearch, loading, error, refresh }
}
