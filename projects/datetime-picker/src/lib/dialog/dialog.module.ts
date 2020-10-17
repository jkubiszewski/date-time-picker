import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { DIALOG_SCROLL_STRATEGY_PROVIDER, DialogService } from './dialog.service';
import { DialogContainerComponent } from './dialog-container.component';

@NgModule({
  imports: [CommonModule, A11yModule, OverlayModule, PortalModule],
  exports: [],
  declarations: [DialogContainerComponent],
  providers: [DIALOG_SCROLL_STRATEGY_PROVIDER, DialogService]
})
export class DialogModule {}
