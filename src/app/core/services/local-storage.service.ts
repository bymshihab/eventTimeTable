import { Injectable } from '@angular/core';
import { Event, SchedulerData } from '../../shared/models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly SELECTED_DAY_KEY = 'scheduler_selected_day';
  private readonly EVENTS_KEY = 'scheduler_events';

  constructor() { }

  /**
   * Save the selected day to localStorage
   * @param day The selected day to save
   */
  saveSelectedDay(day: string): void {
    try {
      localStorage.setItem(this.SELECTED_DAY_KEY, day);
    } catch (error) {
      console.error('Error saving selected day to localStorage:', error);
    }
  }

  /**
   * Load the selected day from localStorage
   * @returns The saved selected day or null if not found
   */
  loadSelectedDay(): string | null {
    try {
      return localStorage.getItem(this.SELECTED_DAY_KEY);
    } catch (error) {
      console.error('Error loading selected day from localStorage:', error);
      return null;
    }
  }

  /**
   * Save events array to localStorage
   * @param events The events array to save
   */
  saveEvents(events: Event[]): void {
    try {
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }

  /**
   * Load events array from localStorage
   * @returns The saved events array or null if not found
   */
  loadEvents(): Event[] | null {
    try {
      const eventsJson = localStorage.getItem(this.EVENTS_KEY);
      return eventsJson ? JSON.parse(eventsJson) : null;
    } catch (error) {
      console.error('Error loading events from localStorage:', error);
      return null;
    }
  }

  /**
   * Save complete scheduler data (selected day and events)
   * @param data The scheduler data to save
   */
  saveSchedulerData(data: SchedulerData): void {
    if (data.selectedDay !== undefined) {
      this.saveSelectedDay(data.selectedDay);
    }
    if (data.events !== undefined) {
      this.saveEvents(data.events);
    }
  }

  /**
   * Load complete scheduler data (selected day and events)
   * @returns The saved scheduler data
   */
  loadSchedulerData(): SchedulerData {
    return {
      selectedDay: this.loadSelectedDay() || undefined,
      events: this.loadEvents() || undefined
    };
  }

  /**
   * Clear selected day from localStorage
   */
  clearSelectedDay(): void {
    try {
      localStorage.removeItem(this.SELECTED_DAY_KEY);
    } catch (error) {
      console.error('Error clearing selected day from localStorage:', error);
    }
  }

  /**
   * Clear events from localStorage
   */
  clearEvents(): void {
    try {
      localStorage.removeItem(this.EVENTS_KEY);
    } catch (error) {
      console.error('Error clearing events from localStorage:', error);
    }
  }

  /**
   * Clear all scheduler data from localStorage
   */
  clearAll(): void {
    this.clearSelectedDay();
    this.clearEvents();
  }
}
