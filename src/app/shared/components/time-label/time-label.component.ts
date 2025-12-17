import { Component, Input, OnInit, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimeSlot {
  time: string;
  displayTime: string;
  isHourMark: boolean;
  minuteOffset: number;
}

@Component({
  selector: 'app-time-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-label.component.html',
  styleUrl: './time-label.component.css'
})
export class TimeLabelComponent implements OnInit, OnChanges {
  @Input() startTime: string = '1:00';
  @Input() endTime: string = '24:00';
  @Input() intervalMinutes: number = 15;
  @Input() sticky: boolean = true;

  private startTimeSignal = signal<string>('1:00');
  private endTimeSignal = signal<string>('24:00');
  private intervalSignal = signal<number>(15);

  timeSlots = computed(() => this.generateTimeSlots());

  ngOnInit() {
    this.updateSignals();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateSignals();
  }

  private updateSignals() {
    this.startTimeSignal.set(this.startTime);
    this.endTimeSignal.set(this.endTime);
    this.intervalSignal.set(this.intervalMinutes);
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startTime = this.parseTime(this.startTimeSignal());
    const endTime = this.parseTime(this.endTimeSignal());
    const interval = this.intervalSignal();

    let currentTime = { ...startTime };

    while (this.isTimeBefore(currentTime, endTime) || this.isTimeEqual(currentTime, endTime)) {
      const timeString = this.formatTime(currentTime);
      const isHourMark = currentTime.minutes === 0;
      const minuteOffset = currentTime.minutes;

      slots.push({
        time: timeString,
        displayTime: this.formatDisplayTime(currentTime, isHourMark),
        isHourMark,
        minuteOffset
      });

      // Add interval minutes
      currentTime.minutes += interval;
      if (currentTime.minutes >= 60) {
        currentTime.hours += Math.floor(currentTime.minutes / 60);
        currentTime.minutes = currentTime.minutes % 60;
      }

      // Prevent infinite loop
      if (currentTime.hours >= 24) break;
    }

    return slots;
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
    return { hours: hours || 0, minutes: minutes || 0 };
  }

  private formatTime(time: { hours: number; minutes: number }): string {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
  }

  private formatDisplayTime(time: { hours: number; minutes: number }, isHourMark: boolean): string {
    const hours24 = time.hours;
    const minutes = time.minutes;

    // Simple 24-hour format display
    return `${hours24.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}`;
  }

  private isTimeBefore(time1: { hours: number; minutes: number }, time2: { hours: number; minutes: number }): boolean {
    if (time1.hours !== time2.hours) {
      return time1.hours < time2.hours;
    }
    return time1.minutes < time2.minutes;
  }

  private isTimeEqual(time1: { hours: number; minutes: number }, time2: { hours: number; minutes: number }): boolean {
    return time1.hours === time2.hours && time1.minutes === time2.minutes;
  }

  /**
   * Get the height for a time slot
   */
  getSlotHeight(): number {
    return 60; // Fixed height for simple flat boxes
  }

  /**
   * Get the total container height
   */
  getTotalHeight(): number {
    return this.timeSlots().length * this.getSlotHeight();
  }

  /**
   * Calculate the pixel position for a given time
   */
  getTimePosition(time: string): number {
    const targetTime = this.parseTime(time);
    const startTime = this.parseTime(this.startTimeSignal());
    const interval = this.intervalSignal();

    const diffMinutes = (targetTime.hours - startTime.hours) * 60 + (targetTime.minutes - startTime.minutes);
    const slotIndex = Math.floor(diffMinutes / interval);

    return slotIndex * this.getSlotHeight();
  }
}
