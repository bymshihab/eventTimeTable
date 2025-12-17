import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-venue-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venue-card.component.html',
  styleUrl: './venue-card.component.css'
})
export class VenueCardComponent {
  @Input({ required: true }) venueName: string = '';
}
