import type { ListOfValue } from './ListOfValue'
import type { Curriculum } from './MasterData'

export interface StudentCreateFormOptions {
    titles: ListOfValue[]
    curriculums: Curriculum[]
    system_departments: ListOfValue[]
    student_statuses: ListOfValue[]
    admission_channels: ListOfValue[]
    high_schools: ListOfValue[]
    guardian_relationships: ListOfValue[]
}
