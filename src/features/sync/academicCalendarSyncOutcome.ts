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
    const resultMessage = record.resultMessage?.replace(/\n/g, ' · ')

    if (result.status === 'failed') {
        return {
            record,
            notice: {
                type: 'error',
                message: resultMessage
                    ? `Sync ปฏิทินไม่สำเร็จ: ${resultMessage}`
                    : syncFailureMessage,
            },
        }
    }

    if (result.status === 'partial_success') {
        return {
            record,
            notice: {
                type: 'warning',
                message: resultMessage
                    ? `Sync ปฏิทินสำเร็จบางส่วน: ${resultMessage}`
                    : 'Sync ปฏิทินสำเร็จบางส่วน',
            },
        }
    }

    return {
        record,
        notice: {
            type: result.skipped_count > 0 ? 'warning' : 'success',
            message: resultMessage
                ? `Sync ปฏิทินเสร็จสิ้น: ${resultMessage}`
                : 'Sync ปฏิทินสำเร็จ',
        },
    }
}
