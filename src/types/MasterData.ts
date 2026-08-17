export interface Title {
    id: number
    title_abbr_th: string
    title_abbr_en: string
}

export interface Teacher {
    id: number
    full_name_th: string
}

export interface StudentStatusOption {
    id: number
    status_name: string
}

export interface AdmissionChannel {
    id: number
    channel_name: string
}

export interface HighSchool {
    id: number
    school_name: string
}

export interface GuardianRelationship {
    id: number
    relationship_name: string
}

export interface StudyPlan {
    id: number
    name_th: string
}

export interface SystemDepartment {
    id: number
    th_name: string
}

export interface SelectOption<T extends string | number = number> {
    label: string
    value: T
}
