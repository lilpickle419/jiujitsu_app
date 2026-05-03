import client from './client'
import type { User } from './types'

export const listStudents = () => client.get<User[]>('/users/students')
