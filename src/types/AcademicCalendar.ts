export type AcademicTermCode = 'first' | 'second' | 'summer'
export type AcademicCurriculumType = 'thai' | 'international'

export interface AcademicCalendarEventData {
    id: string
    title: string
    description: string | null
    eventType: string
    startDate: string
    endDate: string
    isHoliday: boolean
}

export interface AcademicCalendarTermData {
    code: AcademicTermCode
    nameTh: string
    curriculum: AcademicCurriculumType
    curriculumNameTh: string
    startDate: string
    endDate: string
    events: AcademicCalendarEventData[]
}

export interface AcademicCalendarData {
    academicYear: number | null
    availableAcademicYears: number[]
    terms: AcademicCalendarTermData[]
}

export interface SyncAcademicCalendarsRequest {
    academic_years: number[]
}
