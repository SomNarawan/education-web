import { useContext } from 'react'
import AddressMasterDataContext from '../context/AddressMasterDataContext'

export function useAddressMasterData() {
    const context = useContext(AddressMasterDataContext)

    if (!context) {
        throw new Error(
            'useAddressMasterData must be used within AddressMasterDataProvider',
        )
    }

    return context
}
