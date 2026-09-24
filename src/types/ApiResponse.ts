export interface ApiResponse<T> {
    success: true
    message: string
    data: T
}

export interface ApiErrorResponse {
    success?: false
    message: string
    errors?: Record<string, string | string[]> | null
}
