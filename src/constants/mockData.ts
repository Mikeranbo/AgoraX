import { Event, Venue } from '../types';

export const MOCK_VENUES: Venue[] = [
  {
    id: 'v1',
    name: 'The Old Stone Church',
    description: 'A beautiful historic space with great acoustics, perfect for concerts and community gatherings.',
    location: 'Central District',
    hourlyRate: 45,
    capacity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1548625313-039e452d10a8?w=800&q=80',
  },
  {
    id: 'v2',
    name: 'Modern Hub Workshop',
    description: 'Minimalist industrial space with high-speed internet and flexible seating.',
    location: 'Downtown Tech Park',
    hourlyRate: 30,
    capacity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  },
  {
    id: 'v3',
    name: 'Garden Terrace',
    description: 'Outdoor open-air space with vibrant greenery. Ideal for yoga and social mixers.',
    location: 'Westside Heights',
    hourlyRate: 25,
    capacity: 60,
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Community Charity Concert',
    description: 'An evening of local artists performing for a cause. All proceeds go to the community fund.',
    category: 'Concert',
    price: 15,
    minParticipants: 40,
    currentParticipants: 28,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'Pending',
    organizerId: 'user1',
    venueId: 'v1',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
  },
  {
    id: 'e2',
    title: 'Outdoor Zen Yoga',
    description: 'Reconnect with nature in this morning yoga session guided by Sarah Zen.',
    category: 'Fitness',
    price: 10,
    minParticipants: 15,
    currentParticipants: 14,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'Pending',
    organizerId: 'user1',
    venueId: 'v3',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  },
  {
    id: 'e3',
    title: 'Startup Networking Night',
    description: 'Meet local founders and techies for a night of curated networking and drinks.',
    category: 'Startup',
    price: 0,
    minParticipants: 30,
    currentParticipants: 45,
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // Ended 12 hours ago
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
    status: 'Confirmed',
    organizerId: 'user2',
    venueId: 'v2',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  },
];
