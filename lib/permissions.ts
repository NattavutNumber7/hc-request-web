import { User, HCRequest } from '@/types'

export function canViewRequest(user: User, request: HCRequest): boolean {
  if (user.role === 'people_experience' || user.role === 'ceo') return true
  return request.manager_email === user.email
}

export function canViewAllRequests(user: User): boolean {
  return user.role === 'people_experience' || user.role === 'ceo'
}

export function canEditRequest(user: User, request: HCRequest): boolean {
  if (user.role === 'people_experience' || user.role === 'ceo') {
    return request.status === 'Open'
  }
  return request.manager_email === user.email && request.status === 'Open'
}

export function canCancelRequest(user: User, request: HCRequest): boolean {
  if (user.role === 'people_experience' || user.role === 'ceo') return true
  return request.manager_email === user.email && request.status === 'Open'
}

export function canAssign(user: User, request: HCRequest): boolean {
  return user.role === 'people_experience' && !request.assigned_to && request.status === 'Open'
}

export function canChangeStatus(user: User): boolean {
  return user.role === 'people_experience' || user.role === 'ceo'
}

export function canViewDashboard(user: User): boolean {
  return user.role === 'people_experience' || user.role === 'ceo'
}

export function canViewAuditLog(user: User): boolean {
  return user.role === 'people_experience' || user.role === 'ceo'
}

export function canSelectCrossDepartment(user: User): boolean {
  return user.role === 'ceo'
}
