import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legend-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legend-container">
      <span class="legend-title">Calendar Key:</span>
      
      <div class="legend-item">
        <span class="dot available"></span>
        <span class="label">Available</span>
      </div>

      <div class="legend-item">
        <span class="dot booked"></span>
        <span class="label">Booked</span>
      </div>

      <div class="legend-item">
        <span class="dot blocked"></span>
        <span class="label">Blocked</span>
      </div>

      <div class="legend-item">
        <span class="dot override"></span>
        <span class="label">Rate Override</span>
      </div>

      <div class="legend-item">
        <span class="box-sample selected"></span>
        <span class="label">Selected Range</span>
      </div>
    </div>
  `,
  styles: [
    `
      .legend-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-lg);
        padding: var(--space-xs) var(--space-lg);
        background: #ffffff;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.825rem;
      }

      .legend-title {
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.75rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-main);
        font-weight: 500;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .dot.available {
        background-color: var(--success);
      }

      .dot.booked {
        background-color: var(--danger);
      }

      .dot.blocked {
        background-color: var(--blocked);
      }

      .dot.override {
        background-color: var(--warning);
      }

      .box-sample {
        width: 14px;
        height: 14px;
        border-radius: 3px;
      }

      .box-sample.selected {
        background-color: var(--primary-light);
        border: 1.5px solid var(--primary);
      }
    `,
  ],
})
export class LegendBarComponent {}
