import client from './client'
import type { Technique, TechniqueCategory } from './types'

export const listTechniques = () => client.get<Technique[]>('/techniques')

export const createTechnique = (data: {
  name: string
  description?: string
  category_id: string
  reference_url?: string
}) => client.post<Technique>('/techniques', data)

export const listCategories = () => client.get<TechniqueCategory[]>('/techniques/categories')

export const createCategory = (name: string) =>
  client.post<TechniqueCategory>('/techniques/categories', { name })
