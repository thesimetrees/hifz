// Satu-satunya sumber kebenaran status & transisi order program.
export const StatusOrder = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  WAITING_CONFIRMATION: 'WAITING_CONFIRMATION',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type StatusOrder = (typeof StatusOrder)[keyof typeof StatusOrder];

// Transisi yang diizinkan: from -> to[]
export const TRANSISI: Record<string, StatusOrder[]> = {
  [StatusOrder.PENDING_PAYMENT]: [
    StatusOrder.WAITING_CONFIRMATION,
    StatusOrder.EXPIRED,
    StatusOrder.CANCELLED,
  ],
  [StatusOrder.WAITING_CONFIRMATION]: [StatusOrder.PROCESSING],
  [StatusOrder.PROCESSING]: [
    StatusOrder.CONFIRMED,
    StatusOrder.REJECTED,
    StatusOrder.WAITING_CONFIRMATION, // unlock
  ],
  [StatusOrder.REJECTED]: [
    StatusOrder.WAITING_CONFIRMATION, // upload ulang
    StatusOrder.EXPIRED,
    StatusOrder.CANCELLED,
  ],
  [StatusOrder.CONFIRMED]: [], // final
  [StatusOrder.EXPIRED]: [],
  [StatusOrder.CANCELLED]: [],
};

export const ORDER_AKTIF: StatusOrder[] = [
  StatusOrder.PENDING_PAYMENT,
  StatusOrder.WAITING_CONFIRMATION,
  StatusOrder.PROCESSING,
];

export const BATAS_ATTEMPT = 3;
export const MENIT_EXPIRED_PENDING = 30;
export const MENIT_LOCK_ADMIN = 15;
export const JAM_WINDOW_UPLOAD_ULANG = 24;
