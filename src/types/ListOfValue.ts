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
    | 'system-teachers'
    | 'system-departments'
    | 'system-faculties'

export interface ListOfValue {
    id: number
    name_th: string
    name_en: string | null
}
