export interface Event {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
}

export interface Venue {
  id: string;
  name: string;
  events: Event[];
}

export interface Day {
  day: string;
  date: string;
  venues: Venue[];
}

export interface Week {
  week: Day[];
}

export interface SchedulerData {
  selectedDay?: string;
  events?: Event[];
}
