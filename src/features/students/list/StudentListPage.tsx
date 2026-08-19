import { Button, Input, Select, Spin, message, Typography } from 'antd'
const { Text } = Typography
import {
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import StudentTable from './StudentTable'
import StudentFormModal from './StudentFormModal'
import type { StudentFormValues } from '../../../types/StudentFormValues'
import type { StudentListResponse } from '../../../types/StudentListResponse'
import type { StudentDetailResponse } from '../../../types/StudentDetailResponse'
import { getStudentDetail, getStudentsByPage, createStudent, updateStudent, deleteStudent } from '../../../services/studentService'
import { getNoteTypes } from '../../../services/noteTypeService'
import { getStudentStatuses, getSystemDepartments } from '../../../services/masterDataService'
import { useAuth } from '../../../hooks/useAuth'
import type { SelectOption } from '../../../types/MasterData'
import type { StudentGroup } from '../../../types/StudentRoute'

type NoteSearchType = string | undefined

const OTHER_NOTE_VALUE = 'อื่นๆ'
const DEFAULT_STUDENT_STATUS = 1

export default function StudentListPage() {
    const { studentGroup } = useParams()

    return <StudentList key={studentGroup} />
}

function StudentList() {
    const { studentGroup } = useParams<{
        studentGroup?: StudentGroup
    }>()

    const { currentRole, user } = useAuth()

    const authTeacherId = user?.teacherId ?? undefined
    const authDepartmentId = user?.departmentId ?? undefined
    const authFacultyId = user?.facultyId ?? undefined

    const isAdmin = currentRole === 'admin'
    const isTeacher = currentRole === 'teacher'

    const [students, setStudents] = useState<StudentListResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [dropdownLoading, setDropdownLoading] = useState(false)
    const [searchDropdownLoading, setSearchDropdownLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] =
        useState<StudentDetailResponse | null>(null)

    const [noteSearchType, setNoteSearchType] =
        useState<NoteSearchType>(undefined)
    const [noteSearchText, setNoteSearchText] = useState('')
    const [noteTypeOptions, setNoteTypeOptions] = useState<
        { label: string; value: string }[]
    >([])

    const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>(
        [],
    )
    const [studentStatusOptions, setStudentStatusOptions] = useState<
        SelectOption[]
    >([])
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<
        number | undefined
    >(undefined)
    const [selectedStudentStatusId, setSelectedStudentStatusId] = useState<
        number | undefined
    >(undefined)

    const [studentSearchText, setStudentSearchText] = useState('')
    const [hasFacultySearched, setHasFacultySearched] = useState(false)

    const currentStudentGroup: StudentGroup = studentGroup ?? 'department'

    const isDepartmentListPage = currentStudentGroup === 'department'

    const isFacultyListPage = currentStudentGroup === 'faculty'

    const pageTitle = useMemo(() => {
        if (currentStudentGroup === 'faculty') {
            return 'รายชื่อนิสิตในคณะ'
        }

        if (currentStudentGroup === 'department') {
            return 'รายชื่อนิสิตภาควิชา'
        }

        return 'รายชื่อนิสิตในที่ปรึกษา'
    }, [currentStudentGroup])

    const loadStudents = useCallback(
        async ({
            noteText,
            searchText,
            studentStatusId,
            departmentId: selectedDepartmentIdForSearch,
        }: {
            noteText?: string
            searchText?: string
            studentStatusId?: number | null
            departmentId?: number
        } = {}) => {
            try {
                setLoading(true)

                const teacherIdForSearch =
                    currentStudentGroup === 'advisor'
                        ? authTeacherId
                        : undefined

                const departmentId = isDepartmentListPage
                    ? isTeacher
                        ? authDepartmentId
                        : selectedDepartmentIdForSearch
                    : undefined

                const facultyId =
                    currentStudentGroup === 'faculty'
                        ? authFacultyId
                        : undefined

                if (
                    (currentStudentGroup === 'advisor' && !teacherIdForSearch) ||
                    (currentStudentGroup === 'department' &&
                        isTeacher &&
                        !departmentId) ||
                    (currentStudentGroup === 'faculty' && !facultyId)
                ) {
                    setStudents([])
                    return
                }

                const statusIdForSearch =
                    studentStatusId === null
                        ? undefined
                        : studentStatusId

                const data = await getStudentsByPage(
                    currentStudentGroup,
                    teacherIdForSearch,
                    departmentId,
                    facultyId,
                    noteText,
                    searchText,
                    statusIdForSearch,
                )

                setStudents(data)
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
            } finally {
                setLoading(false)
            }
        },
        [
            currentStudentGroup,
            authFacultyId,
            authTeacherId,
            authDepartmentId,
            isDepartmentListPage,
            isTeacher,
        ],
    )

    useEffect(() => {
        if (isFacultyListPage) {
            return
        }

        if (isAdmin && isDepartmentListPage) {
            return
        }

        // Initial API synchronization is intentionally triggered by route/auth inputs.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStudents({
            studentStatusId: DEFAULT_STUDENT_STATUS,
        })
    }, [
        isAdmin,
        isDepartmentListPage,
        isFacultyListPage,
        loadStudents,
    ])

    useEffect(() => {
        if (isFacultyListPage) {
            return
        }

        const loadNoteTypes = async () => {
            try {
                const data = await getNoteTypes()

                setNoteTypeOptions([
                    ...data.map((item) => ({
                        label: item.note,
                        value: item.note,
                    })),
                ])
            } catch (error) {
                console.error(error)
                message.error('โหลดประเภท Note ไม่สำเร็จ')
            }
        }

        loadNoteTypes()
    }, [isFacultyListPage])

    useEffect(() => {
        if (isFacultyListPage) {
            return
        }

        const loadSearchDropdowns = async () => {
            try {
                setSearchDropdownLoading(true)

                const [studentStatuses, systemDepartments] =
                    await Promise.all([
                        getStudentStatuses(),
                        isAdmin && isDepartmentListPage
                            ? getSystemDepartments()
                            : Promise.resolve([]),
                    ])

                setStudentStatusOptions(
                    studentStatuses.map((item) => ({
                        label: item.status_name ?? '-',
                        value: item.id,
                    })),
                )
                setSelectedStudentStatusId(DEFAULT_STUDENT_STATUS)

                if (isAdmin && isDepartmentListPage) {
                    setDepartmentOptions(
                        systemDepartments.map((item) => ({
                            label: item.th_name ?? '-',
                            value: item.id,
                        })),
                    )
                }
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลตัวเลือกค้นหาไม่สำเร็จ')
            } finally {
                setSearchDropdownLoading(false)
            }
        }

        loadSearchDropdowns()
    }, [isAdmin, isDepartmentListPage, isFacultyListPage])

    const getNoteSearchValue = () => {
        if (!noteSearchType) {
            return undefined
        }

        if (noteSearchType === OTHER_NOTE_VALUE) {
            return noteSearchText.trim() || undefined
        }

        return noteSearchType
    }

    const handleSearchNote = () => {
        if (isAdmin && isDepartmentListPage && !selectedDepartmentId) {
            message.warning('กรุณาเลือกภาควิชา')
            return
        }

        loadStudents({
            noteText: getNoteSearchValue(),
            studentStatusId: selectedStudentStatusId,
            departmentId: selectedDepartmentId,
        })
    }

    const handleClearNoteSearch = () => {
        setNoteSearchType(undefined)
        setNoteSearchText('')
        setSelectedStudentStatusId(DEFAULT_STUDENT_STATUS)

        if (isAdmin && isDepartmentListPage) {
            setSelectedDepartmentId(undefined)
            setStudents([])
            return
        }

        loadStudents({
            studentStatusId: DEFAULT_STUDENT_STATUS,
        })
    }

    const handleSearchStudent = () => {
        const value = studentSearchText.trim()

        if (!value) {
            message.warning('กรุณากรอกคำค้นหา')
            return
        }

        setHasFacultySearched(true)

        loadStudents({
            searchText: value,
        })
    }

    const handleClearStudentSearch = () => {
        setStudentSearchText('')
        setHasFacultySearched(false)
        setStudents([])

        if (!isDepartmentListPage || isTeacher) {
            setSelectedDepartmentId(undefined)
        }

        setSelectedStudentStatusId(undefined)
    }

    const openAddModal = () => {
        if (!isAdmin) {
            message.warning('เฉพาะผู้ดูแลระบบเท่านั้นที่เพิ่มข้อมูลนิสิตได้')
            return
        }

        setEditingStudent(null)
        setIsModalOpen(true)
    }

    const openEditModal = async (id: number) => {
        if (!isAdmin) {
            message.warning('เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขข้อมูลนิสิตได้')
            return
        }

        try {
            setDropdownLoading(true)

            const detail = await getStudentDetail(id)

            setEditingStudent(detail)
            setIsModalOpen(true)
        } catch (error) {
            console.error(error)
            message.error('โหลดข้อมูลนิสิตสำหรับแก้ไขไม่สำเร็จ')
        } finally {
            setDropdownLoading(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingStudent(null)
    }

    const handleSave = async (values: StudentFormValues) => {
        if (!isAdmin) {
            message.warning('เฉพาะผู้ดูแลระบบเท่านั้นที่บันทึกข้อมูลนิสิตได้')
            return
        }

        try {
            setDropdownLoading(true)

            if (editingStudent) {
                await updateStudent(editingStudent.id, values)
            } else {
                await createStudent(values)
            }

            message.success(
                editingStudent
                    ? 'แก้ไขข้อมูลนิสิตสำเร็จ'
                    : 'เพิ่มข้อมูลนิสิตสำเร็จ',
            )

            closeModal()

            if (isFacultyListPage && hasFacultySearched) {
                await loadStudents({
                    searchText: studentSearchText.trim() || undefined,
                })
                return
            }

            await loadStudents({
                noteText: getNoteSearchValue(),
                studentStatusId: selectedStudentStatusId,
                departmentId: selectedDepartmentId,
            })
        } catch (error) {
            console.error(error)
            message.error(
                editingStudent
                    ? 'แก้ไขข้อมูลนิสิตไม่สำเร็จ'
                    : 'เพิ่มข้อมูลนิสิตไม่สำเร็จ',
            )
        } finally {
            setDropdownLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!isAdmin) {
            message.warning('เฉพาะผู้ดูแลระบบเท่านั้นที่ลบข้อมูลนิสิตได้')
            return
        }

        try {
            setDropdownLoading(true)
            await deleteStudent(id)
            setStudents((prev) => prev.filter((item) => item.id !== id))
            message.success('ลบข้อมูลนิสิตสำเร็จ')
        } catch (error) {
            console.error(error)
            message.error('ลบข้อมูลนิสิตไม่สำเร็จ')
        } finally {
            setDropdownLoading(false)
        }
    }

    return (
        <div className="student-page">
            <Spin
                fullscreen
                spinning={searchDropdownLoading}
            />
            <div className="page-title-section">
                <div>
                    <h1>{pageTitle}</h1>
                    <p>จัดการข้อมูลนิสิต และดูรายละเอียด</p>
                </div>

                {isAdmin && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openAddModal}
                    >
                        เพิ่มนิสิต
                    </Button>
                )}
            </div>

            {isFacultyListPage ? (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 24,
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #f0f0f0',
                    }}
                >
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: 20,
                        }}
                    >
                        <Text strong style={{ fontSize: 18 }}>
                            ค้นหานิสิตในคณะจากรหัสนิสิต / ชื่อ-นามสกุล / เลขบัตรประชาชน
                        </Text>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <Input
                            allowClear
                            size="large"
                            placeholder="ค้นหาจากรหัสนิสิต / ชื่อ-นามสกุล / เลขบัตรประชาชน"
                            value={studentSearchText}
                            onChange={(e) =>
                                setStudentSearchText(e.target.value)
                            }
                            onPressEnter={handleSearchStudent}
                            style={{
                                width: '100%',
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 12,
                        }}
                    >
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            size="large"
                            onClick={handleSearchStudent}
                        >
                            ค้นหา
                        </Button>

                        <Button
                            size="large"
                            onClick={handleClearStudentSearch}
                        >
                            ล้างค่า
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 24,
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 650,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        <div
                            style={{
                                textAlign: 'center',
                                marginBottom: 4,
                            }}
                        >
                            <Text strong style={{ fontSize: 18 }}>
                                ค้นหาข้อมูลนิสิต
                            </Text>
                        </div>

                        {isAdmin && isDepartmentListPage && (
                            <div>
                                <Text strong>ภาควิชา</Text>
                                <Select
                                    allowClear
                                    showSearch
                                    loading={searchDropdownLoading}
                                    placeholder="เลือกภาควิชา"
                                    value={selectedDepartmentId}
                                    options={departmentOptions}
                                    style={{ width: '100%', marginTop: 6 }}
                                    optionFilterProp="label"
                                    onChange={setSelectedDepartmentId}
                                />
                            </div>
                        )}

                        <div>
                            <Text strong>สถานะนิสิต</Text>
                            <Select
                                allowClear
                                showSearch
                                loading={searchDropdownLoading}
                                placeholder="เลือกสถานะนิสิต"
                                value={selectedStudentStatusId}
                                options={studentStatusOptions}
                                style={{ width: '100%', marginTop: 6 }}
                                optionFilterProp="label"
                                onChange={setSelectedStudentStatusId}
                            />
                        </div>

                        <div>
                            <Text strong>ประเภท Note</Text>
                            <Select
                                allowClear
                                showSearch
                                placeholder="เลือกประเภท Note"
                                value={noteSearchType}
                                options={noteTypeOptions}
                                style={{ width: '100%', marginTop: 6 }}
                                onChange={(value) => {
                                    setNoteSearchType(value)

                                    if (value !== OTHER_NOTE_VALUE) {
                                        setNoteSearchText('')
                                    }
                                }}
                            />
                        </div>

                        {noteSearchType === OTHER_NOTE_VALUE && (
                            <div>
                                <Text strong>รายละเอียด Note</Text>
                                <Input
                                    allowClear
                                    placeholder="กรอกรายละเอียด Note"
                                    value={noteSearchText}
                                    style={{ width: '100%', marginTop: 6 }}
                                    onChange={(e) =>
                                        setNoteSearchText(e.target.value)
                                    }
                                    onPressEnter={handleSearchNote}
                                />
                            </div>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 12,
                                marginTop: 8,
                            }}
                        >
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearchNote}
                            >
                                ค้นหา
                            </Button>

                            <Button onClick={handleClearNoteSearch}>
                                ล้างค่า
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {(!isFacultyListPage || hasFacultySearched) && (
                <div className="table-card">
                    <StudentTable
                        students={students}
                        loading={loading}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        studentGroup={currentStudentGroup}
                        canManage={isAdmin}
                    />
                </div>
            )}

            {isAdmin && (
                <StudentFormModal
                    open={isModalOpen}
                    loading={dropdownLoading}
                    editingStudent={editingStudent}
                    onCancel={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}
