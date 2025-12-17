import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Event, Day, Week } from '../../shared/models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly dataUrl = 'asset/data/sample-data.json';

  constructor(private http: HttpClient) { }

  /**
   * Fetch all week data from the JSON file
   * @returns Observable of Week data
   */
  private getWeekData(): Observable<Week> {
    return this.http.get<Week>(this.dataUrl).pipe(
      catchError(error => {
        console.error('Error fetching week data:', error);
        return of({ week: [] });
      })
    );
  }

  /**
   * Fetch all events from all days and venues
   * @returns Observable of Event array
   */
  getAllEvents(): Observable<Event[]> {
    return this.getWeekData().pipe(
      map(data => {
        const allEvents: Event[] = [];
        data.week.forEach(day => {
          day.venues.forEach(venue => {
            allEvents.push(...venue.events);
          });
        });
        return allEvents;
      })
    );
  }

  /**
   * Fetch events for a specific day
   * @param dayName The name of the day (e.g., "Monday", "Tuesday")
   * @returns Observable of Event array
   */
  getEventsByDay(dayName: string): Observable<Event[]> {
    return this.getWeekData().pipe(
      map(data => {
        const targetDay = data.week.find(day =>
          day.day.toLowerCase() === dayName.toLowerCase()
        );

        if (!targetDay) {
          return [];
        }

        const dayEvents: Event[] = [];
        targetDay.venues.forEach(venue => {
          dayEvents.push(...venue.events);
        });
        return dayEvents;
      })
    );
  }

  /**
   * Fetch events for a specific venue across all days
   * @param venueId The ID of the venue
   * @returns Observable of Event array with day information
   */
  getEventsByVenue(venueId: string): Observable<Array<Event & { day: string; date: string }>> {
    return this.getWeekData().pipe(
      map(data => {
        const venueEvents: Array<Event & { day: string; date: string }> = [];

        data.week.forEach(day => {
          const targetVenue = day.venues.find(venue => venue.id === venueId);
          if (targetVenue) {
            targetVenue.events.forEach(event => {
              venueEvents.push({
                ...event,
                day: day.day,
                date: day.date
              });
            });
          }
        });

        return venueEvents;
      })
    );
  }

  /**
   * Fetch a specific event by ID
   * @param eventId The ID of the event
   * @returns Observable of Event or null if not found
   */
  getEventById(eventId: string): Observable<Event | null> {
    return this.getAllEvents().pipe(
      map(events => events.find(event => event.id === eventId) || null)
    );
  }

  /**
   * Fetch events for a specific day and venue
   * @param dayName The name of the day
   * @param venueId The ID of the venue
   * @returns Observable of Event array
   */
  getEventsByDayAndVenue(dayName: string, venueId: string): Observable<Event[]> {
    return this.getWeekData().pipe(
      map(data => {
        const targetDay = data.week.find(day =>
          day.day.toLowerCase() === dayName.toLowerCase()
        );

        if (!targetDay) {
          return [];
        }

        const targetVenue = targetDay.venues.find(venue => venue.id === venueId);
        return targetVenue ? targetVenue.events : [];
      })
    );
  }

  /**
   * Get all days data
   * @returns Observable of Day array
   */
  getAllDays(): Observable<Day[]> {
    return this.getWeekData().pipe(
      map(data => data.week)
    );
  }
}
