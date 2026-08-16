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
} from '../services/masterDataService'
import type { District, Province, Subdistrict } from '../types/MasterData'

interface AddressMasterDataContextValue {
    provinces: Province[]
    districtsByProvince: Readonly<Record<number, District[]>>
    subdistrictsByDistrict: Readonly<Record<number, Subdistrict[]>>
    loadingProvinces: boolean
    loadingDistrictsByProvince: Readonly<Record<number, boolean>>
    loadingSubdistrictsByDistrict: Readonly<Record<number, boolean>>
    loadProvinces: () => Promise<Province[]>
    loadDistricts: (provinceId: number) => Promise<District[]>
    loadSubdistricts: (districtId: number) => Promise<Subdistrict[]>
}

const AddressMasterDataContext = createContext<
    AddressMasterDataContextValue | undefined
>(undefined)

export function AddressMasterDataProvider({ children }: PropsWithChildren) {
    const [provinces, setProvinces] = useState<Province[]>([])
    const [districtsByProvince, setDistrictsByProvince] = useState<
        Record<number, District[]>
    >({})
    const [subdistrictsByDistrict, setSubdistrictsByDistrict] = useState<
        Record<number, Subdistrict[]>
    >({})
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingDistrictsByProvince, setLoadingDistrictsByProvince] =
        useState<Record<number, boolean>>({})
    const [loadingSubdistrictsByDistrict, setLoadingSubdistrictsByDistrict] =
        useState<Record<number, boolean>>({})

    const provincesCacheRef = useRef<Province[] | null>(null)
    const districtsCacheRef = useRef(new Map<number, District[]>())
    const subdistrictsCacheRef = useRef(new Map<number, Subdistrict[]>())
    const provincesRequestRef = useRef<Promise<Province[]> | null>(null)
    const districtRequestsRef = useRef(new Map<number, Promise<District[]>>())
    const subdistrictRequestsRef = useRef(
        new Map<number, Promise<Subdistrict[]>>(),
    )

    const loadProvinces = useCallback(async () => {
        if (provincesCacheRef.current) return provincesCacheRef.current
        if (provincesRequestRef.current) return provincesRequestRef.current

        setLoadingProvinces(true)

        const request = getProvinces()
            .then((items) => {
                provincesCacheRef.current = items
                setProvinces(items)
                return items
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

        const request = getDistricts(provinceId)
            .then((items) => {
                districtsCacheRef.current.set(provinceId, items)
                setDistrictsByProvince((current) => ({
                    ...current,
                    [provinceId]: items,
                }))
                return items
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

        const request = getSubdistricts(districtId)
            .then((items) => {
                subdistrictsCacheRef.current.set(districtId, items)
                setSubdistrictsByDistrict((current) => ({
                    ...current,
                    [districtId]: items,
                }))
                return items
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
