import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    InboxOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Col,
    Form,
    Progress,
    Row,
    Space,
    Typography,
    Upload,
    message,
} from 'antd'
import type { UploadProps } from 'antd'
import { useEffect, useRef, useState } from 'react'
import ListOfValueSelect from '../../../components/custom/ListOfValueSelect'
import { renderRequiredFormMark } from '../../../components/custom/RequiredFormMark'
import { useAuth } from '../../../hooks/useAuth'
import {
    getCurriculums,
    getSystemDepartments,
} from '../../../services/listOfValueService'
import { getStudyPlans } from '../../../services/masterDataService'
import {
    downloadStudentImportTemplate,
    importStudents,
} from '../../../services/studentImportService'
import type { Curriculum, StudyPlan } from '../../../types/MasterData'
import type { ListOfValue } from '../../../types/ListOfValue'
import {
    downloadStudentImportBlob,
    parseStudentImportError,
    runStudentImportOnce,
    validateStudentImportFile,
} from './studentImportUtils'

const excelMimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface StudentImportPickerProps {
    onImportComplete: () => void | Promise<void>
}

interface StudentImportFormValues {
    departmentId: number
    curriculumId: number
    studyPlanId: number
}

export default function StudentImportPicker({
    onImportComplete,
}: StudentImportPickerProps) {
    const { logout } = useAuth()
    const importLock = useRef(false)
    const [selectionForm] = Form.useForm<StudentImportFormValues>()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [curriculums, setCurriculums] = useState<Curriculum[]>([])
    const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
    const [departments, setDepartments] = useState<ListOfValue[]>([])
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<
        number | undefined
    >()
    const [curriculumsLoading, setCurriculumsLoading] = useState(false)
    const [studyPlansLoading, setStudyPlansLoading] = useState(false)
    const [departmentsLoading, setDepartmentsLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [templateDownloading, setTemplateDownloading] = useState(false)
    const [uploadPercent, setUploadPercent] = useState(0)

    useEffect(() => {
        let cancelled = false

        const loadCurriculums = async () => {
            try {
                setCurriculumsLoading(true)
                const data = await getCurriculums()

                if (!cancelled) {
                    setCurriculums(data)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Unable to load curriculums', error)
                    message.error('โหลดข้อมูลหลักสูตรไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setCurriculumsLoading(false)
                }
            }
        }

        void loadCurriculums()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadDepartments = async () => {
            try {
                setDepartmentsLoading(true)
                const data = await getSystemDepartments()

                if (!cancelled) {
                    setDepartments(data)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Unable to load system departments', error)
                    message.error('โหลดข้อมูลภาควิชาไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setDepartmentsLoading(false)
                }
            }
        }

        void loadDepartments()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!selectedCurriculumId) {
            return
        }

        let cancelled = false

        const loadStudyPlans = async () => {
            try {
                setStudyPlansLoading(true)
                const data = await getStudyPlans(selectedCurriculumId)

                if (!cancelled) {
                    setStudyPlans(data)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Unable to load study plans', error)
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
    }, [selectedCurriculumId])

    const handleCurriculumChange = (curriculumId?: number) => {
        setSelectedCurriculumId(curriculumId)
        setStudyPlans([])
        setStudyPlansLoading(false)
        selectionForm.setFieldValue('studyPlanId', undefined)
    }

    const handleDownloadTemplate = async () => {
        try {
            setTemplateDownloading(true)
            const result = await downloadStudentImportTemplate()
            downloadStudentImportBlob(result.blob, result.fileName)
            message.success('ดาวน์โหลดไฟล์ Template สำเร็จ')
        } catch (error) {
            console.error('Unable to download student import template', error)
            const parsedError = await parseStudentImportError(error)
            message.error(parsedError.message)

            if (parsedError.status === 401) {
                logout()
            }
        } finally {
            setTemplateDownloading(false)
        }
    }

    const handleImport = async () => {
        const validationError = validateStudentImportFile(selectedFile)
        setFileError(validationError)

        let values: StudentImportFormValues

        try {
            values = await selectionForm.validateFields()
        } catch {
            return
        }

        if (validationError || !selectedFile) {
            return
        }

        const curriculum = curriculums.find(
            (item) => item.id === values.curriculumId,
        )
        const studyPlan = studyPlans.find(
            (item) => item.id === values.studyPlanId,
        )

        if (!curriculum || !studyPlan) return

        await runStudentImportOnce(importLock, async () => {
            let refreshHistory = false

            try {
                setImporting(true)
                setUploadPercent(0)
                const result = await importStudents(
                    selectedFile,
                    values.departmentId,
                    curriculum.id,
                    curriculum.name_th,
                    studyPlan.id,
                    studyPlan.name_th,
                    (progressEvent) => {
                        if (!progressEvent.total) return

                        setUploadPercent(
                            Math.min(
                                99,
                                Math.round(
                                    (progressEvent.loaded /
                                        progressEvent.total) *
                                        100,
                                ),
                            ),
                        )
                    },
                )

                setUploadPercent(100)
                const summary = result.summary
                const summaryMessage = `นำเข้าทั้งหมด ${summary.total} รายการ สำเร็จ ${summary.success} รายการ และไม่สำเร็จ ${summary.failed} รายการ`

                if (summary.failed > 0) {
                    message.warning(summaryMessage)
                } else {
                    message.success(summaryMessage)
                }

                setSelectedFile(null)
                refreshHistory = true
            } catch (error) {
                console.error('Unable to import students', error)
                const parsedError = await parseStudentImportError(error)
                message.error(parsedError.message)
                refreshHistory = parsedError.status !== 401

                if (parsedError.status === 401) {
                    logout()
                }
            } finally {
                if (refreshHistory) {
                    await onImportComplete()
                }

                setImporting(false)
            }
        })
    }

    const beforeUpload: UploadProps['beforeUpload'] = (file) => {
        const validationError = validateStudentImportFile(file)

        if (validationError) {
            setFileError(validationError)
            return Upload.LIST_IGNORE
        }

        setSelectedFile(file)
        setFileError(null)
        setUploadPercent(0)
        return false
    }

    const uploadProps: UploadProps = {
        accept: `.xlsx,${excelMimeType}`,
        beforeUpload,
        disabled: importing,
        fileList: [],
        maxCount: 1,
        multiple: false,
        showUploadList: false,
    }

    return (
        <div className="student-import-inline-picker">
            <Form
                form={selectionForm}
                layout={'vertical'}
                requiredMark={renderRequiredFormMark}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            label={'ภาควิชา'}
                            name="departmentId"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกภาควิชา',
                                },
                            ]}
                        >
                            <ListOfValueSelect<number>
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={departmentsLoading}
                                disabled={importing}
                                placeholder={'เลือกภาควิชา'}
                                options={departments.map((department) => ({
                                    label: department.name_th,
                                    value: department.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            label={'หลักสูตร'}
                            name="curriculumId"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกหลักสูตร',
                                },
                            ]}
                        >
                            <ListOfValueSelect<number>
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={curriculumsLoading}
                                disabled={importing}
                                placeholder={'เลือกหลักสูตร'}
                                options={curriculums.map((curriculum) => ({
                                    label: curriculum.name_th,
                                    value: curriculum.id,
                                }))}
                                onChange={handleCurriculumChange}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            label={'แผนการเรียน'}
                            name="studyPlanId"
                            rules={[
                                {
                                    required: true,
                                    message: 'กรุณาเลือกแผนการเรียน',
                                },
                            ]}
                        >
                            <ListOfValueSelect<number>
                                allowClear
                                showSearch
                                optionFilterProp={'label'}
                                loading={studyPlansLoading}
                                disabled={!selectedCurriculumId || importing}
                                placeholder={
                                    selectedCurriculumId
                                        ? 'เลือกแผนการเรียน'
                                        : 'กรุณาเลือกหลักสูตรก่อน'
                                }
                                options={studyPlans.map((studyPlan) => ({
                                    label: studyPlan.name_th,
                                    value: studyPlan.id,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                label="ไฟล์นำเข้านิสิต"
                required
                validateStatus={fileError ? 'error' : undefined}
                help={fileError}
                style={{ marginBottom: 0 }}
            >
                <div
                    className={
                        fileError
                            ? 'student-import-upload-field student-import-upload-field-error'
                            : 'student-import-upload-field'
                    }
                >
                    <Upload.Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            เลือกไฟล์ หรือลากไฟล์มาวางเพื่อ Import นักศึกษา
                        </p>
                        <p className="ant-upload-hint">
                            รองรับเฉพาะไฟล์ .xlsx ขนาดไม่เกิน 20 MB
                        </p>
                    </Upload.Dragger>
                </div>
                </Form.Item>
            </Form>

            {selectedFile && (
                <div
                    className="student-import-selected-file"
                    role="status"
                    aria-live="polite"
                >
                    <div className="student-import-selected-file-icon">
                        <FileExcelOutlined />
                    </div>
                    <div className="student-import-selected-file-info">
                        <Space size={6}>
                            <CheckCircleOutlined />
                            <strong>เลือกไฟล์แล้ว</strong>
                        </Space>
                        <Typography.Text
                            ellipsis={{ tooltip: selectedFile.name }}
                        >
                            {selectedFile.name}
                        </Typography.Text>
                    </div>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={importing}
                        onClick={() => setSelectedFile(null)}
                    >
                        ลบไฟล์
                    </Button>
                </div>
            )}

            <div className="student-import-actions">
                <Button
                    size="large"
                    icon={<DownloadOutlined />}
                    loading={templateDownloading}
                    disabled={importing}
                    onClick={() => void handleDownloadTemplate()}
                >
                    ดาวน์โหลดไฟล์ Template
                </Button>
                <Button
                    type="primary"
                    size="large"
                    icon={<UploadOutlined />}
                    loading={importing}
                    disabled={importing}
                    onClick={() => void handleImport()}
                >
                    {importing ? 'กำลังประมวลผล' : 'Import นักศึกษา'}
                </Button>
            </div>

            {importing && (
                <Alert
                    type="info"
                    showIcon
                    title="ระบบกำลังประมวลผลไฟล์ กรุณารอสักครู่"
                    description={
                        <Progress
                            percent={uploadPercent}
                            status="active"
                            aria-label={`อัปโหลดแล้ว ${uploadPercent} เปอร์เซ็นต์`}
                        />
                    }
                />
            )}
        </div>
    )
}
