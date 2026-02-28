
export interface Student {
  id: string;
  name: string;
  grade: string;
  email: string;
  avatar: string;
}

export interface CheckInRecord {
  studentId: string;
  timestamp: string;
  eventType: 'check-in' | 'check-out';
}

export const MOCK_STUDENTS: Student[] = [
  { id: 'S1001', name: 'Alice Johnson', grade: '10th', email: 'alice.j@school.edu', avatar: 'https://picsum.photos/seed/s1/100/100' },
  { id: 'S1002', name: 'Bob Smith', grade: '11th', email: 'bob.s@school.edu', avatar: 'https://picsum.photos/seed/s2/100/100' },
  { id: 'S1003', name: 'Charlie Davis', grade: '9th', email: 'charlie.d@school.edu', avatar: 'https://picsum.photos/seed/s3/100/100' },
  { id: 'S1004', name: 'Diana Prince', grade: '12th', email: 'diana.p@school.edu', avatar: 'https://picsum.photos/seed/s4/100/100' },
  { id: 'S1005', name: 'Ethan Hunt', grade: '11th', email: 'ethan.h@school.edu', avatar: 'https://picsum.photos/seed/s5/100/100' },
  { id: 'S1006', name: 'Fiona Gallagher', grade: '10th', email: 'fiona.g@school.edu', avatar: 'https://picsum.photos/seed/s6/100/100' },
];

export const MOCK_HISTORY: CheckInRecord[] = [
  // Generating some realistic peak usage history
  { studentId: 'S1001', timestamp: '2023-10-27T08:15:00Z', eventType: 'check-in' },
  { studentId: 'S1001', timestamp: '2023-10-27T09:00:00Z', eventType: 'check-out' },
  { studentId: 'S1002', timestamp: '2023-10-27T10:30:00Z', eventType: 'check-in' },
  { studentId: 'S1002', timestamp: '2023-10-27T11:45:00Z', eventType: 'check-out' },
  { studentId: 'S1003', timestamp: '2023-10-27T12:00:00Z', eventType: 'check-in' },
  { studentId: 'S1004', timestamp: '2023-10-27T12:05:00Z', eventType: 'check-in' },
  { studentId: 'S1005', timestamp: '2023-10-27T12:10:00Z', eventType: 'check-in' },
  { studentId: 'S1003', timestamp: '2023-10-27T13:00:00Z', eventType: 'check-out' },
  { studentId: 'S1004', timestamp: '2023-10-27T13:05:00Z', eventType: 'check-out' },
  { studentId: 'S1005', timestamp: '2023-10-27T13:10:00Z', eventType: 'check-out' },
  { studentId: 'S1006', timestamp: '2023-10-27T15:30:00Z', eventType: 'check-in' },
  { studentId: 'S1006', timestamp: '2023-10-27T16:30:00Z', eventType: 'check-out' },
];
