export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
  cars?: Car[];
}

export interface Car {
  id: string;
  userId: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  description: string | null;
  horsepower: number | null;
  photos: string[];
  isFeatured: boolean;
  owner?: User;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  photos: string[];
  postType: "GENERAL" | "BUILD_UPDATE" | "DYNO_RESULT" | "PHOTO";
  carId: string | null;
  car: Car | null;
  dynoHp: number | null;
  dynoTorque: number | null;
  dynoRpm: number | null;
  author: User;
  createdAt: string;
  _count: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  location: string;
  date: string;
  coverImageUrl: string | null;
  organizer: User;
  createdAt: string;
  _count: {
    rsvps: number;
  };
  rsvps?: RSVP[];
  userRsvp?: RSVP;
}

export interface RSVP {
  id: string;
  eventId: string;
  userId: string;
  status: "GOING" | "MAYBE" | "NOT_GOING";
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "RSVP" | "CLUB_INVITE";
  read: boolean;
  postId: string | null;
  commentId: string | null;
  eventId: string | null;
  clubId: string | null;
  actor: User;
  createdAt: string;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: User;
  user2: User;
  messages?: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  sender?: User;
  receiver?: User;
  createdAt: string;
}

export interface BuildUpdate {
  id: string;
  carId: string;
  title: string;
  description: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CarMod {
  id: string;
  carId: string;
  category: string;
  partName: string;
  brand: string | null;
  price: number | null;
  installDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
  status: "ACTIVE" | "SOLD" | "REMOVED";
  category: string;
  photos: string[];
  location: string | null;
  carMake: string | null;
  carModel: string | null;
  carYear: number | null;
  seller: User;
  createdAt: string;
  updatedAt: string;
}

export interface CarClub {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  creatorId: string;
  creator: User;
  _count?: { memberships: number; clubPosts: number };
  isMember?: boolean;
  createdAt: string;
}

export interface ClubPost {
  id: string;
  clubId: string;
  authorId: string;
  content: string;
  photos: string[];
  createdAt: string;
}
