import type { Role } from './permissions'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  initials: string
}

interface DemoUser extends User {
  password: string
}

// Hackathon demo credentials only — never do this in a real product. This
// directory exists purely so Nationals judges (or you, mid-demo) can
// switch personas instantly without a real identity provider behind it.
// analyst@demo.com / analyst123
// manager@demo.com / manager123
// admin@demo.com   / admin123
export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-analyst',
    name: 'Priya Nair',
    email: 'analyst@demo.com',
    role: 'analyst',
    initials: 'PN',
    password: 'analyst123',
  },
  {
    id: 'user-manager',
    name: 'Marcus Webb',
    email: 'manager@demo.com',
    role: 'manager',
    initials: 'MW',
    password: 'manager123',
  },
  {
    id: 'user-admin',
    name: 'Elena Torres',
    email: 'admin@demo.com',
    role: 'admin',
    initials: 'ET',
    password: 'admin123',
  },
]
