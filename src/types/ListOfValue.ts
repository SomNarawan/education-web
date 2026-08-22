export type ListOfValueType =
    | 'titles'
    | 'admission-channels'
    | 'relationships'
    | 'student-statuses'
    | 'note-types'
    | 'import-types'
    | 'high-schools'
    | 'provinces'
    | 'districts'
    | 'subdistricts'
    | 'teachers'
    | 'system-departments'
    | 'system-faculties'

export interface ListOfValue {
    id: number
    name_th: string
    name_en: string | null
}

export interface ListOfValueParams {
    province_id?: number
    district_id?: number
    department_id?: number
}
