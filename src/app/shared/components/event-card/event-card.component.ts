import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css'
})
export class EventCardComponent {
  @Input({ required: true }) title: string = '';
  @Input({ required: true }) startTime: string = '';
  @Input({ required: true }) durationMinutes: number = 0;
  @Input() intervalMinutes: number = 15; // To align with TimeLabelComponent
  @Input() rowHeight: number = 60; // Height per time slot

  // Computed properties for positioning and sizing
  eventHeight = computed(() => this.calculateEventHeight());

  private calculateEventHeight(): number {
    // Calculate height based on duration and time slots
    const slots = Math.ceil(this.durationMinutes / this.intervalMinutes);
    return slots * this.rowHeight;
  }

  /**
   * Format time for display (convert 24h to 12h format)
   */
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${(minutes || 0).toString().padStart(2, '0')} ${ampm}`;
  }

  /**
   * Get duration display text
   */
  getDurationText(): string {
    if (this.durationMinutes < 60) {
      return `${this.durationMinutes}min`;
    } else {
      const hours = Math.floor(this.durationMinutes / 60);
      const mins = this.durationMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  }
}
