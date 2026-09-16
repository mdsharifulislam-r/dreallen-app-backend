export enum SUPPORT_STATUS {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export const supportSearchableFields = ['name', 'email', 'subject', 'feedback'];
