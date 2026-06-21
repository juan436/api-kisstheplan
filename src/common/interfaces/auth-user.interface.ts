export interface AuthUser {
  id: string;
  email: string;
  name: string;
  weddingId: string | null;
  role: 'owner' | 'collaborator' | null;
}
