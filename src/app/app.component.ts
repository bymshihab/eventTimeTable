import { Component } from '@angular/core';
import { SchedulerComponent } from './features/scheduler/scheduler/scheduler.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SchedulerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Event Time Table Scheduler';
}
