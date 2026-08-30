import type { CreateStudentRequest } from './StudentRequest'

type BackendManagedStudentField =
    | 'department_id'
    | 'study_year'
    | 'study_semester'
    | 'study_period'

export type StudentFormValues = Omit<
    CreateStudentRequest,
    BackendManagedStudentField
>
