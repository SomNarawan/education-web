import type { StudentImportSummary } from '../../../types/StudentImport'

interface SubmissionLock {
    current: boolean
}

function readHeader(headers: unknown, name: string): unknown {
    if (!headers || typeof headers !== 'object') return undefined

    const headerContainer = headers as {
        get?: (headerName: string) => unknown
        [key: string]: unknown
    }
    const getterValue = headerContainer.get?.(name)

    if (getterValue !== undefined && getterValue !== null) {
        return getterValue
    }

    return (
        headerContainer[name] ??
        headerContainer[name.toLowerCase()] ??
        headerContainer[name.toUpperCase()]
    )
}

function parseHeaderNumber(headers: unknown, name: string): number {
    const parsedValue = Number(readHeader(headers, name) ?? 0)
    return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function parseStudentImportSummary(
    headers: unknown,
): StudentImportSummary {
    return {
        importId: parseHeaderNumber(headers, 'x-import-id'),
        total: parseHeaderNumber(headers, 'x-import-total'),
        success: parseHeaderNumber(headers, 'x-import-success'),
        failed: parseHeaderNumber(headers, 'x-import-failed'),
    }
}

export async function runStudentImportOnce<T>(
    lock: SubmissionLock,
    task: () => Promise<T>,
): Promise<T | undefined> {
    if (lock.current) return undefined

    lock.current = true

    try {
        return await task()
    } finally {
        lock.current = false
    }
}
