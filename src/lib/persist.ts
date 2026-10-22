import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

const PREFIX = 'boris:v1:'

/** Ключ в localStorage: boris:v1:a:b */
export function persistKey(...parts: string[]) {
  return PREFIX + parts.join(':')
}

/**
 * useState с сохранением в localStorage.
 * Переживает перезагрузку и размонтирование вкладки.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const fullKey = key.startsWith(PREFIX) ? key : PREFIX + key

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      if (raw == null) return initial
      return JSON.parse(raw) as T
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(state))
    } catch {
      // quota / private mode — молча
    }
  }, [fullKey, state])

  return [state, setState]
}
