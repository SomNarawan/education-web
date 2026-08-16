export interface Title {
    id: number
    title_abbr_th: string
    title_abbr_en: string
    title_name_th: string
    title_name_en: string
}

export type MasterDataStatus = 'active' | 'inactive'

export type ManagedMasterDataResource =
    | 'titles'
    | 'note-types'
    | 'import-types'
    | 'relationships'
    | 'student-statuses'
    | 'admission-channels'

export interface ManagedMasterDataRecord {
    id: number
    status: MasterDataStatus
    created_at: string | null
    created_by: string | null
    updated_at: string | null
    updated_by: string | null
    [key: string]: string | number | null
}

export type ManagedMasterDataPayload = Record<string, string>

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
    province_id: number
    province_name: string
    district_id: number
    district_name: string
    subdistrict_id: number
    subdistrict_name: string
    latitude: string
    longitude: string
    status: 'active' | 'inactive'
    created_at: string
    created_by: string
    updated_at: string
    updated_by: string
}

export interface HighSchoolPayload {
    school_name: string
    subdistrict_id: number
    latitude: number
    longitude: number
}

export interface Province {
    id: number
    province_name: string
}

export interface District {
    id: number
    province_id: number
    district_name: string
}

export interface Subdistrict {
    id: number
    district_id: number
    subdistrict_name: string
    postal_code?: string
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
