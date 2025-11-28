import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-modal',
  imports: [CommonModule],
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.css',
})
export class ErrorModal implements AfterViewInit, OnDestroy {
  @Input() title: string = 'Erreur';
  @Input() message: string = 'Une erreur est survenue.';
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