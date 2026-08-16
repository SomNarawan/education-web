import axios from 'axios'
import type {
    StudentImportApiErrorBody,
    StudentImportError,
    StudentImportSummary,
} from '../../../types/StudentImport'

export const MAX_STUDENT_IMPORT_FILE_SIZE = 20 * 1024 * 1024
interface FileMetadata {
    name: string
    size: number
}

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

function getValidationErrors(body: StudentImportApiErrorBody): string[] {
    if (!body.errors) return []

    return Object.values(body.errors).flatMap((fieldErrors) =>
        Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors],
    )
}

function parseErrorBody(
    body: unknown,
    status?: number,
): StudentImportError | null {
    if (!body || typeof body !== 'object') return null

    const apiError = body as StudentImportApiErrorBody
    const validationErrors = getValidationErrors(apiError)

    return {
        message:
            apiError.message ??
            validationErrors[0] ??
            'นำเข้านักศึกษาไม่สำเร็จ',
        validationErrors,
        status,
    }
}

function sanitizeFileName(fileName: string): string {
    return fileName.split(/[\\/]/).pop()?.trim() || ''
}

function readBlobText(blob: Blob): Promise<string> {
    if (typeof blob.text === 'function') return blob.text()

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob)
    })
}

export function validateStudentImportFile(
    file?: FileMetadata | null,
): string | null {
    if (!file) return 'กรุณาเลือกไฟล์ .xlsx ที่ต้องการนำเข้า'

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        return 'รองรับเฉพาะไฟล์นามสกุล .xlsx เท่านั้น'
    }

    if (file.size > MAX_STUDENT_IMPORT_FILE_SIZE) {
        return 'ไฟล์ต้องมีขนาดไม่เกิน 20 MB'
    }

    return null
}

export function formatStudentImportFileSize(size: number): string {
    if (size < 1024) return `${size} B`

    const sizeInKb = size / 1024
    if (sizeInKb < 1024) return `${sizeInKb.toFixed(1)} KB`

    return `${(sizeInKb / 1024).toFixed(2)} MB`
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

export function getStudentImportFileName(
    headers: unknown,
    fallbackFileName: string,
): string {
    const contentDisposition = readHeader(headers, 'content-disposition')

    if (typeof contentDisposition !== 'string') {
        return fallbackFileName
    }

    const encodedMatch = contentDisposition.match(
        /filename\*\s*=\s*UTF-8''([^;]+)/i,
    )

    if (encodedMatch?.[1]) {
        try {
            const decodedName = sanitizeFileName(
                decodeURIComponent(encodedMatch[1].trim()),
            )
            if (decodedName) return decodedName
        } catch {
            // Fall through to the regular filename or fallback.
        }
    }

    const regularMatch = contentDisposition.match(
        /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i,
    )
    const regularName = sanitizeFileName(
        regularMatch?.[1] ?? regularMatch?.[2] ?? '',
    )

    return regularName || fallbackFileName
}

export function downloadStudentImportBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    try {
        link.href = objectUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
    } finally {
        link.remove()
        URL.revokeObjectURL(objectUrl)
    }
}

export async function parseStudentImportError(
    error: unknown,
): Promise<StudentImportError> {
    if (!axios.isAxiosError(error)) {
        return {
            message: 'ไม่สามารถเชื่อมต่อกับระบบได้',
            validationErrors: [],
        }
    }

    const status = error.response?.status
    const responseData: unknown = error.response?.data

    if (responseData instanceof Blob) {
        const text = await readBlobText(responseData)

        if (text) {
            try {
                const parsedError = parseErrorBody(JSON.parse(text), status)
                if (parsedError) return parsedError
            } catch {
                return {
                    message: text,
                    validationErrors: [],
                    status,
                }
            }
        }
    } else {
        const parsedError = parseErrorBody(responseData, status)
        if (parsedError) return parsedError
    }

    if (!error.response) {
        return {
            message: 'ไม่สามารถเชื่อมต่อกับระบบได้',
            validationErrors: [],
        }
    }

    const fallbackByStatus: Record<number, string> = {
        401: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
        404: 'ไม่พบข้อมูลหรือไฟล์ผลลัพธ์ที่ต้องการ',
        422: 'ข้อมูลไฟล์ไม่ถูกต้อง กรุณาตรวจสอบไฟล์อีกครั้ง',
        500: 'ระบบไม่สามารถนำเข้านักศึกษาได้ในขณะนี้',
    }

    return {
        message:
            fallbackByStatus[status ?? 0] ?? 'นำเข้านักศึกษาไม่สำเร็จ',
        validationErrors: [],
        status,
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
