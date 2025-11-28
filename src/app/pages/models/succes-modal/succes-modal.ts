import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-succes-modal',
  imports: [CommonModule],
  templateUrl: './succes-modal.html',
  styleUrl: './succes-modal.css',
})
export class SuccesModal implements AfterViewInit, OnDestroy {
  @Input() title: string = 'Succès';
  @Input() message: string = 'Opération réussie !';
  @Input() btnText: string = 'OK';
  
  @Output() close = new EventEmitter<void>();

  constructor(private renderer: Renderer2) {}

  public dismiss() {
    this.close.emit();
  }

  ngAfterViewInit() {
    this.renderer.addClass(document.body, 'modal-open');
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }
}