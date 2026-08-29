export type AppRole = 'admin' | 'teacher'

export interface AuthUser {
    id?: number
    nontriId?: number | string | null
    systemTeacherId?: number | null
    name?: string
    roles: AppRole[]
    departmentId?: number | null
    facultyId?: number | null
}

export interface MeResponse {
    id?: number
    nontri_id?: number | string | null
    teacher_id?: number | string | null
    name?: string
    role?: AppRole[]
    current_role?: AppRole
    department_id?: number | string | null
    faculty_id?: number | string | null
}
