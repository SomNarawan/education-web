import { AxiosHeaders } from 'axios'
import type { AxiosHeaderValue, AxiosResponse } from 'axios'
import type { StudentImportSummary } from '../../../types/StudentImport'

interface SubmissionLock {
    current: boolean
}

function readHeader(
    headers: AxiosResponse['headers'],
    name: string,
): AxiosHeaderValue | undefined {
    if (headers instanceof AxiosHeaders) return headers.get(name)

    const key = Object.keys(headers).find((header) => header.toLowerCase() === name)
    return key === undefined ? undefined : headers[key]
}

function parseHeaderNumber(headers: AxiosResponse['headers'], name: string): number | null {
    const value = readHeader(headers, name)
    const text = typeof value === 'number' ? String(value) : value
    if (typeof text !== 'string' || !/^[0-9]+$/.test(text.trim())) return null

    const parsedValue = Number(text)
    return Number.isSafeInteger(parsedValue) ? parsedValue : null
}

export function parseStudentImportSummary(
    headers: AxiosResponse['headers'],
): StudentImportSummary | null {
    const importId = parseHeaderNumber(headers, 'x-import-id')
    const total = parseHeaderNumber(headers, 'x-import-total')
    const success = parseHeaderNumber(headers, 'x-import-success')
    const failed = parseHeaderNumber(headers, 'x-import-failed')

    if (
        importId === null ||
        importId === 0 ||
        total === null ||
        total === 0 ||
        success === null ||
        failed === null ||
        total !== success + failed
    ) {
        return null
    }

    return { importId, total, success, failed }
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
