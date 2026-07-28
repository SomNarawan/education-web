import type {
    CurriculumEnrollmentRecord,
    FailedPlannedCourseRow,
} from '../types/CurriculumDetail'

export interface StudentFailedPlannedCoursesSectionProps {
    studentCode: string
}

export type EnrollmentRowsModule = {
    default: CurriculumEnrollmentRecord[]
}

export type EnrollmentRowsImporters = Record<
    string,
    () => Promise<EnrollmentRowsModule>
>

export interface CourseResultTableProps {
    title: string
    courseNameTitle: string
    rows: FailedPlannedCourseRow[]
    loading: boolean
}
