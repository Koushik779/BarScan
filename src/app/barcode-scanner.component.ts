import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader, Result, NotFoundException, Exception } from '@zxing/library';

export interface ScanResult {
  text: string;
  format: string;
  timestamp: Date;
}

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scanner-container">
      <div class="scanner-header">
        <h2>Barcode Scanner</h2>
        <div class="scanner-controls">
          <button 
            (click)="toggleScanning()" 
            [class]="isScanning ? 'stop-btn' : 'start-btn'"
            [disabled]="!hasPermission">
            {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
          </button>
        </div>
      </div>

      <div class="camera-section">
        <div class="camera-container" [class.active]="isScanning">
          <video #video 
                 [style.display]="isScanning ? 'block' : 'none'"
                 autoplay 
                 muted 
                 playsinline>
          </video>
          
          <div class="camera-overlay" *ngIf="isScanning">
            <div class="scan-frame">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
            </div>
            <p class="scan-instruction">Point camera at barcode</p>
          </div>
          
          <div class="camera-placeholder" *ngIf="!isScanning">
            <div class="placeholder-icon">📷</div>
            <p>Camera will appear here</p>
          </div>
        </div>

        <div class="permission-error" *ngIf="permissionError">
          <p>{{ permissionError }}</p>
          <button (click)="requestPermission()">Try Again</button>
        </div>
      </div>

      <div class="results-section">
        <div class="current-result" *ngIf="currentResult">
          <h3>Latest Scan</h3>
          <div class="result-card success">
            <div class="result-header">
              <span class="format-badge">{{ currentResult.format }}</span>
              <button (click)="copyToClipboard(currentResult.text)" class="copy-btn">
                📋 Copy
              </button>
            </div>
            <div class="result-text">{{ currentResult.text }}</div>
            <div class="result-time">{{ formatTime(currentResult.timestamp) }}</div>
          </div>
        </div>

        <div class="scan-history" *ngIf="scanHistory.length > 0">
          <h3>Scan History</h3>
          <div class="history-list">
            <div *ngFor="let result of scanHistory; let i = index" 
                 class="result-card" 
                 [class.recent]="i === 0">
              <div class="result-header">
                <span class="format-badge">{{ result.format }}</span>
                <button (click)="copyToClipboard(result.text)" class="copy-btn">
                  📋
                </button>
              </div>
              <div class="result-text">{{ result.text }}</div>
              <div class="result-time">{{ formatTime(result.timestamp) }}</div>
            </div>
          </div>
          <button (click)="clearHistory()" class="clear-btn">Clear History</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scanner-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .scanner-header h2 {
      margin: 0;
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
    }

    .scanner-controls button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .start-btn {
      background: #2563eb;
      color: white;
    }

    .start-btn:hover {
      background: #1d4ed8;
    }

    .stop-btn {
      background: #ef4444;
      color: white;
    }

    .stop-btn:hover {
      background: #dc2626;
    }

    .scanner-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .camera-section {
      margin-bottom: 32px;
    }

    .camera-container {
      position: relative;
      width: 100%;
      height: 300px;
      border-radius: 12px;
      overflow: hidden;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      transition: all 0.3s;
    }

    .camera-container.active {
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .scan-frame {
      position: relative;
      width: 200px;
      height: 200px;
      border: 2px solid transparent;
    }

    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 3px solid #2563eb;
    }

    .corner.top-left {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    .corner.top-right {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }

    .corner.bottom-left {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
    }

    .corner.bottom-right {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }

    .scan-instruction {
      margin-top: 16px;
      color: white;
      background: rgba(0, 0, 0, 0.7);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .camera-placeholder {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #6b7280;
    }

    .placeholder-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .permission-error {
      text-align: center;
      padding: 24px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #b91c1c;
      margin-top: 16px;
    }

    .permission-error button {
      margin-top: 12px;
      padding: 8px 16px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .results-section h3 {
      margin-bottom: 16px;
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
    }

    .result-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: all 0.2s;
    }

    .result-card.success {
      border-color: #10b981;
      background: #f0fdf4;
    }

    .result-card.recent {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .format-badge {
      background: #2563eb;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .copy-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: #e5e7eb;
    }

    .result-text {
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .result-time {
      font-size: 12px;
      color: #6b7280;
    }

    .history-list {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .clear-btn {
      background: #f59e0b;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .clear-btn:hover {
      background: #d97706;
    }

    @media (max-width: 640px) {
      .scanner-container {
        padding: 16px;
      }

      .scanner-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .camera-container {
        height: 250px;
      }

      .scan-frame {
        width: 150px;
        height: 150px;
      }
    }
  `]
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: false }) video!: ElementRef<HTMLVideoElement>;
  
  private codeReader = new BrowserMultiFormatReader();
  private scanSubscription: any;
  
  isScanning = false;
  hasPermission = false;
  permissionError = '';
  currentResult: ScanResult | null = null;
  scanHistory: ScanResult[] = [];

  ngOnInit() {
    this.requestPermission();
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.hasPermission = true;
      this.permissionError = '';
      // Stop the stream immediately, we'll start it when scanning
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Permission denied:', error);
      this.hasPermission = false;
      this.permissionError = 'Camera permission denied. Please allow camera access to scan barcodes.';
    }
  }

  async toggleScanning() {
    if (this.isScanning) {
      this.stopScanning();
    } else {
      await this.startScanning();
    }
  }

  async startScanning() {
    if (!this.hasPermission) {
      await this.requestPermission();
      return;
    }

    try {
      this.isScanning = true;
      
      // Start camera stream
      await this.codeReader.decodeFromVideoDevice(
        null,
        this.video.nativeElement,
        (result: Result | null, error: Exception | undefined) => {
          if (result) {
            this.onScanSuccess(result);
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start scanning:', error);
      this.isScanning = false;
      this.permissionError = 'Failed to start camera. Please check permissions.';
    }
  }

  stopScanning() {
    this.isScanning = false;
    this.codeReader.reset();
  }

  onScanSuccess(result: Result) {
    const scanResult: ScanResult = {
      text: result.getText(),
      format: result.getBarcodeFormat().toString(),
      timestamp: new Date()
    };

    this.currentResult = scanResult;
    
    // Add to history if not duplicate
    if (!this.scanHistory.some(item => item.text === scanResult.text)) {
      this.scanHistory.unshift(scanResult);
      // Keep only last 10 scans
      if (this.scanHistory.length > 10) {
        this.scanHistory.pop();
      }
    }

    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  clearHistory() {
    this.scanHistory = [];
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}