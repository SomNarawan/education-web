import axios from 'axios'

export const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024

interface FileMetadata {
    name: string
    size: number
}

interface ImportApiErrorBody {
    message?: string
    errors?: Record<string, string | string[]> | null
}

export interface ImportError {
    message: string
    validationErrors: string[]
    status?: number
}

interface ImportResultRecord {
    status: string
    total_count: number
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

function getValidationErrors(body: ImportApiErrorBody): string[] {
    if (!body.errors) return []

    return Object.values(body.errors).flatMap((fieldErrors) =>
        Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors],
    )
}

function parseErrorBody(
    body: unknown,
    fallbackMessage: string,
    status?: number,
): ImportError | null {
    if (!body || typeof body !== 'object') return null

    const apiError = body as ImportApiErrorBody
    const validationErrors = getValidationErrors(apiError)

    return {
        message:
            apiError.message ?? validationErrors[0] ?? fallbackMessage,
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

export function validateXlsxImportFile(
    file: FileMetadata | null | undefined,
    missingFileMessage: string,
): string | null {
    if (!file) return missingFileMessage

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        return 'รองรับเฉพาะไฟล์นามสกุล .xlsx เท่านั้น'
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
        return 'ไฟล์ต้องมีขนาดไม่เกิน 20 MB'
    }

    return null
}

export function getDownloadFileName(
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

export function downloadBlob(blob: Blob, fileName: string) {
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

export async function parseImportError(
    error: unknown,
    fallbackMessage = 'นำเข้าข้อมูลไม่สำเร็จ',
): Promise<ImportError> {
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
                const parsedError = parseErrorBody(
                    JSON.parse(text),
                    fallbackMessage,
                    status,
                )
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
        const parsedError = parseErrorBody(
            responseData,
            fallbackMessage,
            status,
        )
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
    }

    return {
        message: fallbackByStatus[status ?? 0] ?? fallbackMessage,
        validationErrors: [],
        status,
    }
}

export function getImportResultDownloadErrorMessage(
    status: number | undefined,
    message: string,
) {
    const statusMessages: Record<number, string> = {
        401: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
        404: 'ไม่พบไฟล์ผลลัพธ์ของรายการ Import นี้',
        422: 'ไฟล์ผลลัพธ์ยังไม่พร้อมให้ดาวน์โหลด กรุณาลองใหม่ภายหลัง',
    }

    return statusMessages[status ?? 0] ?? message
}

export function canDownloadImportResult(record: ImportResultRecord) {
    return (
        record.total_count > 0 &&
        ['completed', 'completed_with_errors', 'failed'].includes(
            record.status,
        )
    )
}
