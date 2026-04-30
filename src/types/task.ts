export enum PriorityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface EventCreationRequest {
  eventDescription?: string;
  linkEvent?: string;
  location?: string;
  isOnline?: boolean;
  reminderMinutesBefore?: number;
  invitedEmails?: string[];
  startTime?: string; // ISO date string
}

export interface TaskCreationRequest {
  title: string;
  description: string;
  startTime: string; // ISO date string
  deadline: string; // ISO date string
  priority: PriorityLevel;
  isEvent?: boolean;
  eventCreationRequest?: EventCreationRequest;
}

export interface TaskResponse {
  taskId: number;
  title: string;
  description: string;
  deadline: string; // ISO date string (UTC)
  status: TaskStatus;
  priority: PriorityLevel;
  createdAt: string; // ISO date string — this IS startTime (BE naming inconsistency)
  completedAt: string | null; // ISO date string
  userId: number;
  isEvent?: boolean;
  eventId?: number | null;
}