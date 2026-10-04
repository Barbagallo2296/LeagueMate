const EXACT: Record<string, string> = {
  'A draw cannot be worth more points than a win': 'Un pareggio non può valere più punti di una vittoria',
  'AI features are disabled': 'Le funzioni AI sono disattivate',
  'Cannot demote the last remaining ADMIN': "Non puoi togliere il ruolo all'ultimo amministratore",
  'Cannot generate rounds with less than 2 teams': 'Servono almeno 2 squadre per generare il calendario',
  'Cannot modify a completed tournament': 'Un torneo concluso non si può modificare',
  'Cannot remove the last organizer of a tournament': "Non puoi rimuovere l'ultimo organizzatore del torneo",
  'Cannot delete a team that is registered to one or more tournaments':
    'Non puoi eliminare una squadra iscritta a uno o più tornei',
  'Cannot delete an active tournament. Complete it first.': 'Non puoi eliminare un torneo in corso: chiudilo prima',
  'Points configuration can only be changed while the tournament is in DRAFT status':
    'I punti si possono cambiare solo mentre il torneo è in preparazione',
  'Current password is incorrect': 'La password attuale non è corretta',
  'New password must be different from the current one': 'La nuova password deve essere diversa da quella attuale',
  'Email already registered': 'Questa email è già registrata',
  'Username already taken': 'Questo username è già in uso',
  'Only users with ORGANIZER or ADMIN role can organize a tournament':
    'Solo organizzatori e amministratori possono organizzare un torneo',
  'Team is already registered to this tournament': 'La squadra è già iscritta a questo torneo',
  'User is already a member of this team': "L'utente fa già parte di questa squadra",
  'User is already an organizer of this tournament': "L'utente organizza già questo torneo",
  'User is not an organizer of this tournament': "L'utente non è un organizzatore di questo torneo",
  'You can only modify your own profile': 'Puoi modificare solo il tuo profilo',
  'Invalid username or password': 'Username o password non corretti',
  'Invalid or expired authentication token': 'Sessione scaduta: accedi di nuovo',
  'Invalid or expired refresh token': 'Sessione scaduta: accedi di nuovo',
  "You don't have permission to access this resource": 'Non hai i permessi per questa operazione',
  'The request conflicts with existing data': 'La richiesta è in conflitto con dati già esistenti',
  'Malformed or unreadable request body': 'I dati inviati non sono validi',
  'Endpoint not found': 'Risorsa non trovata',
  'An unexpected error occurred': 'Si è verificato un errore imprevisto',
  'Avatar URL cannot exceed 255 characters': "L'indirizzo dell'immagine può avere al massimo 255 caratteri",
  'Away score is required': 'Inserisci i gol della squadra in trasferta',
  'Home score is required': 'Inserisci i gol della squadra di casa',
  'Score cannot be negative': 'I gol non possono essere negativi',
  'Score cannot exceed 99': 'I gol possono essere al massimo 99',
  'Bio cannot exceed 500 characters': 'La bio può avere al massimo 500 caratteri',
  'Current password is required': 'Inserisci la password attuale',
  'New password is required': 'Inserisci la nuova password',
  'Password is required': 'Inserisci la password',
  'Password must be between 8 and 72 characters long': 'La password deve avere da 8 a 72 caratteri',
  'Email is required': "Inserisci l'email",
  'Email cannot exceed 100 characters': "L'email può avere al massimo 100 caratteri",
  'Invalid email format': "L'email non è valida",
  'First name is required': 'Inserisci il nome',
  'First name cannot exceed 50 characters': 'Il nome può avere al massimo 50 caratteri',
  'Last name is required': 'Inserisci il cognome',
  'Last name cannot exceed 50 characters': 'Il cognome può avere al massimo 50 caratteri',
  'Username is required': 'Inserisci lo username',
  'Username must be between 3 and 20 characters': 'Lo username deve avere da 3 a 20 caratteri',
  'Logo URL cannot exceed 255 characters': "L'indirizzo del logo può avere al massimo 255 caratteri",
  'Phone number must contain only digits, spaces and an optional leading +':
    'Il telefono può contenere solo numeri e spazi, con un + iniziale facoltativo',
  'Points for draw cannot be negative': 'I punti per il pareggio non possono essere negativi',
  'Points for win must be at least 1': 'La vittoria deve valere almeno 1 punto',
  'Question is required': 'Scrivi una domanda',
  'Question cannot exceed 300 characters': 'La domanda può avere al massimo 300 caratteri',
  'Season is required': 'Inserisci la stagione',
  'Season cannot exceed 20 characters': 'La stagione può avere al massimo 20 caratteri',
  'Team name is required': 'Inserisci il nome della squadra',
  'Team name must be between 2 and 50 characters': 'Il nome della squadra deve avere da 2 a 50 caratteri',
  'Team role is required': 'Scegli il ruolo nella squadra',
  'Tournament name is required': 'Inserisci il nome del torneo',
  'Tournament name cannot exceed 100 characters': 'Il nome del torneo può avere al massimo 100 caratteri',
  'User ID is required': 'Scegli un utente',
  'Role is required': 'Scegli un ruolo',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'in preparazione',
  ACTIVE: 'in corso',
  COMPLETED: 'concluso',
}

const NOT_FOUND: Record<string, string> = {
  Tournament: 'Torneo non trovato',
  Team: 'Squadra non trovata',
  'Team member': 'Membro della squadra non trovato',
  Match: 'Partita non trovata',
  Round: 'Giornata non trovata',
  User: 'Utente non trovato',
}

const PATTERNS: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^Round (\d+) is not complete yet$/, (m) => `La giornata ${m[1]} non è ancora completa`],
  [
    /^Cannot complete the tournament: (\d+) matches still to be played$/,
    (m) => `Impossibile chiudere il torneo: mancano ancora ${m[1]} partite`,
  ],
  [
    /^Cannot register teams to a tournament that is not in DRAFT status\. Current status: (\w+)$/,
    (m) => `Si possono iscrivere squadre solo a un torneo in preparazione (ora è ${STATUS_LABELS[m[1]] ?? m[1]})`,
  ],
  [
    /^Rounds can only be generated for a tournament in DRAFT status\. Current status: (\w+)$/,
    (m) => `Il calendario si può generare solo per un torneo in preparazione (ora è ${STATUS_LABELS[m[1]] ?? m[1]})`,
  ],
  [
    /^Only an ACTIVE tournament can be completed\. Current status: (\w+)$/,
    (m) => `Si può chiudere solo un torneo in corso (ora è ${STATUS_LABELS[m[1]] ?? m[1]})`,
  ],
  [
    /^Match results can only be updated while the tournament is ACTIVE\. Current status: (\w+)$/,
    (m) => `I risultati si possono inserire solo in un torneo in corso (ora è ${STATUS_LABELS[m[1]] ?? m[1]})`,
  ],
  [/^Team name '(.+)' is already taken$/, (m) => `Il nome "${m[1]}" è già usato da un'altra squadra`],
  [/^Too many login attempts\. Retry in (\d+) seconds$/, (m) => `Troppi tentativi di accesso. Riprova tra ${m[1]} secondi`],
  [
    /^Too many questions to the assistant\. Retry in (\d+) seconds$/,
    (m) => `Troppe domande all'assistente. Riprova tra ${m[1]} secondi`,
  ],
  [/^(Team member|Tournament|Team|Match|Round|User) not found\b.*$/, (m) => NOT_FOUND[m[1]]],
]

function translateOne(message: string): string {
  const exact = EXACT[message]
  if (exact) return exact
  for (const [pattern, build] of PATTERNS) {
    const match = message.match(pattern)
    if (match) return build(match)
  }
  return message
}

export function translateError(message: string): string {
  const validation = message.match(/^(\w+): (.+)$/)
  if (validation && EXACT[validation[2]]) {
    return EXACT[validation[2]]
  }
  return translateOne(message)
}
