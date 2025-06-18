```typescript
import { PublicKey } from '@solana/web3.js';

export interface StreamData {
  id: string;
  name: string;
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  depositedAmount: number;
  withdrawnAmount: number;
  startTime: number;
  endTime: number;
  cliffTime?: number;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  automaticWithdrawal: boolean;
  withdrawalFrequency: number;
  createdAt: number;
  updatedAt: number;
  status: StreamStatus;
  category: StreamCategory;
  rate: number;
  remainingAmount: number;
  streamedAmount: number;
  fees: StreamFees;
  metadata?: StreamMetadata;
}

export interface StreamFees {
  creationFee: number;
  withdrawalFee: number;
  cancellationFee: number;
  platformFee: number;
}

export interface StreamMetadata {
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  attachments?: StreamAttachment[];
}

export interface StreamAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  STREAMING = 'streaming',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CANCELLED_BY_SENDER = 'cancelled_by_sender',
  CANCELLED_BY_RECIPIENT = 'cancelled_by_recipient'
}

export enum StreamCategory {
  SALARY = 'salary',
  VESTING = 'vesting',
  INVESTMENT = 'investment',
  GRANT = 'grant',
  LOAN = 'loan',
  PAYMENT = 'payment',
  OTHER = 'other'
}

export interface CreateStreamParams {
  name: string;
  recipient: PublicKey;
  mint: PublicKey;
  depositAmount: number;
  startTime: number;
  endTime: number;
  cliffTime?: number;
  cancelableBySender?: boolean;
  cancelableByRecipient?: boolean;
  transferableBySender?: boolean;
  transferableByRecipient?: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
  category?: StreamCategory;
  metadata?: Omit<StreamMetadata, 'attachments'>;
}

export interface UpdateStreamParams {
  streamId: string;
  name?: string;
  cancelableBySender?: boolean;
  cancelableByRecipient?: boolean;
  transferableBySender?: boolean;
  transferableByRecipient?: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
  metadata?: Omit<StreamMetadata, 'attachments'>;
}

export interface WithdrawFromStreamParams {
  streamId: string;
  amount: number;
}

export interface CancelStreamParams {
  streamId: string;
  reason?: string;
}

export interface TransferStreamParams {
  streamId: string;
  newRecipient: PublicKey;
}

export interface StreamActivity {
  id: string;
  streamId: string;
  type: StreamActivityType;
  amount?: number;
  timestamp: number;
  txSignature: string;
  actor: PublicKey;
  metadata?: Record<string, any>;
}

export enum StreamActivityType {
  CREATED = 'created',
  WITHDRAWN = 'withdrawn',
  CANCELLED = 'cancelled',
  TRANSFERRED = 'transferred',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  UPDATED = 'updated'
}

export interface StreamTemplate {
  id: string;
  name: string;
  description: string;
  category: StreamCategory;
  duration: number;
  cliffDuration?: number;
  withdrawalFrequency: number;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  automaticWithdrawal: boolean;
  isPublic: boolean;
  createdBy: PublicKey;
  createdAt: number;
  usageCount: number;
}

export interface StreamAnalytics {
  totalStreams: number;
  activeStreams: number;
  completedStreams: number;
  cancelledStreams: number;
  totalValueLocked: number;
  totalWithdrawn: number;
  averageStreamDuration: number;
  topTokens: TokenAnalytics[];
  streamsByCategory: CategoryAnalytics[];
  monthlyVolume: MonthlyVolumeData[];
}

export interface TokenAnalytics {
  mint: PublicKey;
  symbol: string;
  name: string;
  totalStreams: number;
  totalValue: number;
  averageStreamSize: number;
}

export interface CategoryAnalytics {
  category: StreamCategory;
  count: number;
  totalValue: number;
  percentage: number;
}

export interface MonthlyVolumeData {
  month: string;
  volume: number;
  streamCount: number;
}

export interface StreamFilter {
  status?: StreamStatus[];
  category?: StreamCategory[];
  sender?: PublicKey;
  recipient?: PublicKey;
  mint?: PublicKey;
  startTimeFrom?: number;
  startTimeTo?: number;
  endTimeFrom?: number;
  endTimeTo?: number;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}

export interface StreamSort {
  field: StreamSortField;
  direction: 'asc' | 'desc';
}

export enum StreamSortField {
  CREATED_AT = 'createdAt',
  START_TIME = 'startTime',
  END_TIME = 'endTime',
  AMOUNT = 'depositedAmount',
  NAME = 'name',
  STATUS = 'status'
}

export interface PaginatedStreams {
  streams: StreamData[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StreamNotification {
  id: string;
  streamId: string;
  type: StreamNotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  recipient: PublicKey;
  metadata?: Record<string, any>;
}

export enum StreamNotificationType {
  STREAM_STARTED = 'stream_started',
  WITHDRAWAL_AVAILABLE = 'withdrawal_available',
  STREAM_ENDING_SOON = 'stream_ending_soon',
  STREAM_COMPLETED = 'stream_completed',
  STREAM_CANCELLED = 'stream_cancelled',
  STREAM_TRANSFERRED = 'stream_transferred',
  AUTOMATIC_WITHDRAWAL = 'automatic_withdrawal'
}

export interface StreamError {
  code: StreamErrorCode;
  message: string;
  details?: Record<string, any>;
}

export enum StreamErrorCode {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  INVALID_RECIPIENT = 'invalid_recipient',
  INVALID_AMOUNT = 'invalid_amount',
  INVALID_TIME_RANGE = 'invalid_time_range',
  STREAM_NOT_FOUND = 'stream_not_found',
  UNAUTHORIZED = 'unauthorized',
  STREAM_ALREADY_CANCELLED = 'stream_already_cancelled',
  STREAM_NOT_STARTED = 'stream_not_started',
  WITHDRAWAL_NOT_AVAILABLE = 'withdrawal_not_available',
  NETWORK_ERROR = 'network_error',
  PROGRAM_ERROR = 'program_error'
}

export interface StreamAccount {
  publicKey: PublicKey;
  account: {
    sender: PublicKey;
    recipient: PublicKey;
    mint: PublicKey;
    escrow: PublicKey;
    depositedAmount: number;
    withdrawnAmount: number;
    startTime: number;
    endTime: number;
    cliffTime: number;
    rate: number;
    cancelableBySender: boolean;
    cancelableByRecipient: boolean;
    transferableBySender: boolean;
    transferableByRecipient: boolean;
    automaticWithdrawal: boolean;
    withdrawalFrequency: number;
    lastWithdrawalTime: number;
    bump: number;
  };
}

export interface StreamEscrowAccount {
  publicKey: PublicKey;
  account: {
    stream: PublicKey;
    mint: PublicKey;
    amount: number;
    bump: number;
  };
}
```