import type { SyncResult, SyncTableRecord } from '../../types/SyncData'
import { mapSyncResult, syncFailureMessage } from './syncData'

interface SyncNotice {
    type: 'success' | 'warning' | 'error'
    message: string
}

interface AcademicCalendarSyncOutcome {
    record: Partial<SyncTableRecord>
    notice: SyncNotice
}

export function getAcademicCalendarSyncOutcome(
    result: SyncResult,
): AcademicCalendarSyncOutcome {
    const record = mapSyncResult(result)

    if (result.status !== 'success') {
        return {
            record,
            notice: {
                type: 'error',
                message: syncFailureMessage,
            },
        }
    }

    const yearResults = result.academic_year_results ?? []

    if (yearResults.length === 0) {
        return {
            record: {
                ...record,
                status: 'success',
                resultMessage: null,
            },
            notice: {
                type: 'success',
                message: 'Sync ปฏิทินสำเร็จ',
            },
        }
    }

    const yearsByStatus = {
        inserted: yearResults
            .filter((item) => item.status === 'inserted')
            .map((item) => item.academic_year_be),
        updated: yearResults
            .filter((item) => item.status === 'updated')
            .map((item) => item.academic_year_be),
        skipped: yearResults
            .filter((item) => item.status === 'skipped')
            .map((item) => item.academic_year_be),
        noData: yearResults
            .filter((item) => item.status === 'no_data')
            .map((item) => item.academic_year_be),
    }
    const resultMessages = [
        yearsByStatus.inserted.length > 0
            ? `เพิ่ม: ${yearsByStatus.inserted.join(', ')}`
            : null,
        yearsByStatus.updated.length > 0
            ? `อัปเดต: ${yearsByStatus.updated.join(', ')}`
            : null,
        yearsByStatus.skipped.length > 0
            ? `ข้าม (ข้อมูลเป็นปัจจุบันแล้ว): ${yearsByStatus.skipped.join(', ')}`
            : null,
        yearsByStatus.noData.length > 0
            ? `ข้าม (ไม่พบข้อมูลจากระบบต้นทาง): ${yearsByStatus.noData.join(', ')}`
            : null,
    ].filter((message): message is string => message !== null)
    const resultMessage = resultMessages.join('\n')
    if (yearsByStatus.noData.length === yearResults.length) {
        return {
            record: {
                ...record,
                status: 'failed',
                resultMessage,
            },
            notice: {
                type: 'error',
                message: `Sync ปฏิทินไม่สำเร็จ: ${resultMessages.join(' · ')}`,
            },
        }
    }

    if (yearsByStatus.noData.length > 0) {
        return {
            record: {
                ...record,
                status: 'partial_success',
                resultMessage,
            },
            notice: {
                type: 'warning',
                message: `Sync ปฏิทินสำเร็จบางส่วน: ${resultMessages.join(' · ')}`,
            },
        }
    }

    return {
        record: {
            ...record,
            status: 'success',
            resultMessage,
        },
        notice: {
            type: yearsByStatus.skipped.length > 0 ? 'warning' : 'success',
            message: `Sync ปฏิทินเสร็จสิ้น: ${resultMessages.join(' · ')}`,
        },
    }
}
