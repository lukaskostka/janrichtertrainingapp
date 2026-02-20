import { describe, it, expect } from 'vitest'
import { getSupersetLabels, groupExercisesForRender, formatCurrency } from './utils'

describe('getSupersetLabels', () => {
  it('returns empty map for exercises without supersets', () => {
    const exercises = [
      { id: '1', superset_group: null },
      { id: '2', superset_group: null },
    ]
    const labels = getSupersetLabels(exercises)
    expect(labels.size).toBe(0)
  })

  it('assigns correct labels for a single superset group', () => {
    const exercises = [
      { id: '1', superset_group: 1 },
      { id: '2', superset_group: 1 },
    ]
    const labels = getSupersetLabels(exercises)
    expect(labels.get('1')).toBe('A1')
    expect(labels.get('2')).toBe('A2')
  })

  it('assigns correct labels for multiple superset groups', () => {
    const exercises = [
      { id: '1', superset_group: 1 },
      { id: '2', superset_group: 1 },
      { id: '3', superset_group: null },
      { id: '4', superset_group: 3 },
      { id: '5', superset_group: 3 },
    ]
    const labels = getSupersetLabels(exercises)
    expect(labels.get('1')).toBe('A1')
    expect(labels.get('2')).toBe('A2')
    expect(labels.has('3')).toBe(false)
    expect(labels.get('4')).toBe('B1')
    expect(labels.get('5')).toBe('B2')
  })
})

describe('groupExercisesForRender', () => {
  it('groups single exercises correctly', () => {
    const exercises = [
      { id: '1', superset_group: null },
      { id: '2', superset_group: null },
    ]
    const groups = groupExercisesForRender(exercises)
    expect(groups).toHaveLength(2)
    expect(groups[0].type).toBe('single')
    expect(groups[1].type).toBe('single')
  })

  it('groups superset exercises together', () => {
    const exercises = [
      { id: '1', superset_group: 1 },
      { id: '2', superset_group: 1 },
      { id: '3', superset_group: null },
    ]
    const groups = groupExercisesForRender(exercises)
    expect(groups).toHaveLength(2)
    expect(groups[0].type).toBe('superset')
    expect(groups[0].exercises).toHaveLength(2)
    expect(groups[0].group).toBe(1)
    expect(groups[1].type).toBe('single')
  })

  it('handles mixed groups correctly', () => {
    const exercises = [
      { id: '1', superset_group: null },
      { id: '2', superset_group: 1 },
      { id: '3', superset_group: 1 },
      { id: '4', superset_group: null },
      { id: '5', superset_group: 2 },
      { id: '6', superset_group: 2 },
    ]
    const groups = groupExercisesForRender(exercises)
    expect(groups).toHaveLength(4)
    expect(groups[0].type).toBe('single')
    expect(groups[1].type).toBe('superset')
    expect(groups[1].exercises).toHaveLength(2)
    expect(groups[2].type).toBe('single')
    expect(groups[3].type).toBe('superset')
    expect(groups[3].exercises).toHaveLength(2)
  })
})

describe('formatCurrency', () => {
  it('formats Czech currency correctly', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1')
    expect(result).toContain('500')
    expect(result).toContain('Kč')
  })
})
