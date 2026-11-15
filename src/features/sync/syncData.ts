import type {
    SyncExecutionStatus,
    SyncHistoryRecord,
    SyncResult,
    SyncStatus,
    SyncTableDataType,
    SyncTableRecord,
    SyncType,
} from '../../types/SyncData'
import { formatThaiDateTime } from '../../utils/dateFormat'

const syncOptions: {
    label: string
    value: SyncTableDataType
}[] = [
    { label: 'คณะ', value: 'faculty' },
    { label: 'ภาควิชา', value: 'department' },
    { label: 'ปฏิทินการศึกษา', value: 'academic-calendar' },
]

const syncTypeByDataType: Record<SyncTableDataType, SyncType> = {
    faculty: 1,
    department: 2,
    'academic-calendar': 3,
}

export const syncFailureMessage = 'Sync ข้อมูลไม่สำเร็จ'

const skipReasonLabels = {
    unchanged: 'ข้อมูลเป็นปัจจุบันแล้ว',
    invalid_source_data: 'ข้อมูลจากระบบต้นทางไม่ครบหรือไม่ถูกต้อง',
    duplicate_source_id: 'พบรหัสซ้ำจากระบบต้นทาง',
    faculty_not_found: 'ไม่พบคณะที่ใช้งานอยู่สำหรับภาควิชา',
} as const

function createWaitingRecord(
    key: SyncTableDataType,
    label: string,
): SyncTableRecord {
    return {
        key,
        label,
        inserted: null,
        updated: null,
        inactivated: null,
        skipped: null,
        status: 'waiting',
        syncedAt: null,
        resultMessage: null,
    }
}

function getSyncStatus(status: SyncExecutionStatus | null): SyncStatus {
    if (status === 'running') return 'running'
    if (status === 'success') return 'success'
    if (status === 'failed') return 'failed'

    return 'waiting'
}

function formatSyncDate(value: string | null | undefined): string | null {
    return value ? formatThaiDateTime(value) : null
}

function getSyncResultMessage(
    status: SyncStatus,
    errorMessage: string | null,
): string | null {
    return status === 'failed'
        ? errorMessage || syncFailureMessage
        : null
}

export function mapHistoryToRecords(
    history: SyncHistoryRecord[],
): SyncTableRecord[] {
    return syncOptions.map((option) => {
        const sync = history.find(
            (item) => item.sync_type === syncTypeByDataType[option.value],
        )

        if (!sync) {
            return createWaitingRecord(option.value, option.label)
        }

        const status = getSyncStatus(sync.status)

        return {
            key: option.value,
            label: sync.sync_type_name || option.label,
            inserted: sync.inserted_count,
            updated: sync.updated_count,
            inactivated: sync.inactivated_count,
            skipped: sync.skipped_count,
            status,
            syncedAt: formatSyncDate(sync.updated_at ?? sync.created_at),
            resultMessage: getSyncResultMessage(status, sync.error_message),
        }
    })
}

export function mapSyncResult(result: SyncResult): Partial<SyncTableRecord> {
    const status = getSyncStatus(result.status)
    const hasProblematicSkip = result.skip_reasons?.some(
        (reason) => reason.code !== 'unchanged',
    ) ?? false
    const displayStatus = status === 'success' && hasProblematicSkip
        ? 'partial_success'
        : status
    const skipReasonMessage = result.skip_reasons
        ?.map((reason) =>
            `ข้าม (${skipReasonLabels[reason.code]}): ${reason.count.toLocaleString()} รายการ`,
        )
        .join('\n') || null

    return {
        inserted: result.inserted_count,
        updated: result.updated_count,
        inactivated: result.inactivated_count,
        skipped: result.skipped_count,
        status: displayStatus,
        syncedAt: formatSyncDate(result.updated_at ?? result.created_at),
        resultMessage: getSyncResultMessage(displayStatus, result.error_message) ??
            skipReasonMessage,
    }
}
