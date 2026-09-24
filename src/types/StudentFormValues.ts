import type { CreateStudentRequest } from './StudentRequest'

type BackendManagedStudentField = 'department_id'

export type StudentFormValues = Omit<
    CreateStudentRequest,
    BackendManagedStudentField
>
