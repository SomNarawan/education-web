import dayjs, { type Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export const BANGKOK_TIME_ZONE = 'Asia/Bangkok'

type DateValue = string | number | Date | null | undefined

function parseBangkokDate(value: DateValue): Dayjs | null {
    if (value === null || value === undefined || value === '') return null

    const hasExplicitTimeZone =
        typeof value === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    const date =
        typeof value === 'string' && !hasExplicitTimeZone
            ? dayjs.tz(value, BANGKOK_TIME_ZONE)
            : dayjs(value).tz(BANGKOK_TIME_ZONE)

    return date.isValid() ? date : null
}

function formatBuddhistDate(date: Dayjs): string {
    return `${date.format('DD/MM')}/${date.year() + 543}`
}

export function formatThaiDate(value: DateValue): string {
    const date = parseBangkokDate(value)
    return date ? formatBuddhistDate(date) : '-'
}

export function formatThaiDateTime(value: DateValue): string {
    const date = parseBangkokDate(value)

    return date
        ? `${formatBuddhistDate(date)} ${date.format('HH:mm')} น.`
        : '-'
}
