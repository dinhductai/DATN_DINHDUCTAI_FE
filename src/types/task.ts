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

export interface TaskCreationRequest {
  title: string;
  description: string;
  startTime: string; // ISO date string
  deadline: string; // ISO date string
  priority: PriorityLevel;
}

export interface TaskResponse {
  taskId: number;
  title: string;
  description: string;
  startTime: string; // ISO date string
  deadline: string; // ISO date string
  status: TaskStatus;
  priority: PriorityLevel;
  createdAt: string; // ISO date string
  completedAt: string | null; // ISO date string
  userId: number;
}