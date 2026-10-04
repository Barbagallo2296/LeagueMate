export type Role = 'USER' | 'ORGANIZER' | 'ADMIN'

export type TournamentStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED'

export type MatchStatus = 'SCHEDULED' | 'COMPLETED'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface User {
  id: number
  email: string
  username: string
  firstName: string
  lastName: string
  role: Role
}

export interface UserProfile {
  id: number
  userId: number
  username: string
  bio: string | null
  avatarUrl: string | null
  phoneNumber: string | null
}

export interface Tournament {
  id: number
  name: string
  season: string
  status: TournamentStatus
  pointsForWin: number
  pointsForDraw: number
  doubleRoundRobin: boolean
  createdAt: string
}

export interface Team {
  id: number
  name: string
  logoUrl: string | null
  ownerId: number
  createdAt: string
}

export interface Match {
  id: number
  homeTeamId: number
  homeTeamName: string
  awayTeamId: number
  awayTeamName: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  roundNumber: number
}

export interface Round {
  id: number
  roundNumber: number
  matches: Match[]
}

export interface StandingEntry {
  teamName: string
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export interface TournamentStats {
  tournamentId: number
  tournamentName: string
  registeredTeams: number
  totalMatches: number
  playedMatches: number
  remainingMatches: number
  totalGoals: number
  averageGoalsPerMatch: number
  topScoringTeam: string | null
  topScoringTeamGoals: number
}

export type RecapStatus = 'READY' | 'PENDING' | 'FAILED' | 'NOT_AVAILABLE'

export interface RoundRecap {
  status: RecapStatus
  content: string | null
  model: string | null
  generatedAt: string | null
}

export interface AssistantResponse {
  status: 'OK' | 'UNAVAILABLE'
  answer: string | null
  toolsUsed: string[]
  message: string | null
}

export interface Page<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message?: string
  messages?: string[]
}
