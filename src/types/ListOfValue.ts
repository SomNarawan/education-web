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
    | 'curriculum-personnel'
    | 'system-departments'
    | 'system-faculties'
    | 'curriculums'

export interface ListOfValue {
    id: number
    name_th: string
    name_en: string | null
}
