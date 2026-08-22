import type { ListOfValue } from '../types/ListOfValue'
import { getTeachers } from './listOfValueService'

export async function getTeachersByDepartment(
    departmentId: number,
): Promise<ListOfValue[]> {
    return getTeachers(departmentId)
}
