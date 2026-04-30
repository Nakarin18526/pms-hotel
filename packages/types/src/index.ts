export type ID = string;

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "AWAITING_VERIFICATION" | "PAID";
export type PaymentMethod = "STRIPE" | "PROMPTPAY";
export type AuthProvider = "EMAIL" | "GOOGLE";
export type Role = "GUEST" | "ADMIN";

export interface RoomType {
  id: ID;
  name: string;
  description: string;
  maxOccupancy: number;
  totalUnits: number;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomTypeInput {
  name: string;
  description: string;
  maxOccupancy: number;
  totalUnits: number;
  imageUrls?: string[];
}

export interface UpdateRoomTypeInput extends Partial<CreateRoomTypeInput> {}

export interface RoomRate {
  id: ID;
  roomTypeId: ID;
  date: string; // ISO yyyy-mm-dd
  price: number;
}

export interface SetRoomRateRangeInput {
  startDate: string;
  endDate: string;
  price: number;
}

export interface AvailabilityQuery {
  roomTypeId?: ID;
  checkIn: string; // yyyy-mm-dd
  checkOut: string;
}

export interface AvailabilityRoomTypeResult {
  roomTypeId: ID;
  name: string;
  maxOccupancy: number;
  totalUnits: number;
  availableUnits: number;
  available: boolean;
  imageUrls: string[];
  description: string;
  totalPrice: number;
  nights: number;
  pricePerNight: { date: string; price: number }[];
  unavailableReason?: "NO_RATES" | "FULLY_BOOKED";
}

export interface CreateBookingInput {
  roomTypeId: ID;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
}

export interface AdminCreateBookingInput extends CreateBookingInput {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

export interface UpdateBookingInput {
  checkIn?: string;
  checkOut?: string;
  roomTypeId?: ID;
  guestName?: string;
  guestPhone?: string;
}

export interface Booking {
  id: ID;
  roomTypeId: ID;
  guestId: ID | null;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripeSessionId: string | null;
  slipUrl: string | null;
  slipUploadedAt: string | null;
  slipVerifiedAt: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  createdAt: string;
  updatedAt: string;
  roomType?: RoomType;
}

export interface CheckoutSessionResponse {
  bookingId: ID;
  checkoutUrl: string;
  sessionId: string;
}

export interface AuthSession {
  userId: ID;
  email: string;
  name: string | null;
  role: Role;
}
