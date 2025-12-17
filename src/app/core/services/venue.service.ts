import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Venue, Week } from '../../shared/models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  private readonly dataUrl = 'assets/sample-data.json';

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
   * Fetch all unique venues from the data
   * @returns Observable of Venue array (without duplicate venues)
   */
  getAllVenues(): Observable<Venue[]> {
    return this.getWeekData().pipe(
      map(data => {
        const venueMap = new Map<string, Venue>();

        // Collect all venues and merge their events
        data.week.forEach(day => {
          day.venues.forEach(venue => {
            if (venueMap.has(venue.id)) {
              // Merge events from different days
              const existingVenue = venueMap.get(venue.id)!;
              existingVenue.events = [...existingVenue.events, ...venue.events];
            } else {
              // Add new venue with its events
              venueMap.set(venue.id, {
                id: venue.id,
                name: venue.name,
                events: [...venue.events]
              });
            }
          });
        });

        return Array.from(venueMap.values());
      })
    );
  }

  /**
   * Fetch venues for a specific day
   * @param dayName The name of the day (e.g., "Monday", "Tuesday")
   * @returns Observable of Venue array
   */
  getVenuesByDay(dayName: string): Observable<Venue[]> {
    return this.getWeekData().pipe(
      map(data => {
        const targetDay = data.week.find(day =>
          day.day.toLowerCase() === dayName.toLowerCase()
        );

        return targetDay ? targetDay.venues : [];
      })
    );
  }

  /**
   * Fetch a specific venue by ID with all its events across all days
   * @param venueId The ID of the venue
   * @returns Observable of Venue or null if not found
   */
  getVenueById(venueId: string): Observable<Venue | null> {
    return this.getAllVenues().pipe(
      map(venues => venues.find(venue => venue.id === venueId) || null)
    );
  }

  /**
   * Fetch a specific venue by ID for a specific day
   * @param venueId The ID of the venue
   * @param dayName The name of the day
   * @returns Observable of Venue or null if not found
   */
  getVenueByIdAndDay(venueId: string, dayName: string): Observable<Venue | null> {
    return this.getVenuesByDay(dayName).pipe(
      map(venues => venues.find(venue => venue.id === venueId) || null)
    );
  }

  /**
   * Get list of venue names only
   * @returns Observable of string array containing venue names
   */
  getVenueNames(): Observable<string[]> {
    return this.getAllVenues().pipe(
      map(venues => venues.map(venue => venue.name))
    );
  }

  /**
   * Get list of venue IDs only
   * @returns Observable of string array containing venue IDs
   */
  getVenueIds(): Observable<string[]> {
    return this.getAllVenues().pipe(
      map(venues => venues.map(venue => venue.id))
    );
  }

  /**
   * Check if a venue has events on a specific day
   * @param venueId The ID of the venue
   * @param dayName The name of the day
   * @returns Observable of boolean
   */
  venueHasEventsOnDay(venueId: string, dayName: string): Observable<boolean> {
    return this.getVenueByIdAndDay(venueId, dayName).pipe(
      map(venue => venue ? venue.events.length > 0 : false)
    );
  }

  /**
   * Get venues that have events (non-empty events array)
   * @returns Observable of Venue array
   */
  getVenuesWithEvents(): Observable<Venue[]> {
    return this.getAllVenues().pipe(
      map(venues => venues.filter(venue => venue.events.length > 0))
    );
  }

  /**
   * Get venues that have no events (empty events array)
   * @returns Observable of Venue array
   */
  getVenuesWithoutEvents(): Observable<Venue[]> {
    return this.getAllVenues().pipe(
      map(venues => venues.filter(venue => venue.events.length === 0))
    );
  }
}
