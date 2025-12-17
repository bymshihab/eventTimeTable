import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabBarComponent } from '../../../shared/components/tab-bar/tab-bar.component';
import { TimeLabelComponent } from '../../../shared/components/time-label/time-label.component';
import { EventService } from '../../../core/services/event.service';
import { VenueService } from '../../../core/services/venue.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { Day, Venue, Event } from '../../../shared/models/interfaces';

export interface SchedulerEvent extends Event {
  venue: string;
  venueId: string;
  topPosition: number;
  height: number;
  startMinutes: number;
  endMinutes: number;
}

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, TabBarComponent, TimeLabelComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.css'
})
export class SchedulerComponent implements OnInit {
  private eventService = inject(EventService);
  private venueService = inject(VenueService);
  private localStorageService = inject(LocalStorageService);

  // Configuration
  readonly startTime = '08:00';
  readonly endTime = '24:00';
  readonly intervalMinutes = 15;
  readonly rowHeight = 60;

  // State
  selectedDay = signal<Day | null>(null);
  venues = signal<Venue[]>([]);
  schedulerEvents = signal<SchedulerEvent[]>([]);
  isLoading = signal<boolean>(true);

  // Computed values
  totalMinutes = computed(() => this.calculateTotalMinutes());
  totalHeight = computed(() => this.calculateTotalHeight());

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // Load saved selected day
    const savedDay = this.localStorageService.loadSelectedDay();

    // Load all venues first
    this.venueService.getAllVenues().subscribe({
      next: (venues) => {
        this.venues.set(venues);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading venues:', error);
        this.isLoading.set(false);
      }
    });
  }

  onDaySelected(day: Day) {
    this.selectedDay.set(day);
    this.loadDaySchedule(day);
  }

  private loadDaySchedule(day: Day) {
    const events: SchedulerEvent[] = [];

    day.venues.forEach(venue => {
      venue.events.forEach(event => {
        const schedulerEvent = this.createSchedulerEvent(event, venue);
        if (schedulerEvent) {
          events.push(schedulerEvent);
        }
      });
    });

    this.schedulerEvents.set(events);
  }

  private createSchedulerEvent(event: Event, venue: Venue): SchedulerEvent | null {
    const startMinutes = this.timeToMinutes(event.startTime);
    const baseStartMinutes = this.timeToMinutes(this.startTime);

    // Skip events outside our time range
    if (startMinutes < baseStartMinutes) return null;

    const endMinutes = startMinutes + event.durationMinutes;
    const topPosition = this.calculateEventPosition(startMinutes);
    const height = this.calculateEventHeight(event.durationMinutes);

    return {
      ...event,
      venue: venue.name,
      venueId: venue.id,
      topPosition,
      height,
      startMinutes,
      endMinutes
    };
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
    return (hours * 60) + (minutes || 0);
  }

  private calculateEventPosition(startMinutes: number): number {
    const baseStartMinutes = this.timeToMinutes(this.startTime);
    const relativeMinutes = startMinutes - baseStartMinutes;
    return (relativeMinutes / this.intervalMinutes) * this.rowHeight;
  }

  private calculateEventHeight(durationMinutes: number): number {
    return (durationMinutes / this.intervalMinutes) * this.rowHeight;
  }

  private calculateTotalMinutes(): number {
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    return endMinutes - startMinutes;
  }

  private calculateTotalHeight(): number {
    return (this.totalMinutes() / this.intervalMinutes) * this.rowHeight;
  }

  getEventsForVenue(venueId: string): SchedulerEvent[] {
    return this.schedulerEvents().filter(event => event.venueId === venueId);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${(minutes || 0).toString().padStart(2, '0')} ${ampm}`;
  }

  getEventColor(eventId: string): string {
    // Simple color assignment based on event ID hash
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ];
    const hash = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  getGridLineCount(): number[] {
    const count = Math.ceil(this.totalMinutes() / this.intervalMinutes);
    return Array.from({length: count}, (_, i) => i);
  }

  isHourLine(index: number): boolean {
    return index % (60 / this.intervalMinutes) === 0;
  }
}
