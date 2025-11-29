// Shared types and utilities for Tražim-Radnike.online

// ============================================
// Enums
// ============================================

export enum Role {
  GUEST = 'GUEST',
  EMPLOYER = 'EMPLOYER',
  ADMIN = 'ADMIN',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
}

export enum Visibility {
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
  PUBLIC = 'PUBLIC',
}

export enum Urgency {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum UploadType {
  WORKPLACE_PHOTO = 'WORKPLACE_PHOTO',
  HOUSING_PHOTO = 'HOUSING_PHOTO',
  DOCUMENT = 'DOCUMENT',
}

export enum ConversationType {
  AI_ASSISTANT = 'AI_ASSISTANT',
  EMPLOYER_ADMIN = 'EMPLOYER_ADMIN',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum MessageRole {
  EMPLOYER = 'EMPLOYER',
  ADMIN = 'ADMIN',
  AI_ASSISTANT = 'AI_ASSISTANT',
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

// ============================================
// Types
// ============================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  role: Role;
  gdprConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  country: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  createdAt: Date;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  descriptionFull: string;
  descriptionPublic?: string;
  salary?: string;
  numWorkers: number;
  location: string;
  housing: boolean;
  housingDesc?: string;
  experience?: string;
  languages: string[];
  urgency: Urgency;
  status: JobStatus;
  visibility: Visibility;
  secretToken?: string;
  secretExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Upload {
  id: string;
  jobId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadType: UploadType;
  description?: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  jobId?: string;
  fromUserId?: string;
  fromRole: MessageRole;
  content: string;
  isFromAI: boolean;
  attachments?: Record<string, unknown>[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  jobId?: string;
  userId: string;
  type: ConversationType;
  status: ConversationStatus;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// Request/Response DTOs
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
  gdprConsent: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface CreateJobRequest {
  title: string;
  descriptionFull: string;
  descriptionPublic?: string;
  salary?: string;
  numWorkers: number;
  location: string;
  housing: boolean;
  housingDesc?: string;
  experience?: string;
  languages: string[];
  urgency?: Urgency;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: JobStatus;
  visibility?: Visibility;
}

export interface SendChatMessageRequest {
  content: string;
  attachments?: string[];
}

// ============================================
// Utility Types
// ============================================

export type JobPublicView = Pick<
  Job,
  'id' | 'title' | 'slug' | 'descriptionPublic' | 'location' | 'createdAt'
> & {
  companyName: string;
  companyCountry: string;
};

export type JobSecretView = Job & {
  company: Company;
  uploads: Upload[];
};

// ============================================
// Constants
// ============================================

export const SUPPORTED_COUNTRIES = [
  { code: 'RS', name: 'Srbija' },
  { code: 'ME', name: 'Crna Gora' },
  { code: 'HR', name: 'Hrvatska' },
  { code: 'BA', name: 'Bosna i Hercegovina' },
  { code: 'MK', name: 'Severna Makedonija' },
  { code: 'BG', name: 'Bugarska' },
  { code: 'RO', name: 'Rumunija' },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

export const CHAT_FLOW_STEPS = [
  'greeting',
  'position',
  'workers',
  'salary',
  'location',
  'hours',
  'housing',
  'experience',
  'languages',
  'photos',
  'confirmation',
] as const;

export type ChatFlowStep = (typeof CHAT_FLOW_STEPS)[number];
