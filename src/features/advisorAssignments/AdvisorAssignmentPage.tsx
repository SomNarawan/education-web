import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    ClearOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    SaveOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { Button, Card, Input, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import {
    getStudyingStudentsBySystemTeacher,
    getStudyingStudentsWithoutAdvisor,
    updateStudentAdvisors,
} from '../../services/advisorAssignmentService'
import {
    getCurriculumPersonnel,
    getCurriculums,
} from '../../services/listOfValueService'
import { getStudyPlans } from '../../services/masterDataService'
import type { AdvisorAssignmentStudent } from '../../types/AdvisorAssignment'
import type {
    Curriculum,
    SelectOption,
    StudyPlan,
} from '../../types/MasterData'
import ListOfValueSelect from '../../components/custom/ListOfValueSelect'
import { toListOfValueOptions } from '../../utils/listOfValue'

const { Text } = Typography

type StudentListSide = 'unassigned' | 'assigned'

interface DragPayload {
    side: StudentListSide
    studentIds: number[]
}

const studentColumns: ColumnsType<AdvisorAssignmentStudent> = [
    {
        title: 'รหัสนิสิต',
        dataIndex: 'student_code',
        key: 'student_code',
        width: 140,
    },
    {
        title: 'ชื่อ - สกุล',
        dataIndex: 'full_name_th',
        key: 'full_name_th',
    },
]

function sortStudents(students: AdvisorAssignmentStudent[]) {
    return [...students].sort((first, second) =>
        (first.student_code ?? '').localeCompare(
            second.student_code ?? '',
            'th',
        ),
    )
}

function filterStudents(
    students: AdvisorAssignmentStudent[],
    searchText: string,
) {
    const keyword = searchText.trim().toLocaleLowerCase('th')

    if (!keyword) return students

    return students.filter(
        (student) =>
            (student.student_code ?? '')
                .toLocaleLowerCase('th')
                .includes(keyword) ||
            student.full_name_th.toLocaleLowerCase('th').includes(keyword),
    )
}

export default function AdvisorAssignmentPage() {
    const [curriculums, setCurriculums] = useState<Curriculum[]>([])
    const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
    const [systemTeacherOptions, setSystemTeacherOptions] = useState<
        SelectOption<string>[]
    >([])
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<
        number | undefined
    >()
    const [selectedStudyPlanId, setSelectedStudyPlanId] = useState<
        number | undefined
    >()
    const [selectedTeacherId, setSelectedTeacherId] = useState<
        string | undefined
    >()
    const [unassignedStudents, setUnassignedStudents] = useState<
        AdvisorAssignmentStudent[]
    >([])
    const [assignedStudents, setAssignedStudents] = useState<
        AdvisorAssignmentStudent[]
    >([])
    const [initialAssignedStudentIds, setInitialAssignedStudentIds] = useState<
        number[]
    >([])
    const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<
        number[]
    >([])
    const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>(
        [],
    )
    const [unassignedSearchText, setUnassignedSearchText] = useState('')
    const [assignedSearchText, setAssignedSearchText] = useState('')
    const [loadingCurriculums, setLoadingCurriculums] = useState(false)
    const [loadingStudyPlans, setLoadingStudyPlans] = useState(false)
    const [loadingSystemTeachers, setLoadingSystemTeachers] = useState(false)
    const [curriculumsError, setCurriculumsError] = useState<string | null>(
        null,
    )
    const [studyPlansError, setStudyPlansError] = useState<string | null>(null)
    const [systemTeachersError, setSystemTeachersError] = useState<
        string | null
    >(null)
    const [loadingUnassigned, setLoadingUnassigned] = useState(false)
    const [loadingAssigned, setLoadingAssigned] = useState(false)
    const [saving, setSaving] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)
    const [dragPayload, setDragPayload] = useState<DragPayload | null>(null)

    useEffect(() => {
        let active = true

        const loadCurriculums = async () => {
            try {
                setLoadingCurriculums(true)
                setCurriculumsError(null)
                const curriculumData = await getCurriculums()

                if (!active) return

                setCurriculums(curriculumData)
            } catch (error) {
                console.error(error)
                const errorMessage = 'โหลดข้อมูลหลักสูตรไม่สำเร็จ'
                setCurriculumsError(errorMessage)
                message.error(errorMessage)
            } finally {
                if (active) setLoadingCurriculums(false)
            }
        }

        void loadCurriculums()

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (!selectedCurriculumId) return

        let active = true

        const loadCurriculumStudyPlans = async () => {
            try {
                setLoadingStudyPlans(true)
                setStudyPlansError(null)
                const studyPlanData = await getStudyPlans(
                    selectedCurriculumId,
                )

                if (!active) return

                setStudyPlans(studyPlanData)
            } catch (error) {
                console.error(error)
                const errorMessage = 'โหลดข้อมูลแผนการเรียนไม่สำเร็จ'
                setStudyPlansError(errorMessage)
                message.error(errorMessage)
            } finally {
                if (active) setLoadingStudyPlans(false)
            }
        }

        void loadCurriculumStudyPlans()

        return () => {
            active = false
        }
    }, [selectedCurriculumId])

    useEffect(() => {
        if (!selectedCurriculumId) return

        let active = true

        const loadCurriculumPersonnel = async () => {
            try {
                setLoadingSystemTeachers(true)
                setSystemTeachersError(null)
                const systemTeachers =
                    await getCurriculumPersonnel(selectedCurriculumId)

                if (!active) return

                setSystemTeacherOptions(toListOfValueOptions(systemTeachers))
            } catch (error) {
                console.error(error)
                const errorMessage = 'โหลดข้อมูลอาจารย์ไม่สำเร็จ'
                setSystemTeachersError(errorMessage)
                message.error(errorMessage)
            } finally {
                if (active) setLoadingSystemTeachers(false)
            }
        }

        void loadCurriculumPersonnel()

        return () => {
            active = false
        }
    }, [selectedCurriculumId])

    useEffect(() => {
        if (!selectedStudyPlanId || !selectedTeacherId) return

        let active = true

        const loadStudentLists = async () => {
            try {
                setLoadingUnassigned(true)
                setLoadingAssigned(true)

                const [unassigned, assigned] = await Promise.all([
                    getStudyingStudentsWithoutAdvisor(selectedStudyPlanId),
                    getStudyingStudentsBySystemTeacher(
                        selectedTeacherId,
                        selectedStudyPlanId,
                    ),
                ])

                if (!active) return

                setUnassignedStudents(sortStudents(unassigned))
                setAssignedStudents(sortStudents(assigned))
                setInitialAssignedStudentIds(
                    assigned
                        .map((student) => student.id)
                        .filter((id) => Number.isInteger(id) && id > 0),
                )
            } catch (error) {
                console.error(error)
                message.error('โหลดรายชื่อนิสิตไม่สำเร็จ')
            } finally {
                if (active) {
                    setLoadingUnassigned(false)
                    setLoadingAssigned(false)
                }
            }
        }

        loadStudentLists()

        return () => {
            active = false
        }
    }, [reloadKey, selectedStudyPlanId, selectedTeacherId])

    const filteredUnassignedStudents = useMemo(
        () => filterStudents(unassignedStudents, unassignedSearchText),
        [unassignedSearchText, unassignedStudents],
    )
    const filteredAssignedStudents = useMemo(
        () => filterStudents(assignedStudents, assignedSearchText),
        [assignedSearchText, assignedStudents],
    )
    const assignmentChanges = useMemo(() => {
        const initialIdSet = new Set(initialAssignedStudentIds)
        const currentAssignedIds = assignedStudents
            .map((student) => student.id)
            .filter((id) => Number.isInteger(id) && id > 0)
        const currentIdSet = new Set(currentAssignedIds)

        return {
            currentAssignedIds,
            assignStudentIds: currentAssignedIds.filter(
                (id) => !initialIdSet.has(id),
            ),
            removeStudentIds: initialAssignedStudentIds.filter(
                (id) => !currentIdSet.has(id),
            ),
        }
    }, [assignedStudents, initialAssignedStudentIds])
    const hasAssignmentChanges =
        assignmentChanges.assignStudentIds.length > 0 ||
        assignmentChanges.removeStudentIds.length > 0

    const moveStudents = (
        sourceSide: StudentListSide,
        studentIds: number[],
    ) => {
        if (!selectedTeacherId || studentIds.length === 0) return

        const idSet = new Set(studentIds)

        if (sourceSide === 'unassigned') {
            const movingStudents = unassignedStudents.filter((student) =>
                idSet.has(student.id),
            )

            setUnassignedStudents((students) =>
                students.filter((student) => !idSet.has(student.id)),
            )
            setAssignedStudents((students) =>
                sortStudents([
                    ...students.filter(
                        (student) => !idSet.has(student.id),
                    ),
                    ...movingStudents,
                ]),
            )
            setSelectedUnassignedIds([])
        } else {
            const movingStudents = assignedStudents.filter((student) =>
                idSet.has(student.id),
            )

            setAssignedStudents((students) =>
                students.filter((student) => !idSet.has(student.id)),
            )
            setUnassignedStudents((students) =>
                sortStudents([
                    ...students.filter(
                        (student) => !idSet.has(student.id),
                    ),
                    ...movingStudents,
                ]),
            )
            setSelectedAssignedIds([])
        }
    }

    const handleDragStart = (
        event: DragEvent<HTMLElement>,
        side: StudentListSide,
        studentId: number,
    ) => {
        const selectedIds =
            side === 'unassigned'
                ? selectedUnassignedIds
                : selectedAssignedIds
        const studentIds = selectedIds.includes(studentId)
            ? selectedIds
            : [studentId]
        const payload = { side, studentIds }

        setDragPayload(payload)
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify(payload))
    }

    const handleDrop = (
        event: DragEvent<HTMLDivElement>,
        targetSide: StudentListSide,
    ) => {
        event.preventDefault()

        if (!dragPayload || dragPayload.side === targetSide) return

        moveStudents(dragPayload.side, dragPayload.studentIds)
        setDragPayload(null)
    }

    const clearStudentLists = () => {
        setUnassignedStudents([])
        setAssignedStudents([])
        setInitialAssignedStudentIds([])
        setSelectedUnassignedIds([])
        setSelectedAssignedIds([])
        setUnassignedSearchText('')
        setAssignedSearchText('')
        setLoadingUnassigned(false)
        setLoadingAssigned(false)
    }

    const handleCurriculumChange = (curriculumId?: number) => {
        setSelectedCurriculumId(curriculumId)
        setSelectedStudyPlanId(undefined)
        setSelectedTeacherId(undefined)
        setStudyPlans([])
        setStudyPlansError(null)
        setLoadingStudyPlans(false)
        setSystemTeacherOptions([])
        setSystemTeachersError(null)
        setLoadingSystemTeachers(false)
        clearStudentLists()
    }

    const handleStudyPlanChange = (studyPlanId?: number) => {
        setSelectedStudyPlanId(studyPlanId)
        setSelectedTeacherId(undefined)
        clearStudentLists()
    }

    const handleTeacherChange = (teacherId: string) => {
        setSelectedTeacherId(teacherId)
        clearStudentLists()
    }

    const handleClearSearch = () => {
        setSelectedCurriculumId(undefined)
        setSelectedStudyPlanId(undefined)
        setSelectedTeacherId(undefined)
        setStudyPlans([])
        setStudyPlansError(null)
        setSystemTeacherOptions([])
        setSystemTeachersError(null)
        clearStudentLists()
        setLoadingStudyPlans(false)
        setLoadingSystemTeachers(false)
        setDragPayload(null)
    }

    const handleSave = async () => {
        const teacher = systemTeacherOptions.find(
            (option) => option.value === selectedTeacherId,
        )
        if (!teacher) return

        if (
            !selectedStudyPlanId ||
            !selectedTeacherId ||
            !hasAssignmentChanges
        ) return

        if (
            assignmentChanges.currentAssignedIds.length !==
            assignedStudents.length
        ) {
            message.error('ข้อมูลนิสิตไม่ครบถ้วน ไม่สามารถบันทึกได้')
            return
        }

        try {
            setSaving(true)
            const result = await updateStudentAdvisors(
                selectedStudyPlanId,
                selectedTeacherId,
                teacher.label,
                assignmentChanges.assignStudentIds,
                assignmentChanges.removeStudentIds,
            )

            message.success(
                'บันทึกสำเร็จ เพิ่ม ' +
                    result.assigned_count +
                    ' คน นำออก ' +
                    result.removed_count +
                    ' คน',
            )
            setSelectedUnassignedIds([])
            setSelectedAssignedIds([])
            setInitialAssignedStudentIds(
                assignmentChanges.currentAssignedIds,
            )
            setReloadKey((currentKey) => currentKey + 1)
        } catch (error) {
            console.error(error)
            message.error('บันทึกอาจารย์ที่ปรึกษาไม่สำเร็จ')
        } finally {
            setSaving(false)
        }
    }

    const renderStudentTable = (
        side: StudentListSide,
        students: AdvisorAssignmentStudent[],
        selectedIds: number[],
        setSelectedIds: (ids: number[]) => void,
        loading: boolean,
    ) => (
        <Table<AdvisorAssignmentStudent>
            className="advisor-assignment-table"
            columns={studentColumns}
            dataSource={students}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 440, y: 585 }}
            locale={{
                emptyText: !selectedTeacherId
                    ? 'กรุณาเลือกอาจารย์ที่ปรึกษา'
                    : 'ไม่พบข้อมูลนิสิต',
            }}
            pagination={{
                pageSize: 15,
                showSizeChanger: false,
                size: 'small',
                showTotal: (total) => `ทั้งหมด ${total} คน`,
            }}
            rowSelection={{
                selectedRowKeys: selectedIds,
                preserveSelectedRowKeys: true,
                onChange: (keys) => setSelectedIds(keys.map(Number)),
            }}
            onRow={(student) => ({
                draggable: Boolean(selectedTeacherId),
                onDragStart: (event) =>
                    handleDragStart(event, side, student.id),
                onDragEnd: () => setDragPayload(null),
            })}
        />
    )

    return (
        <div className="student-page advisor-assignment-page">
            <div className="page-title-section">
                <div>
                    <h1>กำหนดอาจารย์ที่ปรึกษา</h1>
                    <p>กำหนดอาจารย์ที่ปรึกษาให้แก่นิสิตตามแผนการเรียน</p>
                </div>
            </div>

            <Card className="advisor-search-card" title="ค้นหา">
                <div className="advisor-search-fields">
                    <label className="advisor-curriculum-field">
                        <Text strong>หลักสูตร</Text>
                        <ListOfValueSelect
                            aria-label="หลักสูตร"
                            placeholder="เลือกหลักสูตร"
                            options={curriculums.map((curriculum) => ({
                                label: curriculum.name_th,
                                value: curriculum.id,
                            }))}
                            value={selectedCurriculumId}
                            loading={loadingCurriculums}
                            error={curriculumsError}
                            showSearch
                            optionFilterProp="label"
                            onChange={handleCurriculumChange}
                        />
                    </label>
                    <label>
                        <Text strong>แผนการเรียน</Text>
                        <ListOfValueSelect
                            aria-label="แผนการเรียน"
                            placeholder={
                                selectedCurriculumId
                                    ? 'เลือกแผนการเรียน'
                                    : 'กรุณาเลือกหลักสูตรก่อน'
                            }
                            options={studyPlans.map((studyPlan) => ({
                                label: studyPlan.name_th,
                                value: studyPlan.id,
                            }))}
                            value={selectedStudyPlanId}
                            loading={loadingStudyPlans}
                            error={studyPlansError}
                            disabled={!selectedCurriculumId}
                            showSearch
                            optionFilterProp="label"
                            onChange={handleStudyPlanChange}
                        />
                    </label>
                    <label>
                        <Text strong>อาจารย์ที่ปรึกษา</Text>
                        <ListOfValueSelect
                            aria-label="อาจารย์ที่ปรึกษา"
                            placeholder={
                                selectedCurriculumId
                                    ? 'เลือกอาจารย์ที่ปรึกษา'
                                    : 'กรุณาเลือกหลักสูตรก่อน'
                            }
                            options={systemTeacherOptions}
                            value={selectedTeacherId}
                            loading={loadingSystemTeachers}
                            error={systemTeachersError}
                            disabled={!selectedCurriculumId}
                            showSearch
                            optionFilterProp="label"
                            onChange={handleTeacherChange}
                        />
                    </label>
                    <div className="advisor-search-actions">
                        <Button
                            icon={<ClearOutlined />}
                            disabled={
                                !selectedCurriculumId &&
                                !selectedStudyPlanId &&
                                !selectedTeacherId &&
                                unassignedStudents.length === 0 &&
                                assignedStudents.length === 0
                            }
                            onClick={handleClearSearch}
                        >
                            ล้างการค้นหา
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="advisor-transfer-card">
                <div className="advisor-transfer-layout">
                    <section className="advisor-student-panel">
                        <div className="advisor-panel-heading">
                            <div>
                                <h2>นิสิตที่ยังไม่มีอาจารย์ที่ปรึกษา</h2>
                                <Text type="secondary">
                                    พบ {unassignedStudents.length} คน
                                </Text>
                            </div>
                        </div>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="ค้นหารหัสนิสิต หรือชื่อ-สกุล"
                            value={unassignedSearchText}
                            onChange={(event) =>
                                setUnassignedSearchText(event.target.value)
                            }
                        />
                        <div
                            className="advisor-table-drop-zone"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, 'unassigned')}
                        >
                            {renderStudentTable(
                                'unassigned',
                                filteredUnassignedStudents,
                                selectedUnassignedIds,
                                setSelectedUnassignedIds,
                                loadingUnassigned,
                            )}
                        </div>
                    </section>

                    <div
                        className="advisor-transfer-actions"
                        aria-label="ย้ายรายชื่อนิสิต"
                    >
                        <Button
                            type="primary"
                            icon={<ArrowRightOutlined />}
                            disabled={
                                !selectedTeacherId ||
                                selectedUnassignedIds.length === 0
                            }
                            onClick={() =>
                                moveStudents(
                                    'unassigned',
                                    selectedUnassignedIds,
                                )
                            }
                        >
                            เพิ่ม
                        </Button>
                        <Button
                            icon={<DoubleRightOutlined />}
                            disabled={
                                !selectedTeacherId ||
                                unassignedStudents.length === 0
                            }
                            onClick={() =>
                                moveStudents(
                                    'unassigned',
                                    unassignedStudents.map((student) => student.id),
                                )
                            }
                        >
                            เพิ่มทั้งหมด
                        </Button>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            disabled={
                                !selectedTeacherId ||
                                selectedAssignedIds.length === 0
                            }
                            onClick={() =>
                                moveStudents('assigned', selectedAssignedIds)
                            }
                        >
                            นำออก
                        </Button>
                        <Button
                            icon={<DoubleLeftOutlined />}
                            disabled={
                                !selectedTeacherId ||
                                assignedStudents.length === 0
                            }
                            onClick={() =>
                                moveStudents(
                                    'assigned',
                                    assignedStudents.map((student) => student.id),
                                )
                            }
                        >
                            นำออกทั้งหมด
                        </Button>
                    </div>

                    <section className="advisor-student-panel">
                        <div className="advisor-panel-heading">
                            <div>
                                <h2>นิสิตในที่ปรึกษา</h2>
                                <Text type="secondary">
                                    {selectedTeacherId
                                        ? `พบ ${assignedStudents.length} คน`
                                        : 'กรุณาเลือกอาจารย์ที่ปรึกษา'}
                                </Text>
                            </div>
                        </div>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="ค้นหารหัสนิสิต หรือชื่อ-สกุล"
                            value={assignedSearchText}
                            disabled={!selectedTeacherId}
                            onChange={(event) =>
                                setAssignedSearchText(event.target.value)
                            }
                        />
                        <div
                            className="advisor-table-drop-zone"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, 'assigned')}
                        >
                            {renderStudentTable(
                                'assigned',
                                filteredAssignedStudents,
                                selectedAssignedIds,
                                setSelectedAssignedIds,
                                loadingAssigned,
                            )}
                        </div>
                    </section>
                </div>

                <div className="advisor-save-actions">
                    <Button
                        type="primary"
                        size="large"
                        icon={<SaveOutlined />}
                        loading={saving}
                        disabled={
                            !selectedTeacherId ||
                            !hasAssignmentChanges ||
                            loadingUnassigned ||
                            loadingAssigned
                        }
                        onClick={handleSave}
                    >
                        บันทึกการกำหนด
                    </Button>
                </div>
            </Card>
        </div>
    )
}
