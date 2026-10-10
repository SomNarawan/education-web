import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
    getAdmissionChannels,
    getCurriculumPersonnel,
    getCurriculums,
    getGuardianRelationships,
    getHighSchoolOptions,
    getSystemDepartments,
    getStudySemesters,
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
    studySemesters: ListOfValue[]
    admissionChannels: ListOfValue[]
    highSchools: ListOfValue[]
    guardianRelationships: ListOfValue[]
    studyPlans: StudyPlan[]
}

interface OptionsRequestState {
    key: string | null
    loading: boolean
}

const emptyOptions: StudentFormOptions = {
    titles: [],
    curriculums: [],
    systemDepartments: [],
    systemTeachers: [],
    studentStatuses: [],
    studySemesters: [],
    admissionChannels: [],
    highSchools: [],
    guardianRelationships: [],
    studyPlans: [],
}

const idleRequest: OptionsRequestState = {
    key: null,
    loading: false,
}

function isRequestLoading(
    enabled: boolean,
    key: string | null,
    request: OptionsRequestState,
): boolean {
    return enabled && key !== null && (request.key !== key || request.loading)
}

function includeId<T extends string | number>(
    value: T | null | undefined,
): T[] | undefined {
    return value == null ? undefined : [value]
}

function addMissingOption<T extends { id: string | number }>(
    options: T[],
    option: T | null,
): T[] {
    if (!option || options.some((item) => item.id === option.id)) {
        return options
    }

    return [option, ...options]
}

export function useStudentFormOptions(
    enabled: boolean,
    curriculumId?: number,
    editingStudent?: StudentDetailResponse | null,
) {
    const [options, setOptions] = useState<StudentFormOptions>(emptyOptions)
    const [optionsRequest, setOptionsRequest] =
        useState<OptionsRequestState>(idleRequest)
    const [studyPlansRequest, setStudyPlansRequest] =
        useState<OptionsRequestState>(idleRequest)
    const [systemTeachersRequest, setSystemTeachersRequest] =
        useState<OptionsRequestState>(idleRequest)
    const [error, setError] = useState<string | null>(null)
    const optionsKey = editingStudent ? `student:${editingStudent.id}` : 'create'
    const curriculumOptionsKey = curriculumId
        ? `${optionsKey}:curriculum:${curriculumId}`
        : null

    useEffect(() => {
        if (!enabled) {
            return
        }

        let cancelled = false

        const loadOptions = async () => {
            const loadOption = async <Key extends keyof StudentFormOptions>(
                key: Key,
                request: Promise<StudentFormOptions[Key]>,
            ) => {
                const value = await request

                if (!cancelled) {
                    setOptions((current) => ({ ...current, [key]: value }))
                }
            }

            try {
                setOptionsRequest({ key: optionsKey, loading: true })
                setError(null)
                const results = await Promise.allSettled([
                    loadOption(
                        'titles',
                        getTitles(includeId(editingStudent?.title_id)),
                    ),
                    loadOption(
                        'curriculums',
                        getCurriculums().then((curriculums) =>
                            addMissingOption(
                                curriculums,
                                editingStudent?.curriculum_id != null &&
                                    editingStudent.curriculum_code?.trim()
                                    ? {
                                          id: editingStudent.curriculum_id,
                                          name_th:
                                              editingStudent.curriculum_code,
                                          name_en: null,
                                      }
                                    : null,
                            ),
                        ),
                    ),
                    loadOption(
                        'systemDepartments',
                        getSystemDepartments(
                            includeId(editingStudent?.system_department_id),
                        ),
                    ),
                    loadOption(
                        'studentStatuses',
                        getStudentStatuses(
                            includeId(editingStudent?.student_status_id),
                        ),
                    ),
                    loadOption('studySemesters', getStudySemesters()),
                    loadOption(
                        'admissionChannels',
                        getAdmissionChannels(
                            includeId(editingStudent?.admission_channel_id),
                        ),
                    ),
                    loadOption(
                        'highSchools',
                        getHighSchoolOptions(
                            includeId(editingStudent?.high_school_id),
                        ),
                    ),
                    loadOption(
                        'guardianRelationships',
                        getGuardianRelationships(
                            includeId(
                                editingStudent?.guardian_relationship_id,
                            ),
                        ),
                    ),
                ])

                if (
                    !cancelled &&
                    results.some((result) => result.status === 'rejected')
                ) {
                    throw new Error('Some form options failed to load')
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
                    setOptionsRequest({ key: optionsKey, loading: false })
                }
            }
        }

        loadOptions()

        return () => {
            cancelled = true
        }
    }, [editingStudent, enabled, optionsKey])

    useEffect(() => {
        if (!enabled || !curriculumId) {
            return
        }

        let cancelled = false

        const loadStudyPlans = async () => {
            try {
                setStudyPlansRequest({
                    key: curriculumOptionsKey,
                    loading: true,
                })
                const studyPlans = addMissingOption(
                    await getStudyPlans(curriculumId),
                    editingStudent?.curriculum_id === curriculumId &&
                        editingStudent.study_plan_id != null &&
                        editingStudent.study_plan_name_th?.trim()
                        ? {
                              id: editingStudent.study_plan_id,
                              name_th: editingStudent.study_plan_name_th,
                              name_en: editingStudent.study_plan_name,
                          }
                        : null,
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
                    setStudyPlansRequest({
                        key: curriculumOptionsKey,
                        loading: false,
                    })
                }
            }
        }

        void loadStudyPlans()

        return () => {
            cancelled = true
        }
    }, [curriculumId, curriculumOptionsKey, editingStudent, enabled])

    useEffect(() => {
        if (!enabled || !curriculumId) {
            return
        }

        let cancelled = false

        const loadSystemTeachers = async () => {
            try {
                setSystemTeachersRequest({
                    key: curriculumOptionsKey,
                    loading: true,
                })
                const systemTeachers = addMissingOption(
                    await getCurriculumPersonnel(curriculumId),
                    editingStudent?.curriculum_id === curriculumId &&
                        editingStudent.teacher_id != null &&
                        editingStudent.teacher_full_name?.trim()
                        ? {
                              id: editingStudent.teacher_id,
                              name_th: editingStudent.teacher_full_name,
                              name_en: null,
                          }
                        : null,
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
                    setSystemTeachersRequest({
                        key: curriculumOptionsKey,
                        loading: false,
                    })
                }
            }
        }

        void loadSystemTeachers()

        return () => {
            cancelled = true
        }
    }, [curriculumId, curriculumOptionsKey, editingStudent, enabled])

    const clearStudyPlans = useCallback(() => {
        setOptions((current) => ({
            ...current,
            studyPlans: [],
            systemTeachers: [],
        }))
    }, [])

    return {
        options,
        loading: isRequestLoading(enabled, optionsKey, optionsRequest),
        studyPlansLoading: isRequestLoading(
            enabled,
            curriculumOptionsKey,
            studyPlansRequest,
        ),
        systemTeachersLoading: isRequestLoading(
            enabled,
            curriculumOptionsKey,
            systemTeachersRequest,
        ),
        error,
        clearStudyPlans,
    }
}
