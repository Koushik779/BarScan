import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BarcodeScannerComponent } from './app/barcode-scanner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BarcodeScannerComponent],
  template: `
    <div class="app-container">
      <app-barcode-scanner></app-barcode-scanner>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px 0;
    }

    @media (max-width: 640px) {
      .app-container {
        padding: 10px 0;
      }
    }
  `]
})
export class App {
  name = 'Angular Barcode Scanner';
}

bootstrapApplication(App);