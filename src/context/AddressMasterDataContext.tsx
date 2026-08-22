import {
    createContext,
    useCallback,
    useRef,
    useState,
    type PropsWithChildren,
} from 'react'
import {
    getDistricts,
    getProvinces,
    getSubdistricts,
} from '../services/listOfValueService'
import type { ListOfValue } from '../types/ListOfValue'

interface AddressMasterDataContextValue {
    provinces: ListOfValue[]
    districtsByProvince: Readonly<Record<number, ListOfValue[]>>
    subdistrictsByDistrict: Readonly<Record<number, ListOfValue[]>>
    loadingProvinces: boolean
    loadingDistrictsByProvince: Readonly<Record<number, boolean>>
    loadingSubdistrictsByDistrict: Readonly<Record<number, boolean>>
    provincesError: string | null
    districtErrorsByProvince: Readonly<Record<number, string | null>>
    subdistrictErrorsByDistrict: Readonly<Record<number, string | null>>
    loadProvinces: () => Promise<ListOfValue[]>
    loadDistricts: (provinceId: number) => Promise<ListOfValue[]>
    loadSubdistricts: (districtId: number) => Promise<ListOfValue[]>
}

const AddressMasterDataContext = createContext<
    AddressMasterDataContextValue | undefined
>(undefined)

export function AddressMasterDataProvider({ children }: PropsWithChildren) {
    const [provinces, setProvinces] = useState<ListOfValue[]>([])
    const [districtsByProvince, setDistrictsByProvince] = useState<
        Record<number, ListOfValue[]>
    >({})
    const [subdistrictsByDistrict, setSubdistrictsByDistrict] = useState<
        Record<number, ListOfValue[]>
    >({})
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingDistrictsByProvince, setLoadingDistrictsByProvince] =
        useState<Record<number, boolean>>({})
    const [loadingSubdistrictsByDistrict, setLoadingSubdistrictsByDistrict] =
        useState<Record<number, boolean>>({})
    const [provincesError, setProvincesError] = useState<string | null>(null)
    const [districtErrorsByProvince, setDistrictErrorsByProvince] = useState<
        Record<number, string | null>
    >({})
    const [subdistrictErrorsByDistrict, setSubdistrictErrorsByDistrict] =
        useState<Record<number, string | null>>({})

    const provincesCacheRef = useRef<ListOfValue[] | null>(null)
    const districtsCacheRef = useRef(new Map<number, ListOfValue[]>())
    const subdistrictsCacheRef = useRef(new Map<number, ListOfValue[]>())
    const provincesRequestRef = useRef<Promise<ListOfValue[]> | null>(null)
    const districtRequestsRef = useRef(
        new Map<number, Promise<ListOfValue[]>>(),
    )
    const subdistrictRequestsRef = useRef(
        new Map<number, Promise<ListOfValue[]>>(),
    )

    const loadProvinces = useCallback(async () => {
        if (provincesCacheRef.current) return provincesCacheRef.current
        if (provincesRequestRef.current) return provincesRequestRef.current

        setLoadingProvinces(true)
        setProvincesError(null)

        const request = getProvinces()
            .then((items) => {
                provincesCacheRef.current = items
                setProvinces(items)
                return items
            })
            .catch((error: unknown) => {
                setProvincesError('ไม่สามารถโหลดข้อมูลจังหวัดได้')
                throw error
            })
            .finally(() => {
                provincesRequestRef.current = null
                setLoadingProvinces(false)
            })

        provincesRequestRef.current = request
        return request
    }, [])

    const loadDistricts = useCallback(async (provinceId: number) => {
        const cachedItems = districtsCacheRef.current.get(provinceId)
        if (cachedItems) return cachedItems

        const pendingRequest = districtRequestsRef.current.get(provinceId)
        if (pendingRequest) return pendingRequest

        setLoadingDistrictsByProvince((current) => ({
            ...current,
            [provinceId]: true,
        }))
        setDistrictErrorsByProvince((current) => ({
            ...current,
            [provinceId]: null,
        }))

        const request = getDistricts(provinceId)
            .then((items) => {
                districtsCacheRef.current.set(provinceId, items)
                setDistrictsByProvince((current) => ({
                    ...current,
                    [provinceId]: items,
                }))
                return items
            })
            .catch((error: unknown) => {
                setDistrictErrorsByProvince((current) => ({
                    ...current,
                    [provinceId]: 'ไม่สามารถโหลดข้อมูลอำเภอได้',
                }))
                throw error
            })
            .finally(() => {
                districtRequestsRef.current.delete(provinceId)
                setLoadingDistrictsByProvince((current) => ({
                    ...current,
                    [provinceId]: false,
                }))
            })

        districtRequestsRef.current.set(provinceId, request)
        return request
    }, [])

    const loadSubdistricts = useCallback(async (districtId: number) => {
        const cachedItems = subdistrictsCacheRef.current.get(districtId)
        if (cachedItems) return cachedItems

        const pendingRequest = subdistrictRequestsRef.current.get(districtId)
        if (pendingRequest) return pendingRequest

        setLoadingSubdistrictsByDistrict((current) => ({
            ...current,
            [districtId]: true,
        }))
        setSubdistrictErrorsByDistrict((current) => ({
            ...current,
            [districtId]: null,
        }))

        const request = getSubdistricts(districtId)
            .then((items) => {
                subdistrictsCacheRef.current.set(districtId, items)
                setSubdistrictsByDistrict((current) => ({
                    ...current,
                    [districtId]: items,
                }))
                return items
            })
            .catch((error: unknown) => {
                setSubdistrictErrorsByDistrict((current) => ({
                    ...current,
                    [districtId]: 'ไม่สามารถโหลดข้อมูลตำบลได้',
                }))
                throw error
            })
            .finally(() => {
                subdistrictRequestsRef.current.delete(districtId)
                setLoadingSubdistrictsByDistrict((current) => ({
                    ...current,
                    [districtId]: false,
                }))
            })

        subdistrictRequestsRef.current.set(districtId, request)
        return request
    }, [])

    return (
        <AddressMasterDataContext.Provider
            value={{
                provinces,
                districtsByProvince,
                subdistrictsByDistrict,
                loadingProvinces,
                loadingDistrictsByProvince,
                loadingSubdistrictsByDistrict,
                provincesError,
                districtErrorsByProvince,
                subdistrictErrorsByDistrict,
                loadProvinces,
                loadDistricts,
                loadSubdistricts,
            }}
        >
            {children}
        </AddressMasterDataContext.Provider>
    )
}

export default AddressMasterDataContext
