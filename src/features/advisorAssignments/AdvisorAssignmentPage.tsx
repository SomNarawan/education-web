import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    ClearOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    SaveOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { Button, Card, Input, Select, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import {
    getStudyingStudentsByTeacher,
    getStudyingStudentsWithoutAdvisor,
    updateStudentAdvisors,
} from '../../services/advisorAssignmentService'
import { getSystemDepartments } from '../../services/masterDataService'
import { getTeachersByDepartment } from '../../services/teacherService'
import type { AdvisorAssignmentStudent } from '../../types/AdvisorAssignment'
import type { SelectOption } from '../../types/MasterData'

const { Text } = Typography

type StudentListSide = 'unassigned' | 'assigned'

interface DragPayload {
    side: StudentListSide
    studentCodes: string[]
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
        first.student_code.localeCompare(second.student_code, 'th'),
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
            student.student_code.toLocaleLowerCase('th').includes(keyword) ||
            student.full_name_th.toLocaleLowerCase('th').includes(keyword),
    )
}

export default function AdvisorAssignmentPage() {
    const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>([])
    const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([])
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<
        number | undefined
    >()
    const [selectedTeacherId, setSelectedTeacherId] = useState<
        number | undefined
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
    const [selectedUnassignedCodes, setSelectedUnassignedCodes] = useState<
        string[]
    >([])
    const [selectedAssignedCodes, setSelectedAssignedCodes] = useState<string[]>(
        [],
    )
    const [unassignedSearchText, setUnassignedSearchText] = useState('')
    const [assignedSearchText, setAssignedSearchText] = useState('')
    const [loadingDepartments, setLoadingDepartments] = useState(false)
    const [loadingTeachers, setLoadingTeachers] = useState(false)
    const [loadingUnassigned, setLoadingUnassigned] = useState(false)
    const [loadingAssigned, setLoadingAssigned] = useState(false)
    const [saving, setSaving] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)
    const [dragPayload, setDragPayload] = useState<DragPayload | null>(null)

    useEffect(() => {
        let active = true

        const loadDepartments = async () => {
            try {
                setLoadingDepartments(true)
                const departments = await getSystemDepartments()

                if (!active) return

                setDepartmentOptions(
                    departments.map((department) => ({
                        label: department.th_name,
                        value: department.id,
                    })),
                )
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลภาควิชาไม่สำเร็จ')
            } finally {
                if (active) setLoadingDepartments(false)
            }
        }

        loadDepartments()

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (!selectedDepartmentId) return

        let active = true

        const loadDepartmentTeachers = async () => {
            try {
                setLoadingTeachers(true)
                const teachers =
                    await getTeachersByDepartment(selectedDepartmentId)

                if (!active) return

                setTeacherOptions(
                    teachers.map((teacher) => ({
                        label: teacher.full_name_th,
                        value: teacher.id,
                    })),
                )
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลอาจารย์ไม่สำเร็จ')
            } finally {
                if (active) setLoadingTeachers(false)
            }
        }

        loadDepartmentTeachers()

        return () => {
            active = false
        }
    }, [selectedDepartmentId])

    useEffect(() => {
        if (!selectedDepartmentId || !selectedTeacherId) return

        let active = true

        const loadStudentLists = async () => {
            try {
                setLoadingUnassigned(true)
                setLoadingAssigned(true)

                const [unassigned, assigned] = await Promise.all([
                    getStudyingStudentsWithoutAdvisor(selectedDepartmentId),
                    getStudyingStudentsByTeacher(selectedTeacherId),
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
    }, [reloadKey, selectedDepartmentId, selectedTeacherId])

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
        studentCodes: string[],
    ) => {
        if (!selectedTeacherId || studentCodes.length === 0) return

        const codeSet = new Set(studentCodes)

        if (sourceSide === 'unassigned') {
            const movingStudents = unassignedStudents.filter((student) =>
                codeSet.has(student.student_code),
            )

            setUnassignedStudents((students) =>
                students.filter((student) => !codeSet.has(student.student_code)),
            )
            setAssignedStudents((students) =>
                sortStudents([
                    ...students.filter(
                        (student) => !codeSet.has(student.student_code),
                    ),
                    ...movingStudents,
                ]),
            )
            setSelectedUnassignedCodes([])
        } else {
            const movingStudents = assignedStudents.filter((student) =>
                codeSet.has(student.student_code),
            )

            setAssignedStudents((students) =>
                students.filter((student) => !codeSet.has(student.student_code)),
            )
            setUnassignedStudents((students) =>
                sortStudents([
                    ...students.filter(
                        (student) => !codeSet.has(student.student_code),
                    ),
                    ...movingStudents,
                ]),
            )
            setSelectedAssignedCodes([])
        }
    }

    const handleDragStart = (
        event: DragEvent<HTMLElement>,
        side: StudentListSide,
        studentCode: string,
    ) => {
        const selectedCodes =
            side === 'unassigned'
                ? selectedUnassignedCodes
                : selectedAssignedCodes
        const studentCodes = selectedCodes.includes(studentCode)
            ? selectedCodes
            : [studentCode]
        const payload = { side, studentCodes }

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

        moveStudents(dragPayload.side, dragPayload.studentCodes)
        setDragPayload(null)
    }

    const handleDepartmentChange = (departmentId: number) => {
        setSelectedDepartmentId(departmentId)
        setSelectedTeacherId(undefined)
        setTeacherOptions([])
        setUnassignedStudents([])
        setAssignedStudents([])
        setInitialAssignedStudentIds([])
        setSelectedUnassignedCodes([])
        setSelectedAssignedCodes([])
        setUnassignedSearchText('')
        setAssignedSearchText('')
        setLoadingUnassigned(false)
        setLoadingAssigned(false)
    }

    const handleTeacherChange = (teacherId: number) => {
        setSelectedTeacherId(teacherId)
        setAssignedStudents([])
        setInitialAssignedStudentIds([])
        setSelectedUnassignedCodes([])
        setSelectedAssignedCodes([])
    }

    const handleClearSearch = () => {
        setSelectedDepartmentId(undefined)
        setSelectedTeacherId(undefined)
        setTeacherOptions([])
        setUnassignedStudents([])
        setAssignedStudents([])
        setInitialAssignedStudentIds([])
        setSelectedUnassignedCodes([])
        setSelectedAssignedCodes([])
        setUnassignedSearchText('')
        setAssignedSearchText('')
        setLoadingTeachers(false)
        setLoadingUnassigned(false)
        setLoadingAssigned(false)
        setDragPayload(null)
    }

    const handleSave = async () => {
        if (!selectedTeacherId || !hasAssignmentChanges) return

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
                selectedTeacherId,
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
            setSelectedUnassignedCodes([])
            setSelectedAssignedCodes([])
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
        selectedCodes: string[],
        setSelectedCodes: (codes: string[]) => void,
        loading: boolean,
    ) => (
        <Table<AdvisorAssignmentStudent>
            className="advisor-assignment-table"
            columns={studentColumns}
            dataSource={students}
            rowKey="student_code"
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
                selectedRowKeys: selectedCodes,
                preserveSelectedRowKeys: true,
                onChange: (keys) => setSelectedCodes(keys.map(String)),
            }}
            onRow={(student) => ({
                draggable: Boolean(selectedTeacherId),
                onDragStart: (event) =>
                    handleDragStart(event, side, student.student_code),
                onDragEnd: () => setDragPayload(null),
            })}
        />
    )

    return (
        <div className="student-page advisor-assignment-page">
            <div className="page-title-section">
                <div>
                    <h1>กำหนดอาจารย์ที่ปรึกษา</h1>
                    <p>กำหนดอาจารย์ที่ปรึกษาให้แก่นิสิตในแต่ละภาควิชา</p>
                </div>
            </div>

            <Card className="advisor-search-card" title="ค้นหา">
                <div className="advisor-search-fields">
                    <label>
                        <Text strong>ภาควิชา</Text>
                        <Select<number>
                            aria-label="ภาควิชา"
                            placeholder="เลือกภาควิชา"
                            options={departmentOptions}
                            value={selectedDepartmentId}
                            loading={loadingDepartments}
                            showSearch
                            optionFilterProp="label"
                            onChange={handleDepartmentChange}
                        />
                    </label>
                    <label>
                        <Text strong>อาจารย์ที่ปรึกษา</Text>
                        <Select<number>
                            aria-label="อาจารย์ที่ปรึกษา"
                            placeholder={
                                selectedDepartmentId
                                    ? 'เลือกอาจารย์ที่ปรึกษา'
                                    : 'กรุณาเลือกภาควิชาก่อน'
                            }
                            options={teacherOptions}
                            value={selectedTeacherId}
                            loading={loadingTeachers}
                            disabled={!selectedDepartmentId}
                            showSearch
                            optionFilterProp="label"
                            onChange={handleTeacherChange}
                        />
                    </label>
                    <div className="advisor-search-actions">
                        <Button
                            icon={<ClearOutlined />}
                            disabled={
                                !selectedDepartmentId &&
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
                                selectedUnassignedCodes,
                                setSelectedUnassignedCodes,
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
                                selectedUnassignedCodes.length === 0
                            }
                            onClick={() =>
                                moveStudents(
                                    'unassigned',
                                    selectedUnassignedCodes,
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
                                    unassignedStudents.map(
                                        (student) => student.student_code,
                                    ),
                                )
                            }
                        >
                            เพิ่มทั้งหมด
                        </Button>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            disabled={
                                !selectedTeacherId ||
                                selectedAssignedCodes.length === 0
                            }
                            onClick={() =>
                                moveStudents('assigned', selectedAssignedCodes)
                            }
                        >
                            นำออก
                        </Button>
                        <Button
                            icon={<DoubleLeftOutlined />}
                            disabled={
                                !selectedTeacherId || assignedStudents.length === 0
                            }
                            onClick={() =>
                                moveStudents(
                                    'assigned',
                                    assignedStudents.map(
                                        (student) => student.student_code,
                                    ),
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
                                selectedAssignedCodes,
                                setSelectedAssignedCodes,
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
