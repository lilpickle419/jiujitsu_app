import client from './client'
import type { JournalEntry } from './types'

export const listJournalEntries = () =>
  client.get<JournalEntry[]>('/journal')

export const createJournalEntry = (data: {
  name: string
  description?: string
  notes?: string
  reference_url?: string
}) => client.post<JournalEntry>('/journal', data)

export const updateJournalEntry = (
  id: string,
  data: { name: string; description?: string; notes?: string; reference_url?: string },
) => client.put<JournalEntry>(`/journal/${id}`, data)

export const deleteJournalEntry = (id: string) =>
  client.delete(`/journal/${id}`)
