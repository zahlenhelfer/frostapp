export interface FrostItem {
  id: string;
  name: string;
  depositDate: string; // ISO date string
}

export interface Shelf {
  id: string;
  name: string;
  items: FrostItem[];
}

export interface Fridge {
  id: string;
  name: string;
  shelfCount: number;
  shelves: Shelf[];
}

export interface CreateFridgeRequest {
  name: string;
  shelfCount: number;
}

export interface UpdateFridgeRequest {
  name?: string;
  shelfCount?: number;
}

export interface CreateItemRequest {
  name: string;
  depositDate: string;
}

export interface UpdateItemRequest {
  name?: string;
  depositDate?: string;
}

export interface UpdateShelfRequest {
  name: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface UserProfile {
  id: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}
