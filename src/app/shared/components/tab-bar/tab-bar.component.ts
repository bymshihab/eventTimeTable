import { Component, OnInit, Output, EventEmitter, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { EventService } from '../../../core/services/event.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { Day } from '../../models/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule, MatTabsModule],
  templateUrl: './tab-bar.component.html',
  styleUrl: './tab-bar.component.css'
})
export class TabBarComponent implements OnInit {
  @Output() daySelected = new EventEmitter<Day>();

  private eventService = inject(EventService);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);

  days = signal<Day[]>([]);
  selectedIndex = signal<number>(0);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadDays();
    this.loadSelectedDay();
  }

  private loadDays() {
    this.eventService.getAllDays()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (days) => {
          this.days.set(days);
          this.isLoading.set(false);

          // Set initial selected day if none saved
          const savedDay = this.localStorageService.loadSelectedDay();
          if (!savedDay && days.length > 0) {
            this.selectDay(0);
          }
        },
        error: (error) => {
          console.error('Error loading days:', error);
          this.isLoading.set(false);
        }
      });
  }

  private loadSelectedDay() {
    const savedDay = this.localStorageService.loadSelectedDay();
    if (savedDay) {
      const dayIndex = this.days().findIndex(day =>
        day.day.toLowerCase() === savedDay.toLowerCase()
      );
      if (dayIndex >= 0) {
        this.selectedIndex.set(dayIndex);
        this.daySelected.emit(this.days()[dayIndex]);
      }
    }
  }

  onTabChange(index: number) {
    this.selectDay(index);
  }

  selectDay(index: number) {
    if (index >= 0 && index < this.days().length) {
      const selectedDay = this.days()[index];
      this.selectedIndex.set(index);

      // Save to localStorage
      this.localStorageService.saveSelectedDay(selectedDay.day);

      // Emit the selected day
      this.daySelected.emit(selectedDay);
    }
  }


  /**
   * Get day abbreviation (first 3 characters)
   */
  getDayAbbreviation(day: string): string {
    return day.substring(0, 3);
  }
}
