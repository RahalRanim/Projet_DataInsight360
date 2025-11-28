import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css',
})
export class ConfirmModal implements AfterViewInit, OnDestroy {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Êtes-vous sûr de vouloir continuer ?';
  @Input() btnOkText: string = 'Confirmer';
  @Input() btnCancelText: string = 'Annuler';
  
  @Output() close = new EventEmitter<boolean>();

  constructor(private renderer: Renderer2) {}

  public decline() {
    this.close.emit(false);
  }

  public accept() {
    this.close.emit(true);
  }

  ngAfterViewInit() {
    this.renderer.addClass(document.body, 'modal-open');
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }
}