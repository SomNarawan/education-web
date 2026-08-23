import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
    Button,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Space,
    Switch,
    Tag,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import CustomTable from '../../components/custom/CustomTable'
import { renderRequiredFormMark } from '../../components/custom/RequiredFormMark'
import {
    createHighSchool,
    getHighSchool,
    getHighSchools,
    updateHighSchool,
    updateHighSchoolStatus,
} from '../../services/masterDataService'
import { useAddressMasterData } from '../../hooks/useAddressMasterData'
import type {
    HighSchool,
    HighSchoolListItem,
    HighSchoolPayload,
} from '../../types/MasterData'
import { formatThaiDateTime } from '../../utils/dateFormat'
import SchoolLocationMap from './SchoolLocationMap'
import ListOfValueSelect from '../../components/custom/ListOfValueSelect'
import { toListOfValueOptions } from '../../utils/listOfValue'

interface HighSchoolFormValues {
    school_name: string
    province_id?: number
    district_id?: number
    subdistrict_id: number
    latitude: number
    longitude: number
}

interface ApiErrorResponse {
    message?: string
    errors?: Record<string, string[]> | null
}

interface EditState {
    mode: 'create' | 'edit'
    school?: HighSchool
}

const highSchoolFormFields = new Set<keyof HighSchoolFormValues>([
    'school_name',
    'subdistrict_id',
    'latitude',
    'longitude',
])

function isHighSchoolFormField(
    field: string,
): field is keyof HighSchoolFormValues {
    return highSchoolFormFields.has(field as keyof HighSchoolFormValues)
}

export default function HighSchoolManagementPage() {
    const [form] = Form.useForm<HighSchoolFormValues>()
    const latitude = Form.useWatch('latitude', form)
    const longitude = Form.useWatch('longitude', form)
    const provinceId = Form.useWatch('province_id', form)
    const districtId = Form.useWatch('district_id', form)
    const [schools, setSchools] = useState<HighSchoolListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
    const [loadingViewId, setLoadingViewId] = useState<number | null>(null)
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null)
    const [editState, setEditState] = useState<EditState | null>(null)
    const [viewingSchool, setViewingSchool] = useState<HighSchool | null>(null)
    const {
        provinces,
        districtsByProvince,
        subdistrictsByDistrict,
        loadingDistrictsByProvince,
        loadingSubdistrictsByDistrict,
        loadingProvinces,
        provincesError,
        districtErrorsByProvince,
        subdistrictErrorsByDistrict,
        loadProvinces,
        loadDistricts,
        loadSubdistricts,
    } = useAddressMasterData()
    const districts = provinceId
        ? (districtsByProvince[provinceId] ?? [])
        : []
    const subdistricts = districtId
        ? (subdistrictsByDistrict[districtId] ?? [])
        : []
    const loadingDistricts = provinceId
        ? (loadingDistrictsByProvince[provinceId] ?? false)
        : false
    const loadingSubdistricts = districtId
        ? (loadingSubdistrictsByDistrict[districtId] ?? false)
        : false
    const districtsError = provinceId
        ? (districtErrorsByProvince[provinceId] ?? null)
        : null
    const subdistrictsError = districtId
        ? (subdistrictErrorsByDistrict[districtId] ?? null)
        : null

    const loadSchools = useCallback(async () => {
        setLoading(true)

        try {
            const [schoolData] = await Promise.all([
                getHighSchools(),
                loadProvinces(),
            ])
            setSchools(schoolData)
        } catch (error) {
            console.error('Unable to load high schools', error)
            message.error('ไม่สามารถโหลดข้อมูลโรงเรียนได้')
        } finally {
            setLoading(false)
        }
    }, [loadProvinces])

    useEffect(() => {
        // Initial API synchronization is intentionally triggered when the page mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadSchools()
    }, [loadSchools])

    function handleOpenCreate() {
        form.resetFields()
        setEditState({ mode: 'create' })
    }

    function replaceSchool(updatedSchool: HighSchoolListItem) {
        setSchools((current) =>
            current.map((school) =>
                school.id === updatedSchool.id ? updatedSchool : school,
            ),
        )
    }

    function openEditForm(school: HighSchool) {
        form.setFieldsValue({
            school_name: school.school_name,
            province_id: school.province_id,
            district_id: school.district_id,
            subdistrict_id: school.subdistrict_id,
            latitude: Number(school.latitude),
            longitude: Number(school.longitude),
        })
        setEditState({ mode: 'edit', school })

        if (school.district_name) {
            void loadDistrictOptions(school.province_id)
        }

        if (school.subdistrict_name) {
            void loadSubdistrictOptions(school.district_id)
        }
    }

    async function handleOpenView(school: HighSchoolListItem) {
        setLoadingViewId(school.id)

        try {
            const detail = await getHighSchool(school.id)
            replaceSchool(detail)
            setViewingSchool(detail)
        } catch (error) {
            console.error('Unable to load high school detail', error)

            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                message.error(
                    error.response?.data.message ??
                        'ไม่สามารถโหลดรายละเอียดโรงเรียนได้',
                )
            } else {
                message.error('ไม่สามารถโหลดรายละเอียดโรงเรียนได้')
            }
        } finally {
            setLoadingViewId(null)
        }
    }

    async function handleOpenEdit(school: HighSchoolListItem) {
        setLoadingEditId(school.id)

        try {
            const detail = await getHighSchool(school.id)
            replaceSchool(detail)
            openEditForm(detail)
        } catch (error) {
            console.error('Unable to load high school for editing', error)

            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                message.error(
                    error.response?.data.message ??
                        'ไม่สามารถโหลดข้อมูลโรงเรียนได้',
                )
            } else {
                message.error('ไม่สามารถโหลดข้อมูลโรงเรียนได้')
            }
        } finally {
            setLoadingEditId(null)
        }
    }

    async function loadDistrictOptions(nextProvinceId: number) {
        try {
            await loadDistricts(nextProvinceId)
        } catch (error) {
            console.error('Unable to load districts', error)
            message.error('ไม่สามารถโหลดข้อมูลอำเภอได้')
        }
    }

    async function loadSubdistrictOptions(nextDistrictId: number) {
        try {
            await loadSubdistricts(nextDistrictId)
        } catch (error) {
            console.error('Unable to load subdistricts', error)
            message.error('ไม่สามารถโหลดข้อมูลตำบลได้')
        }
    }

    async function handleProvinceChange(nextProvinceId?: number) {
        form.setFieldsValue({
            district_id: undefined,
            subdistrict_id: undefined,
        })

        if (!nextProvinceId) return

        await loadDistrictOptions(nextProvinceId)
    }

    async function handleDistrictChange(nextDistrictId?: number) {
        form.setFieldValue('subdistrict_id', undefined)

        if (!nextDistrictId) return

        await loadSubdistrictOptions(nextDistrictId)
    }

    function applyServerValidationErrors(errors: Record<string, string[]>) {
        form.setFields(
            Object.entries(errors)
                .flatMap(([field, fieldErrors]) =>
                    isHighSchoolFormField(field)
                        ? [
                              {
                                  name: field,
                                  errors: fieldErrors,
                              },
                          ]
                        : [],
                ),
        )
    }

    async function handleSubmit(values: HighSchoolFormValues) {
        const payload: HighSchoolPayload = {
            school_name: values.school_name.trim(),
            subdistrict_id: values.subdistrict_id,
            latitude: values.latitude,
            longitude: values.longitude,
        }

        setSaving(true)

        try {
            if (editState?.mode === 'edit' && editState.school) {
                const updatedSchool = await updateHighSchool(
                    editState.school.id,
                    payload,
                )
                setSchools((current) =>
                    current.map((school) =>
                        school.id === updatedSchool.id
                            ? updatedSchool
                            : school,
                    ),
                )
                message.success('แก้ไขโรงเรียนเรียบร้อยแล้ว')
            } else {
                const createdSchool = await createHighSchool(payload)
                setSchools((current) => [...current, createdSchool])
                message.success('เพิ่มโรงเรียนเรียบร้อยแล้ว')
            }

            setEditState(null)
            form.resetFields()
        } catch (error) {
            console.error('Unable to save high school', error)

            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                const response = error.response?.data

                if (response?.errors) {
                    applyServerValidationErrors(response.errors)
                }

                message.error(response?.message ?? 'ไม่สามารถบันทึกโรงเรียนได้')
            } else {
                message.error('ไม่สามารถบันทึกโรงเรียนได้')
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleStatusChange(school: HighSchoolListItem) {
        const nextStatus =
            school.status === 'active' ? 'inactive' : 'active'
        setUpdatingStatusId(school.id)

        try {
            const updatedSchool = await updateHighSchoolStatus(
                school.id,
                nextStatus,
            )
            setSchools((current) =>
                current.map((item) =>
                    item.id === updatedSchool.id ? updatedSchool : item,
                ),
            )
            message.success(
                `${nextStatus === 'active' ? 'เปิด' : 'ปิด'}ใช้งานโรงเรียนเรียบร้อยแล้ว`,
            )
        } catch (error) {
            console.error('Unable to update high school status', error)

            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                message.error(
                    error.response?.data.message ??
                        'ไม่สามารถเปลี่ยนสถานะโรงเรียนได้',
                )
            } else {
                message.error('ไม่สามารถเปลี่ยนสถานะโรงเรียนได้')
            }
        } finally {
            setUpdatingStatusId(null)
        }
    }

    function getSchoolAddress(school: HighSchool) {
        if (
            !school.subdistrict_name ||
            !school.district_name ||
            !school.province_name
        ) {
            return '-'
        }

        return `${school.subdistrict_name} ${school.district_name} ${school.province_name}`
    }

    const columns: ColumnsType<HighSchoolListItem> = [
        {
            title: 'ชื่อโรงเรียน',
            dataIndex: 'school_name',
            key: 'school_name',
            width: 260,
            ellipsis: true,
        },
        {
            title: 'สร้างโดย',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 140,
            ellipsis: true,
        },
        {
            title: 'วันที่สร้าง',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 175,
            render: formatThaiDateTime,
        },
        {
            title: 'แก้ไขโดย',
            dataIndex: 'updated_by',
            key: 'updated_by',
            width: 140,
            ellipsis: true,
        },
        {
            title: 'วันที่แก้ไข',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 175,
            render: formatThaiDateTime,
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            align: 'center',
            filters: [
                { text: 'ใช้งาน', value: 'active' },
                { text: 'ไม่ใช้งาน', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: HighSchoolListItem['status'], school) => {
                const isUpdating = updatingStatusId === school.id
                const nextStatusLabel =
                    status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'

                return (
                    <Popconfirm
                        title={`ยืนยันการ${nextStatusLabel}โรงเรียน`}
                        description={`ต้องการ${nextStatusLabel} ${school.school_name} ใช่หรือไม่`}
                        okText="ยืนยัน"
                        cancelText="ยกเลิก"
                        onConfirm={() => handleStatusChange(school)}
                    >
                        <Switch
                            checked={status === 'active'}
                            checkedChildren="ใช้งาน"
                            unCheckedChildren="ไม่ใช้งาน"
                            loading={isUpdating}
                            disabled={updatingStatusId !== null && !isUpdating}
                            aria-label={`${nextStatusLabel}${school.school_name}`}
                            style={
                                status === 'active'
                                    ? { backgroundColor: '#52c41a' }
                                    : undefined
                            }
                        />
                    </Popconfirm>
                )
            },
        },
        {
            title: 'การจัดการ',
            key: 'actions',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, school) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        aria-label={`ดูรายละเอียด${school.school_name}`}
                        loading={loadingViewId === school.id}
                        disabled={
                            loadingEditId !== null ||
                            updatingStatusId !== null
                        }
                        style={{
                            borderColor: '#1677ff',
                            color: '#1677ff',
                        }}
                        onClick={() => void handleOpenView(school)}
                    />
                    <Button
                        icon={<EditOutlined />}
                        aria-label={`แก้ไข${school.school_name}`}
                        loading={loadingEditId === school.id}
                        style={{
                            borderColor: '#faad14',
                            color: '#faad14',
                        }}
                        disabled={
                            loadingViewId !== null ||
                            updatingStatusId !== null
                        }
                        onClick={() => void handleOpenEdit(school)}
                    />
                </Space>
            ),
        },
    ]

    return (
        <div className="student-page master-data-page">
            <div className="page-title-section">
                <div>
                    <h1>จัดการโรงเรียนมัธยมปลาย</h1>
                    <p>จัดการข้อมูลและสถานะโรงเรียนมัธยมปลาย</p>
                </div>
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    disabled={loading}
                    onClick={handleOpenCreate}
                >
                    เพิ่มโรงเรียนมัธยมปลาย
                </Button>
            </div>

            <div className="table-card master-data-table-card">
                <div className="master-data-table-heading">
                    <div>
                        <h2>รายการโรงเรียนมัธยมปลาย</h2>
                    </div>
                </div>

                <CustomTable<HighSchoolListItem>
                    rowKey="id"
                    showNo={false}
                    columns={columns}
                    dataSource={schools}
                    loading={loading}
                    searchPlaceholder="ค้นหาชื่อโรงเรียน..."
                    tableLayout="fixed"
                    size="small"
                    scroll={{ x: 1100 }}
                />
            </div>

            <Modal
                title="รายละเอียดโรงเรียนมัธยมปลาย"
                open={Boolean(viewingSchool)}
                width={760}
                footer={
                    <Button onClick={() => setViewingSchool(null)}>ปิด</Button>
                }
                onCancel={() => setViewingSchool(null)}
            >
                {viewingSchool && (
                    <>
                        <Descriptions
                            bordered
                            size="small"
                            column={1}
                            items={[
                                {
                                    key: 'school_name',
                                    label: 'ชื่อโรงเรียน',
                                    children: viewingSchool.school_name,
                                },
                                {
                                    key: 'address',
                                    label: 'ที่อยู่',
                                    children: getSchoolAddress(viewingSchool),
                                },
                                {
                                    key: 'latitude',
                                    label: 'ละติจูด',
                                    children: viewingSchool.latitude,
                                },
                                {
                                    key: 'longitude',
                                    label: 'ลองจิจูด',
                                    children: viewingSchool.longitude,
                                },
                                {
                                    key: 'status',
                                    label: 'สถานะ',
                                    children: (
                                        <Tag
                                            color={
                                                viewingSchool.status ===
                                                'active'
                                                    ? 'success'
                                                    : undefined
                                            }
                                        >
                                            {viewingSchool.status === 'active'
                                                ? 'ใช้งาน'
                                                : 'ไม่ใช้งาน'}
                                        </Tag>
                                    ),
                                },
                                {
                                    key: 'created_at',
                                    label: 'สร้างเมื่อ',
                                    children: formatThaiDateTime(
                                        viewingSchool.created_at,
                                    ),
                                },
                                {
                                    key: 'created_by',
                                    label: 'สร้างโดย',
                                    children: viewingSchool.created_by || '-',
                                },
                                {
                                    key: 'updated_at',
                                    label: 'แก้ไขล่าสุด',
                                    children: formatThaiDateTime(
                                        viewingSchool.updated_at,
                                    ),
                                },
                                {
                                    key: 'updated_by',
                                    label: 'แก้ไขโดย',
                                    children: viewingSchool.updated_by || '-',
                                },
                            ]}
                        />
                        <div className="school-location-detail">
                            <h3>ตำแหน่งโรงเรียน</h3>
                            <SchoolLocationMap
                                latitude={viewingSchool.latitude}
                                longitude={viewingSchool.longitude}
                            />
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                title={
                    editState?.mode === 'edit'
                        ? 'แก้ไขโรงเรียนมัธยมปลาย'
                        : 'เพิ่มโรงเรียนมัธยมปลาย'
                }
                open={Boolean(editState)}
                okText="บันทึก"
                cancelText="ยกเลิก"
                confirmLoading={saving}
                onOk={() => form.submit()}
                onCancel={() => setEditState(null)}
                afterClose={() => form.resetFields()}
                destroyOnHidden
                width={760}
            >
                <Form<HighSchoolFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={renderRequiredFormMark}
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="school_name"
                        label="ชื่อโรงเรียน"
                        rules={[
                            {
                                required: true,
                                whitespace: true,
                                message: 'กรุณากรอกชื่อโรงเรียน',
                            },
                            {
                                max: 150,
                                message: 'ชื่อโรงเรียนต้องไม่เกิน 150 ตัวอักษร',
                            },
                        ]}
                    >
                        <Input
                            placeholder="กรอกชื่อโรงเรียน"
                            maxLength={150}
                        />
                    </Form.Item>

                    <Form.Item
                        name="province_id"
                        label="จังหวัด"
                        rules={[
                            {
                                required: editState?.mode === 'create',
                                message: 'กรุณาเลือกจังหวัด',
                            },
                        ]}
                    >
                        <ListOfValueSelect
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            placeholder="เลือกจังหวัด"
                            loading={loadingProvinces}
                            error={provincesError}
                            options={toListOfValueOptions(provinces)}
                            onChange={(value) =>
                                void handleProvinceChange(value)
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        name="district_id"
                        label="อำเภอ/เขต"
                        rules={[
                            {
                                required: editState?.mode === 'create',
                                message: 'กรุณาเลือกอำเภอ/เขต',
                            },
                        ]}
                    >
                        <ListOfValueSelect
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            placeholder="เลือกอำเภอ/เขต"
                            disabled={!provinceId}
                            loading={loadingDistricts}
                            error={districtsError}
                            options={toListOfValueOptions(districts)}
                            onChange={(value) =>
                                void handleDistrictChange(value)
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        name="subdistrict_id"
                        label="ตำบล/แขวง"
                        rules={[
                            {
                                required: true,
                                message: 'กรุณาเลือกตำบล/แขวง',
                            },
                        ]}
                    >
                        <ListOfValueSelect
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            placeholder="เลือกตำบล/แขวง"
                            disabled={!districtId}
                            loading={loadingSubdistricts}
                            error={subdistrictsError}
                            options={[
                                ...toListOfValueOptions(subdistricts),
                                ...(editState?.school &&
                                !subdistricts.some(
                                    (subdistrict) =>
                                        subdistrict.id ===
                                        editState.school?.subdistrict_id,
                                )
                                    ? [
                                          {
                                              label:
                                                  editState.school
                                                      .subdistrict_name ??
                                                  'ตำบลปัจจุบัน',
                                              value: editState.school
                                                  .subdistrict_id,
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="latitude"
                        label="ละติจูด"
                        rules={[
                            {
                                required: true,
                                message: 'กรุณากรอกละติจูด',
                            },
                            {
                                type: 'number',
                                min: -90,
                                max: 90,
                                message: 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90',
                            },
                        ]}
                    >
                        <InputNumber
                            placeholder="เช่น 13.36110000"
                            min={-90}
                            max={90}
                            precision={8}
                            step={0.00000001}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="longitude"
                        label="ลองจิจูด"
                        rules={[
                            {
                                required: true,
                                message: 'กรุณากรอกลองจิจูด',
                            },
                            {
                                type: 'number',
                                min: -180,
                                max: 180,
                                message: 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180',
                            },
                        ]}
                    >
                        <InputNumber
                            placeholder="เช่น 100.98470000"
                            min={-180}
                            max={180}
                            precision={8}
                            step={0.00000001}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <div className="school-location-form-field">
                        <strong>ระบุตำแหน่งบนแผนที่</strong>
                        <p>
                            คลิกบนแผนที่เพื่อปักหมุด
                            หรือลากหมุดเพื่อปรับตำแหน่ง
                        </p>
                        <SchoolLocationMap
                            editable
                            latitude={latitude}
                            longitude={longitude}
                            onPositionChange={(nextLatitude, nextLongitude) =>
                                form.setFieldsValue({
                                    latitude: Number(nextLatitude.toFixed(8)),
                                    longitude: Number(
                                        nextLongitude.toFixed(8),
                                    ),
                                })
                            }
                        />
                    </div>
                </Form>
            </Modal>
        </div>
    )
}
