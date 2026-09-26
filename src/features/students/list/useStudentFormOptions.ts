import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
    getAdmissionChannels,
    getCurriculumPersonnel,
    getCurriculums,
    getGuardianRelationships,
    getHighSchoolOptions,
    getSystemDepartments,
    getStudentStatuses,
    getTitles,
} from '../../../services/listOfValueService'
import { getStudyPlans } from '../../../services/masterDataService'
import type { ListOfValue } from '../../../types/ListOfValue'
import type { Curriculum, StudyPlan } from '../../../types/MasterData'
import type { StudentDetailResponse } from '../../../types/StudentDetailResponse'

interface StudentFormOptions {
    titles: ListOfValue[]
    curriculums: Curriculum[]
    systemDepartments: ListOfValue[]
    systemTeachers: ListOfValue<string>[]
    studentStatuses: ListOfValue[]
    admissionChannels: ListOfValue[]
    highSchools: ListOfValue[]
    guardianRelationships: ListOfValue[]
    studyPlans: StudyPlan[]
}

const emptyOptions: StudentFormOptions = {
    titles: [],
    curriculums: [],
    systemDepartments: [],
    systemTeachers: [],
    studentStatuses: [],
    admissionChannels: [],
    highSchools: [],
    guardianRelationships: [],
    studyPlans: [],
}

export function useStudentFormOptions(
    enabled: boolean,
    curriculumId?: number,
    editingStudent?: StudentDetailResponse | null,
) {
    const [options, setOptions] = useState<StudentFormOptions>(emptyOptions)
    const [loading, setLoading] = useState(false)
    const [studyPlansLoading, setStudyPlansLoading] = useState(false)
    const [systemTeachersLoading, setSystemTeachersLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) {
            return
        }

        let cancelled = false

        const loadOptions = async () => {
            try {
                setLoading(true)
                setError(null)
                const results = await Promise.allSettled([
                    getTitles(
                        editingStudent?.title_id
                            ? [editingStudent.title_id]
                            : undefined,
                    ),
                    getCurriculums(
                        editingStudent?.curriculum_id
                            ? [editingStudent.curriculum_id]
                            : undefined,
                    ),
                    getSystemDepartments(
                        editingStudent?.system_department_id
                            ? [editingStudent.system_department_id]
                            : undefined,
                    ),
                    getStudentStatuses(
                        editingStudent?.student_status_id
                            ? [editingStudent.student_status_id]
                            : undefined,
                    ),
                    getAdmissionChannels(
                        editingStudent?.admission_channel_id
                            ? [editingStudent.admission_channel_id]
                            : undefined,
                    ),
                    getHighSchoolOptions(
                        editingStudent?.high_school_id
                            ? [editingStudent.high_school_id]
                            : undefined,
                    ),
                    getGuardianRelationships(
                        editingStudent?.guardian_relationship_id
                            ? [editingStudent.guardian_relationship_id]
                            : undefined,
                    ),
                ])

                if (!cancelled) {
                    const [
                        titles,
                        curriculums,
                        systemDepartments,
                        studentStatuses,
                        admissionChannels,
                        highSchools,
                        guardianRelationships,
                    ] = results

                    setOptions((current) => ({
                        ...current,
                        ...(titles.status === 'fulfilled'
                            ? { titles: titles.value }
                            : {}),
                        ...(curriculums.status === 'fulfilled'
                            ? { curriculums: curriculums.value }
                            : {}),
                        ...(systemDepartments.status === 'fulfilled'
                            ? { systemDepartments: systemDepartments.value }
                            : {}),
                        ...(studentStatuses.status === 'fulfilled'
                            ? { studentStatuses: studentStatuses.value }
                            : {}),
                        ...(admissionChannels.status === 'fulfilled'
                            ? { admissionChannels: admissionChannels.value }
                            : {}),
                        ...(highSchools.status === 'fulfilled'
                            ? { highSchools: highSchools.value }
                            : {}),
                        ...(guardianRelationships.status === 'fulfilled'
                            ? { guardianRelationships: guardianRelationships.value }
                            : {}),
                    }))

                    if (results.some((result) => result.status === 'rejected')) {
                        throw new Error('Some form options failed to load')
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    const errorMessage =
                        'โหลดข้อมูลตัวเลือกสำหรับแบบฟอร์มไม่สำเร็จ'
                    setError(errorMessage)
                    message.error(errorMessage)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadOptions()

        return () => {
            cancelled = true
        }
    }, [editingStudent, enabled])

    useEffect(() => {
        if (!enabled || !curriculumId) {
            return
        }

        let cancelled = false

        const loadStudyPlans = async () => {
            try {
                setStudyPlansLoading(true)
                const studyPlans = await getStudyPlans(
                    curriculumId,
                    editingStudent?.study_plan_id
                        ? [editingStudent.study_plan_id]
                        : undefined,
                )

                if (!cancelled) {
                    setOptions((current) => ({ ...current, studyPlans }))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    message.error('โหลดข้อมูลแผนการเรียนไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setStudyPlansLoading(false)
                }
            }
        }

        void loadStudyPlans()

        return () => {
            cancelled = true
        }
    }, [curriculumId, editingStudent, enabled])

    useEffect(() => {
        if (!enabled || !curriculumId) {
            return
        }

        let cancelled = false

        const loadSystemTeachers = async () => {
            try {
                setSystemTeachersLoading(true)
                const systemTeachers = await getCurriculumPersonnel(
                    curriculumId,
                    editingStudent?.teacher_id
                        ? [editingStudent.teacher_id]
                        : undefined,
                )

                if (!cancelled) {
                    setOptions((current) => ({
                        ...current,
                        systemTeachers,
                    }))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    message.error('โหลดข้อมูลอาจารย์ที่ปรึกษาไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setSystemTeachersLoading(false)
                }
            }
        }

        void loadSystemTeachers()

        return () => {
            cancelled = true
        }
    }, [curriculumId, editingStudent, enabled])

    const clearStudyPlans = useCallback(() => {
        setOptions((current) => ({
            ...current,
            studyPlans: [],
            systemTeachers: [],
        }))
    }, [])

    const clearSystemTeachers = useCallback(() => {
        setOptions((current) => ({ ...current, systemTeachers: [] }))
    }, [])

    return {
        options,
        loading,
        studyPlansLoading,
        systemTeachersLoading,
        error,
        clearStudyPlans,
        clearSystemTeachers,
    }
}
