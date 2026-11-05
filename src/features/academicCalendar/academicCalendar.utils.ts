import dayjs, { type Dayjs } from 'dayjs'
import type { AcademicCalendarEventData } from '../../types/AcademicCalendar'
import { toBuddhistYear } from '../../utils/academicYear'
import {
    ACADEMIC_EVENT_TYPE_PRIORITY,
    THAI_MONTHS,
    THAI_WEEKDAYS,
    type AcademicCalendarEventType,
} from './academicCalendar.constants'

export interface AcademicCalendarEvent {
    id: string
    title: string
    description: string | null
    startDate: Dayjs
    endDate: Dayjs
    type: AcademicCalendarEventType
}

function getCalendarEventType(
    event: AcademicCalendarEventData,
): AcademicCalendarEventType {
    return event.eventType === 'holiday' ? 'holiday' : 'academic'
}

export function getHighestPriorityEventType(
    events: AcademicCalendarEvent[],
): AcademicCalendarEventType | undefined {
    return events.reduce<AcademicCalendarEventType | undefined>(
        (selectedType, event) => {
            if (
                selectedType === undefined ||
                ACADEMIC_EVENT_TYPE_PRIORITY[event.type] >
                    ACADEMIC_EVENT_TYPE_PRIORITY[selectedType]
            ) {
                return event.type
            }

            return selectedType
        },
        undefined,
    )
}

export function mapAcademicCalendarEvents(
    sourceEvents: AcademicCalendarEventData[],
): AcademicCalendarEvent[] {
    return sourceEvents
        .map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            startDate: dayjs(event.startDate),
            endDate: dayjs(event.endDate),
            type: getCalendarEventType(event),
        }))
        .sort(
            (firstEvent, secondEvent) =>
                firstEvent.startDate.valueOf() -
                secondEvent.startDate.valueOf(),
        )
}

export function getMonthsInRange(
    startDate: string,
    endDate: string,
): Dayjs[] {
    const startMonth = dayjs(startDate).startOf('month')
    const endMonth = dayjs(endDate).startOf('month')

    if (
        !startMonth.isValid() ||
        !endMonth.isValid() ||
        endMonth.isBefore(startMonth)
    ) {
        return []
    }

    const months: Dayjs[] = []
    let currentMonth = startMonth

    while (!currentMonth.isAfter(endMonth, 'month')) {
        months.push(currentMonth)
        currentMonth = currentMonth.add(1, 'month')
    }

    return months
}

function formatShortDate(date: Dayjs): string {
    return `${date.date()} ${THAI_MONTHS[date.month()]} ${toBuddhistYear(date.year())}`
}

export function formatCalendarDateRange(
    startDate: Dayjs,
    endDate: Dayjs,
): string {
    if (startDate.isSame(endDate, 'day')) {
        return formatShortDate(startDate)
    }

    if (startDate.year() === endDate.year()) {
        const start = `${startDate.date()} ${THAI_MONTHS[startDate.month()]}`
        return `${start} - ${formatShortDate(endDate)}`
    }

    return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`
}

export function formatCalendarFullDate(date: Dayjs): string {
    return `${THAI_WEEKDAYS[date.day()]}ที่ ${formatShortDate(date)}`
}

export function getEventsForDate(
    events: AcademicCalendarEvent[],
    date: Dayjs,
): AcademicCalendarEvent[] {
    return events.filter(
        (event) =>
            !date.isBefore(event.startDate, 'day') &&
            !date.isAfter(event.endDate, 'day'),
    )
}
