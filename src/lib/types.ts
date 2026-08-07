export type UserRole = "student" | "faculty" | "admin";

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export type MachineStatus = "online" | "maintenance" | "offline";

export interface Machine {
  id: string;
  name: string;
  gpu: string;
  vram: string;
  cpu: string;
  ram: string;
  status: MachineStatus;
  location: string;
  tags: string[];
}

export interface Booking {
  id: string;
  machineId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  purpose: string;
  start: string; // ISO
  end: string; // ISO
  status: BookingStatus;
  createdAt: string;
  notes?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}
