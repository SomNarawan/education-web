import type { AppRole } from './Auth'

export type StudentGroup = 'advisor' | 'department' | 'faculty'
export type StudentStatus = 'graduated'

export const STUDENT_GROUPS: StudentGroup[] = [
    'advisor',
    'department',
    'faculty',
]

export const STUDENT_STATUSES: StudentStatus[] = ['graduated']

export const ALLOWED_ROLES_BY_STUDENT_GROUP: Record<
    StudentGroup,
    AppRole[]
> = {
    advisor: ['teacher'],
    department: ['teacher', 'admin'],
    faculty: ['teacher', 'admin'],
}
