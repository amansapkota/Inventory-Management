import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    if (error.message === 'Forbidden') {
      return errorResponse('Forbidden', 403)
    }
    return errorResponse(error.message, 400)
  }
  return errorResponse('Internal server error', 500)
}

export function getSearchParams(url: string) {
  const { searchParams } = new URL(url)
  return {
    page: parseInt(searchParams.get('page') ?? '1'),
    limit: parseInt(searchParams.get('limit') ?? '20'),
    search: searchParams.get('search') ?? '',
    sortBy: searchParams.get('sortBy') ?? 'createdAt',
    sortOrder: (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc',
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    status: searchParams.get('status'),
    branchId: searchParams.get('branchId'),
    warehouseId: searchParams.get('warehouseId'),
    categoryId: searchParams.get('categoryId'),
  }
}
