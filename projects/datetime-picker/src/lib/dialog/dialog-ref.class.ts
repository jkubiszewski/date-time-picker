import { AnimationEvent } from '@angular/animations';
import { Location } from '@angular/common';
import { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { ESCAPE } from '@angular/cdk/keycodes';
import { DialogContainerComponent } from './dialog-container.component';
import { DialogPosition } from './dialog-config.class';
import { Observable, Subject, Subscription, SubscriptionLike as ISubscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export class DialogRef<T> {
  private result: any;

  private beforeClose$ = new Subject<any>();

  private afterOpen$ = new Subject<any>();

  private afterClosed$ = new Subject<any>();

  /** Subscription to changes in the user's location. */
  private locationChanged: ISubscription = Subscription.EMPTY;

  /**
   * The instance of component opened into modal
   */
  public componentInstance: T;

  /** Whether the user is allowed to close the dialog. */
  public disableClose = this.container.config.disableClose;

  constructor(
    private overlayRef: OverlayRef,
    private container: DialogContainerComponent,
    public readonly id: string,
    location?: Location
  ) {
    this.container.animationStateChanged
      .pipe(
        filter((event: AnimationEvent) => event.phaseName === 'done' && event.toState === 'enter'),
        take(1)
      )
      .subscribe(() => {
        this.afterOpen$.next();
        this.afterOpen$.complete();
      });

    this.container.animationStateChanged
      .pipe(
        filter((event: AnimationEvent) => event.phaseName === 'done' && event.toState === 'exit'),
        take(1)
      )
      .subscribe(() => {
        this.overlayRef.dispose();
        this.locationChanged.unsubscribe();
        this.afterClosed$.next(this.result);
        this.afterClosed$.complete();
        this.componentInstance = undefined;
      });

    this.overlayRef
      .keydownEvents()
      .pipe(filter(event => event.keyCode === ESCAPE && !this.disableClose))
      .subscribe(() => this.close());

    if (location) {
      this.locationChanged = location.subscribe(() => {
        if (this.container.config.closeOnNavigation) {
          this.close();
        }
      });
    }
  }

  public close(dialogResult?: any) {
    this.result = dialogResult;

    this.container.animationStateChanged
      .pipe(
        filter((event: AnimationEvent) => event.phaseName === 'start'),
        take(1)
      )
      .subscribe(() => {
        this.beforeClose$.next(dialogResult);
        this.beforeClose$.complete();
        this.overlayRef.detachBackdrop();
      });

    this.container.startExitAnimation();
  }

  /**
   * Gets an observable that emits when the overlay's backdrop has been clicked.
   */
  public backdropClick(): Observable<any> {
    return this.overlayRef.backdropClick();
  }

  /**
   * Gets an observable that emits when keydown events are targeted on the overlay.
   */
  public keydownEvents(): Observable<KeyboardEvent> {
    return this.overlayRef.keydownEvents();
  }

  /**
   * Updates the dialog's position.
   * @param position New dialog position.
   */
  public updatePosition(position?: DialogPosition): this {
    const strategy = this.getPositionStrategy();

    if (position && (position.left || position.right)) {
      position.left ? strategy.left(position.left) : strategy.right(position.right);
    } else {
      strategy.centerHorizontally();
    }

    if (position && (position.top || position.bottom)) {
      position.top ? strategy.top(position.top) : strategy.bottom(position.bottom);
    } else {
      strategy.centerVertically();
    }

    this.overlayRef.updatePosition();

    return this;
  }

  /**
   * Updates the dialog's width and height.
   * @param width New width of the dialog.
   * @param height New height of the dialog.
   */
  updateSize(width: string = 'auto', height: string = 'auto'): this {
    this.getPositionStrategy()
      .width(width)
      .height(height);
    this.overlayRef.updatePosition();
    return this;
  }

  public isAnimating(): boolean {
    return this.container.isAnimating;
  }

  public afterOpen(): Observable<any> {
    return this.afterOpen$.asObservable();
  }

  public beforeClose(): Observable<any> {
    return this.beforeClose$.asObservable();
  }

  public afterClosed(): Observable<any> {
    return this.afterClosed$.asObservable();
  }

  /** Fetches the position strategy object from the overlay ref. */
  private getPositionStrategy(): GlobalPositionStrategy {
    return this.overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
  }
}
