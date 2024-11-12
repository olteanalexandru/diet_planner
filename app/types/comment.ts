export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  likes: number;
  isLiked: boolean;
}

export interface CommentResponse {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}
