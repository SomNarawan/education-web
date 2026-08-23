import type { ManagedMasterDataResource } from '../../types/MasterData'

export interface MasterDataFieldDefinition {
    key: string
    label: string
    placeholder: string
    maxLength: number
}

export interface MasterDataDefinition {
    title: string
    description: string
    itemLabel: string
    searchPlaceholder: string
    displayField: string
    fields: MasterDataFieldDefinition[]
    listFieldKeys?: string[]
    supportsDetail?: boolean
    supportsDelete?: boolean
    refreshAfterMutation?: boolean
}

export const masterDataDefinitions: Record<
    ManagedMasterDataResource,
    MasterDataDefinition
> = {
    titles: {
        title: 'จัดการคำนำหน้าชื่อ',
        description: 'จัดการคำนำหน้าชื่อภาษาไทยและภาษาอังกฤษ',
        itemLabel: 'คำนำหน้าชื่อ',
        searchPlaceholder: 'ค้นหาคำนำหน้าชื่อ...',
        displayField: 'title_abbr_th',
        listFieldKeys: ['title_abbr_th'],
        supportsDetail: true,
        fields: [
            {
                key: 'title_abbr_th',
                label: 'คำนำหน้าย่อ (ไทย)',
                placeholder: 'เช่น นาย',
                maxLength: 50,
            },
            {
                key: 'title_abbr_en',
                label: 'คำนำหน้าย่อ (อังกฤษ)',
                placeholder: 'เช่น Mr.',
                maxLength: 50,
            },
            {
                key: 'title_name_th',
                label: 'ชื่อคำนำหน้า (ไทย)',
                placeholder: 'กรอกชื่อคำนำหน้าภาษาไทย',
                maxLength: 50,
            },
            {
                key: 'title_name_en',
                label: 'ชื่อคำนำหน้า (อังกฤษ)',
                placeholder: 'กรอกชื่อคำนำหน้าภาษาอังกฤษ',
                maxLength: 50,
            },
        ],
    },
    'note-types': {
        title: 'จัดการประเภท Note',
        description: 'จัดการประเภท Note สำหรับใช้บันทึกและติดตามข้อมูลนิสิต',
        itemLabel: 'ประเภท Note',
        searchPlaceholder: 'ค้นหาประเภท Note...',
        displayField: 'note',
        fields: [
            {
                key: 'note',
                label: 'ชื่อประเภท Note',
                placeholder: 'กรอกชื่อประเภท Note',
                maxLength: 255,
            },
        ],
    },
    'import-types': {
        title: 'จัดการประเภทการนำเข้าข้อมูล',
        description: 'จัดการประเภทข้อมูลที่รองรับการนำเข้าสู่ระบบ',
        itemLabel: 'ประเภทการนำเข้า',
        searchPlaceholder: 'ค้นหาประเภทการนำเข้า...',
        displayField: 'type',
        refreshAfterMutation: true,
        fields: [
            {
                key: 'type',
                label: 'ประเภทการนำเข้า',
                placeholder: 'เช่น student',
                maxLength: 50,
            },
        ],
    },
    relationships: {
        title: 'จัดการความสัมพันธ์ผู้ปกครอง',
        description: 'จัดการประเภทความสัมพันธ์ระหว่างนิสิตและผู้ปกครอง',
        itemLabel: 'ความสัมพันธ์ผู้ปกครอง',
        searchPlaceholder: 'ค้นหาความสัมพันธ์ผู้ปกครอง...',
        displayField: 'relationship_name',
        fields: [
            {
                key: 'relationship_name',
                label: 'ความสัมพันธ์',
                placeholder: 'กรอกความสัมพันธ์',
                maxLength: 50,
            },
        ],
    },
    'student-statuses': {
        title: 'จัดการสถานภาพนิสิต',
        description: 'จัดการสถานภาพที่ใช้ระบุสถานะปัจจุบันของนิสิต',
        itemLabel: 'สถานภาพนิสิต',
        searchPlaceholder: 'ค้นหาสถานภาพนิสิต...',
        displayField: 'status_name',
        fields: [
            {
                key: 'status_name',
                label: 'ชื่อสถานภาพ',
                placeholder: 'กรอกชื่อสถานภาพนิสิต',
                maxLength: 50,
            },
        ],
    },
    'admission-channels': {
        title: 'จัดการช่องทางการรับเข้า',
        description: 'จัดการช่องทางและโครงการที่ใช้รับนิสิตเข้าศึกษา',
        itemLabel: 'ช่องทางการรับเข้า',
        searchPlaceholder: 'ค้นหาช่องทางการรับเข้า...',
        displayField: 'channel_name',
        fields: [
            {
                key: 'channel_name',
                label: 'ชื่อช่องทางการรับเข้า',
                placeholder: 'กรอกชื่อช่องทางการรับเข้า',
                maxLength: 100,
            },
        ],
    },
}

export function isMasterDataType(
    value?: string,
): value is ManagedMasterDataResource {
    return Boolean(value && value in masterDataDefinitions)
}
