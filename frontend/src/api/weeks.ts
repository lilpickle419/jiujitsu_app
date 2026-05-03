import client from './client'
import type { Week } from './types'

export const getCurrentWeek = () => client.get<Week>('/weeks/current')
export const getNextWeek = () => client.get<Week>('/weeks/next')
export const listWeeks = () => client.get<Week[]>('/weeks')
