import type { ListOfValue } from './ListOfValue'

export type Title = ListOfValue

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

export type SystemTeacher = ListOfValue
export type StudentStatusOption = ListOfValue
export type AdmissionChannel = ListOfValue

export interface HighSchoolListItem {
    id: number
    school_name: string
    status: 'active' | 'inactive'
    created_at: string | null
    created_by: string | null
    updated_at: string | null
    updated_by: string | null
}

export interface HighSchool extends HighSchoolListItem {
    province_id: number | null
    province_name: string | null
    district_id: number | null
    district_name: string | null
    subdistrict_id: number
    subdistrict_name: string | null
    address: string
    latitude: string
    longitude: string
}

export interface HighSchoolPayload {
    school_name: string
    subdistrict_id: number
    latitude: number
    longitude: number
}

export type Province = ListOfValue
export type District = ListOfValue
export type Subdistrict = ListOfValue
export type GuardianRelationship = ListOfValue

export interface StudyPlan {
    id: number
    name_th: string
    name_en: string | null
}

export interface Curriculum {
    id: number
    name_th: string
    name_en: string | null
}

export type SystemDepartment = ListOfValue

export interface SelectOption<T extends string | number = number> {
    label: string
    value: T
}
