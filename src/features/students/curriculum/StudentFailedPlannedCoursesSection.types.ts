import type { FailedPlannedCourseRow } from '../../../types/CurriculumDetail'

export interface StudentFailedPlannedCoursesSectionProps {
    studentCode: string
}

export interface CourseResultTableProps {
    title: string
    courseNameTitle: string
    rows: FailedPlannedCourseRow[]
    loading: boolean
}
