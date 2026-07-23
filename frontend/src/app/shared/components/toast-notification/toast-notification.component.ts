import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      *ngIf="message"
      class="toast-container"
      [ngClass]="type"
    >
      <mat-icon class="toast-icon">
        {{ type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info' }}
      </mat-icon>
      
      <span class="toast-message">{{ message }}</span>

      <button class="close-btn" (click)="onDismiss.emit()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: 12px 18px;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 500;
        max-width: 450px;
        animation: slideUp 0.3s ease;
      }

      .toast-container.success {
        background-color: #065f46;
        border-left: 4px solid var(--success);
      }

      .toast-container.error {
        background-color: #991b1b;
        border-left: 4px solid var(--danger);
      }

      .toast-container.info {
        background-color: #1e1b4b;
        border-left: 4px solid var(--primary);
      }

      .toast-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .toast-message {
        flex: 1;
        line-height: 1.4;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
      }

      .close-btn:hover {
        color: #ffffff;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ToastNotificationComponent {
  @Input() message: string | null = null;
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Output() onDismiss = new EventEmitter<void>();
}
