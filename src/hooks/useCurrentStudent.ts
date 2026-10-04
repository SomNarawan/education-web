import { useAuth } from './useAuth'

export function useCurrentStudent() {
    const { currentRole, user } = useAuth()

    return {
        currentRole,
        user,
        studentCode: user?.studentCode?.trim() ?? '',
        studyPlanId: user?.studyPlanId ?? null,
    }
}
