import { Card } from 'antd'
import type { Dayjs } from 'dayjs'
import { toBuddhistYear } from '../../utils/academicYear'
import {
    ACADEMIC_EVENT_DISPLAY,
    SHORT_THAI_WEEKDAYS,
    THAI_MONTHS,
} from './academicCalendar.constants'
import {
    getEventsForDate,
    getHighestPriorityEventType,
    type AcademicCalendarEvent,
} from './academicCalendar.utils'

interface AcademicCalendarMonthProps {
    monthDate: Dayjs
    events: AcademicCalendarEvent[]
    selectedDate: Dayjs | null
    onSelectDate: (date: Dayjs) => void
}

export default function AcademicCalendarMonth({
    monthDate,
    events,
    selectedDate,
    onSelectDate,
}: AcademicCalendarMonthProps) {
    const firstDay = monthDate.startOf('month')
    const daysInMonth = firstDay.daysInMonth()
    const cells = Array.from(
        { length: Math.ceil((firstDay.day() + daysInMonth) / 7) * 7 },
        (_, index) => {
            const date = index - firstDay.day() + 1
            return date > 0 && date <= daysInMonth ? date : null
        },
    )

    return (
        <Card
            className="academic-month-card"
            title={`${THAI_MONTHS[firstDay.month()]} ${toBuddhistYear(firstDay.year())}`}
            size="small"
        >
            <div className="academic-month-grid" role="grid">
                {SHORT_THAI_WEEKDAYS.map((weekday, index) => (
                    <div
                        key={weekday}
                        className={index === 0 || index === 6
                            ? 'academic-weekday academic-weekend'
                            : 'academic-weekday'}
                        role="columnheader"
                    >
                        {weekday}
                    </div>
                ))}
                {cells.map((date, index) => {
                    if (date === null) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="academic-calendar-day academic-calendar-day-empty"
                                role="gridcell"
                            />
                        )
                    }

                    const currentDate = firstDay.date(date)
                    const matchingEvents = getEventsForDate(
                        events,
                        currentDate,
                    )
                    const displayType = getHighestPriorityEventType(
                        matchingEvents,
                    )
                    const weekend =
                        currentDate.day() === 0 || currentDate.day() === 6
                    const classes = [
                        'academic-calendar-day',
                        weekend ? 'academic-calendar-day-weekend' : '',
                        displayType
                            ? ACADEMIC_EVENT_DISPLAY[displayType].className
                            : '',
                        selectedDate?.isSame(currentDate, 'day')
                            ? 'academic-calendar-day-selected'
                            : '',
                    ].filter(Boolean).join(' ')
                    const eventTitles = matchingEvents
                        .map((event) => event.title)
                        .join('\n')

                    return (
                        <button
                            key={date}
                            type="button"
                            className={classes}
                            role="gridcell"
                            title={eventTitles || undefined}
                            aria-pressed={selectedDate?.isSame(
                                currentDate,
                                'day',
                            )}
                            aria-label={matchingEvents.length > 0
                                ? `${date} ${THAI_MONTHS[firstDay.month()]}: มี ${matchingEvents.length} กำหนดการ`
                                : `${date} ${THAI_MONTHS[firstDay.month()]}`}
                            onClick={() => onSelectDate(currentDate)}
                        >
                            {String(date).padStart(2, '0')}
                        </button>
                    )
                })}
            </div>
        </Card>
    )
}
