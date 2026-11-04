import type { AcademicTermCode } from '../../types/AcademicCalendar'

export type AcademicCalendarEventType = 'academic' | 'holiday'

interface AcademicCalendarEventDisplay {
    label: string
    className: string
    color: string
}

export const ACADEMIC_TERM_ORDER: AcademicTermCode[] = [
    'first',
    'second',
    'summer',
]

export const THAI_MONTHS = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
]

export const SHORT_THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export const THAI_WEEKDAYS = [
    'วันอาทิตย์',
    'วันจันทร์',
    'วันอังคาร',
    'วันพุธ',
    'วันพฤหัสบดี',
    'วันศุกร์',
    'วันเสาร์',
]

export const ACADEMIC_EVENT_DISPLAY: Record<
    AcademicCalendarEventType,
    AcademicCalendarEventDisplay
> = {
    academic: {
        label: 'กำหนดการศึกษา',
        className: 'academic-calendar-day-academic',
        color: 'blue',
    },
    holiday: {
        label: 'วันหยุด/วันสำคัญ',
        className: 'academic-calendar-day-holiday',
        color: 'red',
    },
}

export const ACADEMIC_EVENT_TYPE_PRIORITY: Record<
    AcademicCalendarEventType,
    number
> = {
    academic: 1,
    holiday: 2,
}
