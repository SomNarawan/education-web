import { Button, Form, Input, Spin, message, Typography } from 'antd'
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
import {
    createStudent,
    deleteStudent,
    getStudentDetail,
    getStudents,
    updateStudent,
} from '../../../services/studentService'
import {
    getNoteTypes,
    getStudentStatuses,
    getSystemDepartments,
} from '../../../services/listOfValueService'
import { useAuth } from '../../../hooks/useAuth'
import type { SelectOption } from '../../../types/MasterData'
import type { StudentGroup } from '../../../types/StudentRoute'
import type { ListOfValue } from '../../../types/ListOfValue'
import ListOfValueSelect from '../../../components/custom/ListOfValueSelect'
import { toListOfValueOptions } from '../../../utils/listOfValue'
import { OTHER_NOTE_NAME } from '../notes/noteConstants'

type NoteSearchType = number | undefined

interface FacultyStudentSearchFormValues {
    searchText: string
}

interface NoteSearchFormValues {
    departmentId?: number
    noteText?: string
}

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
    const [facultySearchForm] = Form.useForm<FacultyStudentSearchFormValues>()
    const [noteSearchForm] = Form.useForm<NoteSearchFormValues>()

    const authTeacherId = user?.teacherId ?? undefined
    const authDepartmentId = user?.departmentId ?? undefined
    const authFacultyId = user?.facultyId ?? undefined

    const isAdmin = currentRole === 'admin'
    const isTeacher = currentRole === 'teacher'

    const [students, setStudents] = useState<StudentListResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [dropdownLoading, setDropdownLoading] = useState(false)
    const [searchDropdownLoading, setSearchDropdownLoading] = useState(false)
    const [searchDropdownError, setSearchDropdownError] = useState<
        string | null
    >(null)
    const [noteTypesLoading, setNoteTypesLoading] = useState(false)
    const [noteTypesError, setNoteTypesError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] =
        useState<StudentDetailResponse | null>(null)

    const [noteSearchType, setNoteSearchType] =
        useState<NoteSearchType>(undefined)
    const [noteSearchText, setNoteSearchText] = useState('')
    const [noteTypes, setNoteTypes] = useState<ListOfValue[]>([])

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
    const selectedNoteType = noteTypes.find(
        (noteType) => noteType.id === noteSearchType,
    )
    const isOtherNoteType = selectedNoteType?.name_th === OTHER_NOTE_NAME

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
            noteTypeId,
            noteText,
            searchText,
            studentStatusId,
            departmentId: selectedDepartmentIdForSearch,
        }: {
            noteTypeId?: number
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
                    (currentStudentGroup === 'advisor' &&
                        !teacherIdForSearch) ||
                    (currentStudentGroup === 'department' &&
                        isTeacher &&
                        !departmentId) ||
                    (currentStudentGroup === 'faculty' && !facultyId)
                ) {
                    setStudents([])

                    if (currentStudentGroup === 'advisor') {
                        message.warning(
                            'ไม่พบรหัสอาจารย์จากข้อมูลผู้ใช้ จึงไม่สามารถค้นหารายชื่อนิสิตที่ปรึกษาได้',
                        )
                    }

                    return
                }

                const statusIdForSearch =
                    studentStatusId === null
                        ? undefined
                        : studentStatusId

                const data = await getStudents({
                    teacher_id: teacherIdForSearch,
                    department_id: departmentId,
                    faculty_id: facultyId,
                    search_note_type_id: noteTypeId,
                    search_note: noteText,
                    search_text: searchText,
                    student_status_id: statusIdForSearch,
                })

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
                setNoteTypesLoading(true)
                setNoteTypesError(null)
                const data = await getNoteTypes()
                setNoteTypes(data)
            } catch (error) {
                console.error(error)
                const errorMessage = 'โหลดประเภท Note ไม่สำเร็จ'
                setNoteTypesError(errorMessage)
                message.error(errorMessage)
            } finally {
                setNoteTypesLoading(false)
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
                setSearchDropdownError(null)

                const [studentStatuses, systemDepartments] =
                    await Promise.all([
                        getStudentStatuses(),
                        isAdmin && isDepartmentListPage
                            ? getSystemDepartments()
                            : Promise.resolve([]),
                    ])

                setStudentStatusOptions(
                    toListOfValueOptions(studentStatuses),
                )
                setSelectedStudentStatusId(DEFAULT_STUDENT_STATUS)

                if (isAdmin && isDepartmentListPage) {
                    setDepartmentOptions(
                        toListOfValueOptions(systemDepartments),
                    )
                }
            } catch (error) {
                console.error(error)
                const errorMessage = 'โหลดข้อมูลตัวเลือกค้นหาไม่สำเร็จ'
                setSearchDropdownError(errorMessage)
                message.error(errorMessage)
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

        if (isOtherNoteType) {
            return noteSearchText.trim() || undefined
        }

        return selectedNoteType?.name_th
    }

    const handleSearchNote = async () => {
        try {
            await noteSearchForm.validateFields()
        } catch {
            return
        }

        loadStudents({
            noteTypeId: noteSearchType,
            noteText: getNoteSearchValue(),
            studentStatusId: selectedStudentStatusId,
            departmentId: selectedDepartmentId,
        })
    }

    const handleClearNoteSearch = () => {
        setNoteSearchType(undefined)
        setNoteSearchText('')
        noteSearchForm.resetFields()
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

    const handleSearchStudent = async () => {
        let values: FacultyStudentSearchFormValues

        try {
            values = await facultySearchForm.validateFields()
        } catch {
            return
        }

        const value = values.searchText.trim()
        setHasFacultySearched(true)

        loadStudents({
            searchText: value,
        })
    }

    const handleClearStudentSearch = () => {
        setStudentSearchText('')
        facultySearchForm.resetFields()
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
                noteTypeId: noteSearchType,
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
                        <Form form={facultySearchForm} component={false}>
                            <Form.Item
                                name="searchText"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: 'กรุณากรอกคำค้นหา',
                                    },
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    allowClear
                                    size="large"
                                    placeholder="ค้นหาจากรหัสนิสิต / ชื่อ-นามสกุล / เลขบัตรประชาชน"
                                    maxLength={255}
                                    onChange={(e) =>
                                        setStudentSearchText(e.target.value)
                                    }
                                    onPressEnter={() =>
                                        void handleSearchStudent()
                                    }
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Form>
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
                            onClick={() => void handleSearchStudent()}
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
                    <Form form={noteSearchForm} component={false}>
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
                                    <Form.Item
                                        name="departmentId"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'กรุณาเลือกภาควิชา',
                                            },
                                        ]}
                                        style={{
                                            marginBottom: 0,
                                            marginTop: 6,
                                        }}
                                    >
                                        <ListOfValueSelect<number>
                                            allowClear
                                            showSearch
                                            loading={searchDropdownLoading}
                                            error={searchDropdownError}
                                            placeholder="เลือกภาควิชา"
                                            options={departmentOptions}
                                            style={{ width: '100%' }}
                                            optionFilterProp="label"
                                            onChange={setSelectedDepartmentId}
                                        />
                                    </Form.Item>
                                </div>
                            )}

                            <div>
                                <Text strong>สถานะนิสิต</Text>
                                <ListOfValueSelect
                                    allowClear
                                    showSearch
                                    loading={searchDropdownLoading}
                                    error={searchDropdownError}
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
                                <ListOfValueSelect
                                    allowClear
                                    showSearch
                                    loading={noteTypesLoading}
                                    error={noteTypesError}
                                    placeholder="เลือกประเภท Note"
                                    value={noteSearchType}
                                    options={toListOfValueOptions(noteTypes)}
                                    style={{ width: '100%', marginTop: 6 }}
                                    onChange={(value) => {
                                        setNoteSearchType(value)

                                        const isOther = noteTypes.some(
                                            (noteType) =>
                                                noteType.id === value &&
                                                noteType.name_th ===
                                                    OTHER_NOTE_NAME,
                                        )

                                        if (!isOther) {
                                            setNoteSearchText('')
                                            noteSearchForm.setFieldValue(
                                                'noteText',
                                                undefined,
                                            )
                                        }
                                    }}
                                />
                            </div>

                            {isOtherNoteType && (
                                <div>
                                    <Text strong>รายละเอียด Note</Text>
                                    <Form.Item
                                        name="noteText"
                                        rules={[
                                            {
                                                required: true,
                                                whitespace: true,
                                                message:
                                                    'กรุณากรอกรายละเอียด Note',
                                            },
                                        ]}
                                        style={{
                                            marginBottom: 0,
                                            marginTop: 6,
                                        }}
                                    >
                                        <Input
                                            allowClear
                                            placeholder="กรอกรายละเอียด Note"
                                            maxLength={255}
                                            style={{ width: '100%' }}
                                            onChange={(e) =>
                                                setNoteSearchText(
                                                    e.target.value,
                                                )
                                            }
                                            onPressEnter={() =>
                                                void handleSearchNote()
                                            }
                                        />
                                    </Form.Item>
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
                                    onClick={() => void handleSearchNote()}
                                >
                                    ค้นหา
                                </Button>

                                <Button onClick={handleClearNoteSearch}>
                                    ล้างค่า
                                </Button>
                            </div>
                        </div>
                    </Form>
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
