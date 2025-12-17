import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabBarComponent } from '../../../shared/components/tab-bar/tab-bar.component';
import { TimeLabelComponent } from '../../../shared/components/time-label/time-label.component';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { VenueCardComponent } from '../../../shared/components/venue-card/venue-card.component';
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
  imports: [CommonModule, TabBarComponent, TimeLabelComponent, EventCardComponent, VenueCardComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.css'
})
export class SchedulerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timeContainer', { static: false }) timeContainer!: ElementRef;
  @ViewChild('eventGrid', { static: false }) eventGrid!: ElementRef;
  @ViewChild('venuesContainer', { static: false }) venuesContainer!: ElementRef;
  private eventService = inject(EventService);
  private venueService = inject(VenueService);
  private localStorageService = inject(LocalStorageService);
  private alignmentCheckInterval?: any;

  // Configuration
  readonly startTime = '1:00';
  readonly endTime = '24:00';
  readonly intervalMinutes = 15;
  readonly rowHeight = 60;

  // State
  selectedDay = signal<Day | null>(null);
  venues = signal<Venue[]>([]);
  schedulerEvents = signal<SchedulerEvent[]>([]);
  isLoading = signal<boolean>(true);
  isScrolling = signal<boolean>(false);
  showScrollIndicators = signal<boolean>(false);

  // Computed values
  totalMinutes = computed(() => this.calculateTotalMinutes());
  totalHeight = computed(() => this.calculateTotalHeight());

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    // Delay to ensure all child components are fully rendered
    setTimeout(() => {
      this.setupScrollSync();
    }, 50);
  }

  ngOnDestroy() {
    if (this.alignmentCheckInterval) {
      clearInterval(this.alignmentCheckInterval);
    }
  }

  /**
   * Synchronize vertical scrolling between time labels and event grid
   */
  private setupScrollSync() {
    if (this.timeContainer && this.eventGrid && this.venuesContainer) {
      const timeElement = this.timeContainer.nativeElement;
      const gridElement = this.eventGrid.nativeElement;
      const venuesElement = this.venuesContainer.nativeElement;

      // Clear any existing alignment check interval
      if (this.alignmentCheckInterval) {
        clearInterval(this.alignmentCheckInterval);
      }

      // Remove smooth scrolling to prevent sync issues
      timeElement.style.scrollBehavior = 'auto';
      gridElement.style.scrollBehavior = 'auto';
      venuesElement.style.scrollBehavior = 'auto';

      // Ensure the time container doesn't have its own scroll
      timeElement.style.overflow = 'visible';
      timeElement.style.height = 'auto';

      // Flags to prevent infinite loop during sync
      let isSyncingVertical = false;
      let isSyncingHorizontal = false;
      let scrollTimeout: any;

      // Show scroll indicators during scroll
      const showScrollIndicators = () => {
        this.isScrolling.set(true);
        this.showScrollIndicators.set(true);

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.isScrolling.set(false);
          this.showScrollIndicators.set(false);
        }, 1500);
      };

      // Improved sync function for vertical scrolling
      // Use transform to sync time labels with grid scroll
      const syncTimeLabels = (scrollTop: number) => {
        if (!isSyncingVertical) {
          isSyncingVertical = true;

          // Find the time-label container inside timeElement and transform it
          const timeLabelContainer = timeElement.querySelector('.time-label-container') as HTMLElement;
          if (timeLabelContainer) {
            timeLabelContainer.style.transform = `translateY(-${scrollTop}px)`;
          }

          showScrollIndicators();

          setTimeout(() => {
            isSyncingVertical = false;
          }, 0);
        }
      };

      // Improved sync function for horizontal scrolling
      const syncHorizontal = (sourceElement: HTMLElement, targetElement: HTMLElement) => {
        if (!isSyncingHorizontal) {
          isSyncingHorizontal = true;

          // Direct assignment for instant sync
          targetElement.scrollLeft = sourceElement.scrollLeft;

          showScrollIndicators();

          // Reset flag after the sync is complete
          setTimeout(() => {
            isSyncingHorizontal = false;
          }, 0);
        }
      };

      // Event listeners for scroll synchronization
      // Handle both vertical and horizontal sync from the main grid element
      gridElement.addEventListener('scroll', () => {
        // Sync vertical scroll with time column using transform
        syncTimeLabels(gridElement.scrollTop);
        // Sync horizontal scroll with venues header
        syncHorizontal(gridElement, venuesElement);
      }, { passive: true });

      // Handle horizontal sync from venues header to grid
      venuesElement.addEventListener('scroll', () => {
        syncHorizontal(venuesElement, gridElement);
      }, { passive: true });

      // Initialize scroll positions
      setTimeout(() => {
        // Initialize time labels position
        const timeLabelContainer = timeElement.querySelector('.time-label-container') as HTMLElement;
        if (timeLabelContainer) {
          timeLabelContainer.style.transform = `translateY(-${gridElement.scrollTop}px)`;
        }

        // Initialize venues header position
        if (gridElement.scrollLeft !== venuesElement.scrollLeft) {
          venuesElement.scrollLeft = gridElement.scrollLeft;
        }
      }, 100);

      // Backup alignment check
      this.alignmentCheckInterval = setInterval(() => {
        if (!this.isScrolling()) {
          // Check and correct vertical alignment using transform
          if (!isSyncingVertical) {
            const timeLabelContainer = timeElement.querySelector('.time-label-container') as HTMLElement;
            if (timeLabelContainer) {
              const currentTransform = timeLabelContainer.style.transform;
              const expectedTransform = `translateY(-${gridElement.scrollTop}px)`;
              if (currentTransform !== expectedTransform) {
                timeLabelContainer.style.transform = expectedTransform;
              }
            }
          }

          // Check and correct horizontal alignment
          if (!isSyncingHorizontal && Math.abs(venuesElement.scrollLeft - gridElement.scrollLeft) > 2) {
            venuesElement.scrollLeft = gridElement.scrollLeft;
          }
        }
      }, 200);
    }
  }

  private loadInitialData() {
    // Load saved selected day
    const savedDay = this.localStorageService.loadSelectedDay();

    // Load all days first
    this.eventService.getAllDays().subscribe({
      next: (days) => {
        if (days.length > 0) {
          // Set default day or saved day
          let dayToSelect = days[0];
          if (savedDay) {
            const foundDay = days.find(d => d.day.toLowerCase() === savedDay.toLowerCase());
            if (foundDay) dayToSelect = foundDay;
          }
          this.onDaySelected(dayToSelect);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading days:', error);
        this.isLoading.set(false);
      }
    });
  }

  onDaySelected(day: Day) {
    this.selectedDay.set(day);
    this.loadDaySchedule(day);
    // Persist selected day to localStorage
    this.localStorageService.saveSelectedDay(day.day);

    // Re-establish scroll sync after day change
    setTimeout(() => {
      this.setupScrollSync();
    }, 100);
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
    // Ensure perfect alignment with time slots - snap to nearest interval
    const slotIndex = Math.round(relativeMinutes / this.intervalMinutes);
    return slotIndex * this.rowHeight;
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
