"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { CircleMember } from "@/types"
import { filterCircleMembers, type JoinedFilter } from "../member-filters"

export function useMemberDirectory(members: CircleMember[], initialPageSize = 20) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")
  const [position, setPosition] = useState("")
  const [joined, setJoined] = useState<JoinedFilter>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
      setFocusedIndex(-1)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1)
    setFocusedIndex(-1)
  }, [])

  const filteredMembers = useMemo(() => {
    return filterCircleMembers(members, {
      search: debouncedSearch,
      status,
      position,
      joined,
    })
  }, [members, debouncedSearch, status, position, joined])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize))

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMembers.slice(start, start + pageSize)
  }, [filteredMembers, currentPage, pageSize])

  const clearFilters = useCallback(() => {
    setSearch("")
    setDebouncedSearch("")
    setStatus("")
    setPosition("")
    setJoined("")
    setCurrentPage(1)
    setFocusedIndex(-1)
  }, [])

  const hasFilters = Boolean(search || status || position || joined)

  return {
    search,
    setSearch,
    debouncedSearch,
    status,
    setStatus: (v: string) => { setStatus(v); handleFilterChange() },
    position,
    setPosition: (v: string) => { setPosition(v); handleFilterChange() },
    joined,
    setJoined: (v: JoinedFilter) => { setJoined(v); handleFilterChange() },
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    focusedIndex,
    setFocusedIndex,
    filteredMembers,
    paginatedMembers,
    totalPages,
    clearFilters,
    hasFilters,
  }
}
