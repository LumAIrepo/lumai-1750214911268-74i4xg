```typescript
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface StreamData {
  id: string;
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  amount: BN;
  startTime: BN;
  endTime: BN;
  cliffTime?: BN;
  withdrawn: BN;
  canceled: boolean;
  paused: boolean;
  name: string;
  description?: string;
  canUpdate: boolean;
  canCancel: boolean;
  canTransfer: boolean;
  automaticWithdrawal: boolean;
  withdrawalFrequency: BN;
  lastWithdrawalTime: BN;
}

export interface StreamMetrics {
  totalStreamed: number;
  totalWithdrawn: number;
  availableToWithdraw: number;
  remainingAmount: number;
  streamedPercentage: number;
  withdrawnPercentage: number;
  timeElapsed: number;
  timeRemaining: number;
  totalDuration: number;
  isActive: boolean;
  isCompleted: boolean;
  isPaused: boolean;
  isCanceled: boolean;
  withdrawalRate: number;
  nextWithdrawalTime?: number;
}

export interface VestingSchedule {
  cliffDuration: number;
  vestingDuration: number;
  cliffAmount: number;
  periodicAmount: number;
  frequency: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
  periods: number;
}

export const STREAM_STATUS = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
} as const;

export type StreamStatus = typeof STREAM_STATUS[keyof typeof STREAM_STATUS];

export const WITHDRAWAL_FREQUENCY = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
} as const;

export function calculateStreamMetrics(stream: StreamData, currentTime: number): StreamMetrics {
  const startTime = stream.startTime.toNumber();
  const endTime = stream.endTime.toNumber();
  const cliffTime = stream.cliffTime?.toNumber() || startTime;
  const totalAmount = stream.amount.toNumber();
  const withdrawnAmount = stream.withdrawn.toNumber();
  
  const totalDuration = endTime - startTime;
  const timeElapsed = Math.max(0, currentTime - startTime);
  const timeRemaining = Math.max(0, endTime - currentTime);
  
  let totalStreamed = 0;
  let availableToWithdraw = 0;
  
  if (stream.canceled) {
    totalStreamed = withdrawnAmount;
    availableToWithdraw = 0;
  } else if (currentTime < startTime) {
    totalStreamed = 0;
    availableToWithdraw = 0;
  } else if (currentTime < cliffTime) {
    totalStreamed = 0;
    availableToWithdraw = 0;
  } else if (currentTime >= endTime) {
    totalStreamed = totalAmount;
    availableToWithdraw = totalAmount - withdrawnAmount;
  } else {
    const vestingDuration = endTime - cliffTime;
    const vestingElapsed = currentTime - cliffTime;
    const vestingProgress = vestingElapsed / vestingDuration;
    
    totalStreamed = Math.floor(totalAmount * vestingProgress);
    availableToWithdraw = totalStreamed - withdrawnAmount;
  }
  
  const remainingAmount = totalAmount - totalStreamed;
  const streamedPercentage = totalAmount > 0 ? (totalStreamed / totalAmount) * 100 : 0;
  const withdrawnPercentage = totalAmount > 0 ? (withdrawnAmount / totalAmount) * 100 : 0;
  
  const isActive = !stream.canceled && !stream.paused && currentTime >= startTime && currentTime < endTime;
  const isCompleted = currentTime >= endTime && !stream.canceled;
  const isPaused = stream.paused;
  const isCanceled = stream.canceled;
  
  const withdrawalRate = totalDuration > 0 ? totalAmount / totalDuration : 0;
  
  let nextWithdrawalTime: number | undefined;
  if (stream.automaticWithdrawal && isActive) {
    const frequency = stream.withdrawalFrequency.toNumber();
    const lastWithdrawal = stream.lastWithdrawalTime.toNumber();
    nextWithdrawalTime = lastWithdrawal + frequency;
  }
  
  return {
    totalStreamed,
    totalWithdrawn: withdrawnAmount,
    availableToWithdraw: Math.max(0, availableToWithdraw),
    remainingAmount,
    streamedPercentage,
    withdrawnPercentage,
    timeElapsed,
    timeRemaining,
    totalDuration,
    isActive,
    isCompleted,
    isPaused,
    isCanceled,
    withdrawalRate,
    nextWithdrawalTime,
  };
}

export function getStreamStatus(stream: StreamData, currentTime: number): StreamStatus {
  if (stream.canceled) {
    return STREAM_STATUS.CANCELED;
  }
  
  if (stream.paused) {
    return STREAM_STATUS.PAUSED;
  }
  
  const startTime = stream.startTime.toNumber();
  const endTime = stream.endTime.toNumber();
  
  if (currentTime < startTime) {
    return STREAM_STATUS.SCHEDULED;
  }
  
  if (currentTime >= endTime) {
    return STREAM_STATUS.COMPLETED;
  }
  
  return STREAM_STATUS.ACTIVE;
}

export function calculateVestingSchedule(
  totalAmount: number,
  startTime: number,
  endTime: number,
  cliffTime?: number,
  frequency: keyof typeof WITHDRAWAL_FREQUENCY = 'DAY'
): VestingSchedule {
  const totalDuration = endTime - startTime;
  const cliffDuration = cliffTime ? cliffTime - startTime : 0;
  const vestingDuration = totalDuration - cliffDuration;
  
  const frequencySeconds = WITHDRAWAL_FREQUENCY[frequency];
  const periods = Math.floor(vestingDuration / frequencySeconds);
  
  const cliffAmount = 0; // No cliff amount in linear vesting
  const periodicAmount = periods > 0 ? totalAmount / periods : totalAmount;
  
  return {
    cliffDuration,
    vestingDuration,
    cliffAmount,
    periodicAmount,
    frequency: frequency.toLowerCase() as VestingSchedule['frequency'],
    periods,
  };
}

export function formatStreamAmount(amount: number, decimals: number = 9): string {
  const divisor = Math.pow(10, decimals);
  const formatted = (amount / divisor).toFixed(decimals);
  
  // Remove trailing zeros
  return parseFloat(formatted).toString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(seconds / 86400);
  const remainingHours = Math.floor((seconds % 86400) / 3600);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatTimeRemaining(endTime: number, currentTime: number): string {
  const remaining = Math.max(0, endTime - currentTime);
  
  if (remaining === 0) {
    return 'Completed';
  }
  
  return formatDuration(remaining);
}

export function calculateWithdrawalFee(amount: number, feePercentage: number = 0): number {
  return Math.floor(amount * (feePercentage / 100));
}

export function isStreamWithdrawable(stream: StreamData, currentTime: number): boolean {
  const metrics = calculateStreamMetrics(stream, currentTime);
  return metrics.availableToWithdraw > 0 && !stream.canceled && !stream.paused;
}

export function isStreamCancelable(stream: StreamData, userPublicKey: PublicKey): boolean {
  return (
    stream.canCancel &&
    (stream.sender.equals(userPublicKey) || stream.recipient.equals(userPublicKey)) &&
    !stream.canceled
  );
}

export function isStreamUpdatable(stream: StreamData, userPublicKey: PublicKey): boolean {
  return (
    stream.canUpdate &&
    stream.sender.equals(userPublicKey) &&
    !stream.canceled
  );
}

export function isStreamTransferable(stream: StreamData, userPublicKey: PublicKey): boolean {
  return (
    stream.canTransfer &&
    stream.recipient.equals(userPublicKey) &&
    !stream.canceled
  );
}

export function getStreamProgress(stream: StreamData, currentTime: number): number {
  const startTime = stream.startTime.toNumber();
  const endTime = stream.endTime.toNumber();
  
  if (currentTime <= startTime) {
    return 0;
  }
  
  if (currentTime >= endTime) {
    return 100;
  }
  
  const totalDuration = endTime - startTime;
  const elapsed = currentTime - startTime;
  
  return Math.min(100, (elapsed / totalDuration) * 100);
}

export function generateStreamId(): string {
  return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateStreamParameters(
  amount: number,
  startTime: number,
  endTime: number,
  cliffTime?: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (startTime >= endTime) {
    errors.push('End time must be after start time');
  }
  
  if (cliffTime && (cliffTime < startTime || cliffTime > endTime)) {
    errors.push('Cliff time must be between start and end time');
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  if (endTime <= currentTime) {
    errors.push('End time must be in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sortStreamsByStatus(streams: StreamData[], currentTime: number): StreamData[] {
  const statusPriority = {
    [STREAM_STATUS.ACTIVE]: 1,
    [STREAM_STATUS.SCHEDULED]: 2,
    [STREAM_STATUS.PAUSED]: 3,
    [STREAM_STATUS.COMPLETED]: 4,
    [STREAM_STATUS.CANCELED]: 5,
  };
  
  return streams.sort((a, b) => {
    const statusA = getStreamStatus(a, currentTime);
    const statusB = getStreamStatus(b, currentTime);
    
    const priorityDiff = statusPriority[statusA] - statusPriority[statusB];
    
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // If same status, sort by start time (newest first)
    return b.startTime.toNumber() - a.startTime.toNumber();
  });
}

export function filterStreamsByStatus(
  streams: StreamData[],
  status: StreamStatus,
  currentTime: number
): StreamData[] {
  return streams.filter(stream => getStreamStatus(stream, currentTime) === status);
}

export function calculateTotalStreamValue(streams: StreamData[]): number {
  return streams.reduce((total, stream) => {
    return total + stream.amount.toNumber();
  }, 0);
}

export function calculateTotalWithdrawn(streams: StreamData[]): number {
  return streams.reduce((total, stream) => {
    return total + stream.withdrawn.toNumber();
  }, 0);
}

export function getUpcomingWithdrawals(
  streams: StreamData[],
  currentTime: number,
  limit: number = 10
): Array<{ stream: StreamData; nextWithdrawal: number; amount: number }> {
  const upcomingWithdrawals = streams
    .filter(stream => {
      const metrics = calculateStreamMetrics(stream, currentTime);
      return metrics.nextWithdrawalTime && metrics.nextWithdrawalTime > currentTime;
    })
    .map(stream => {
      const metrics = calculateStreamMetrics(stream, currentTime);
      return {
        stream,
        nextWithdrawal: metrics.nextWithdrawalTime!,
        amount: metrics.availableToWithdraw,
      };
    })
    .sort((a, b) => a.nextWithdrawal - b.nextWithdrawal)
    .slice(0, limit);
  
  return upcomingWithdrawals;
}
```