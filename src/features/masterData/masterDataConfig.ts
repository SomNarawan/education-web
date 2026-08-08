export type MasterDataType =
    | 'high-schools'
    | 'titles'
    | 'student-statuses'
    | 'admission-channels'
    | 'relationships'

export interface MasterDataRecord {
    id: number
    [key: string]: string | number | null
}

export interface MasterDataFieldDefinition {
    key: string
    label: string
    placeholder: string
    required?: boolean
}

export interface MasterDataDefinition {
    title: string
    description: string
    itemLabel: string
    searchPlaceholder: string
    fields: MasterDataFieldDefinition[]
    mockData: MasterDataRecord[]
}

export const masterDataDefinitions: Record<
    MasterDataType,
    MasterDataDefinition
> = {
    'high-schools': {
        title: 'จัดการโรงเรียนมัธยมปลาย',
        description: 'จัดการรายชื่อโรงเรียนมัธยมปลายสำหรับใช้อ้างอิงในข้อมูลนิสิต',
        itemLabel: 'โรงเรียนมัธยมปลาย',
        searchPlaceholder: 'ค้นหาชื่อโรงเรียน...',
        fields: [
            {
                key: 'school_name',
                label: 'ชื่อโรงเรียน',
                placeholder: 'กรอกชื่อโรงเรียน',
                required: true,
            },
        ],
        mockData: [
            { id: 1, school_name: 'โรงเรียนสาธิตมหาวิทยาลัยบูรพา' },
            { id: 2, school_name: 'โรงเรียนชลราษฎรอำรุง' },
            { id: 3, school_name: 'โรงเรียนชลกันยานุกูล' },
            { id: 4, school_name: 'โรงเรียนเบญจมราชรังสฤษฎิ์' },
            { id: 5, school_name: 'โรงเรียนระยองวิทยาคม' },
        ],
    },
    titles: {
        title: 'จัดการคำนำหน้าชื่อ',
        description: 'จัดการคำนำหน้าชื่อภาษาไทยและภาษาอังกฤษ',
        itemLabel: 'คำนำหน้าชื่อ',
        searchPlaceholder: 'ค้นหาคำนำหน้าชื่อ...',
        fields: [
            {
                key: 'title_abbr_th',
                label: 'คำนำหน้าชื่อ (ไทย)',
                placeholder: 'เช่น นาย',
                required: true,
            },
            {
                key: 'title_abbr_en',
                label: 'คำนำหน้าชื่อ (อังกฤษ)',
                placeholder: 'เช่น Mr.',
                required: true,
            },
        ],
        mockData: [
            { id: 1, title_abbr_th: 'นาย', title_abbr_en: 'Mr.' },
            { id: 2, title_abbr_th: 'นางสาว', title_abbr_en: 'Ms.' },
            { id: 3, title_abbr_th: 'นาง', title_abbr_en: 'Mrs.' },
        ],
    },
    'student-statuses': {
        title: 'จัดการสถานภาพนิสิต',
        description: 'จัดการสถานภาพที่ใช้ระบุสถานะปัจจุบันของนิสิต',
        itemLabel: 'สถานภาพนิสิต',
        searchPlaceholder: 'ค้นหาสถานภาพนิสิต...',
        fields: [
            {
                key: 'status_name',
                label: 'ชื่อสถานภาพ',
                placeholder: 'กรอกชื่อสถานภาพนิสิต',
                required: true,
            },
        ],
        mockData: [
            { id: 1, status_name: 'กำลังศึกษา' },
            { id: 2, status_name: 'สำเร็จการศึกษา' },
            { id: 3, status_name: 'พ้นสภาพ' },
            { id: 4, status_name: 'ลาพักการศึกษา' },
        ],
    },
    'admission-channels': {
        title: 'จัดการช่องทางการรับเข้า',
        description: 'จัดการช่องทางและโครงการที่ใช้รับนิสิตเข้าศึกษา',
        itemLabel: 'ช่องทางการรับเข้า',
        searchPlaceholder: 'ค้นหาช่องทางการรับเข้า...',
        fields: [
            {
                key: 'channel_name',
                label: 'ชื่อช่องทางการรับเข้า',
                placeholder: 'กรอกชื่อช่องทางการรับเข้า',
                required: true,
            },
        ],
        mockData: [
            { id: 1, channel_name: 'TCAS รอบที่ 1 Portfolio' },
            { id: 2, channel_name: 'TCAS รอบที่ 2 Quota' },
            { id: 3, channel_name: 'TCAS รอบที่ 3 Admission' },
            { id: 4, channel_name: 'โครงการรับตรงมหาวิทยาลัย' },
        ],
    },
    relationships: {
        title: 'จัดการความสัมพันธ์ผู้ปกครอง',
        description: 'จัดการประเภทความสัมพันธ์ระหว่างนิสิตและผู้ปกครอง',
        itemLabel: 'ความสัมพันธ์ผู้ปกครอง',
        searchPlaceholder: 'ค้นหาความสัมพันธ์ผู้ปกครอง...',
        fields: [
            {
                key: 'relationship_name',
                label: 'ความสัมพันธ์',
                placeholder: 'กรอกความสัมพันธ์',
                required: true,
            },
        ],
        mockData: [
            { id: 1, relationship_name: 'บิดา' },
            { id: 2, relationship_name: 'มารดา' },
            { id: 3, relationship_name: 'ญาติ' },
            { id: 4, relationship_name: 'ผู้ปกครองตามกฎหมาย' },
        ],
    },
}

export function isMasterDataType(value?: string): value is MasterDataType {
    return Boolean(value && value in masterDataDefinitions)
}
