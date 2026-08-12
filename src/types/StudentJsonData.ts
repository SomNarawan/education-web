import type { CurriculumEnrollmentRecord } from './CurriculumDetail'
import type { StudentCourseGroupPerformance } from './StudentCourseGroupPerformance'
import type { StudentSemesterPerformance } from './StudentSemesterPerformance'

export interface StudentEnrollmentData {
    student_code: string
    enrollment: CurriculumEnrollmentRecord[]
}

export interface StudentEnrollmentStatusesData {
    student_code: string
    enrollment_not_pass: CurriculumEnrollmentRecord[]
    enrollment_pass: CurriculumEnrollmentRecord[]
    enrollment_over: CurriculumEnrollmentRecord[]
    missing_sections: string[]
}

export interface StudentCreditStatusRecord {
    type: string
    credits_study: number
    credits_all: number
    gpa: number
}

export interface StudentGraphData {
    student_code: string
    by_credit: StudentCreditStatusRecord[]
    by_group: Record<string, StudentCourseGroupPerformance[]>
    by_semester: StudentSemesterPerformance[]
    missing_sections: string[]
}
