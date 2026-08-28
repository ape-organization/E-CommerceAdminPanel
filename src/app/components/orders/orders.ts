import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { OrderService } from '../../services/order.service';
import { Order, OrderItem } from '../../models/order.model';
import { environment } from '../../../environments/environment';


// ============================================================
// MODELS
// ============================================================



// ============================================================
// COMPONENT
// ============================================================

@Component({

  selector: 'app-orders',

  standalone: true,

  imports: [

    CommonModule,

    MatIconModule,

    MatButtonModule,

    MatProgressSpinnerModule,

    MatSelectModule,

    MatPaginatorModule

  ],

  templateUrl: './orders.html',

  styleUrl: './orders.scss'

})
export class Orders implements OnInit {


  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly orderService =
    inject(OrderService);


  // ==========================================================
  // SIGNAL STATE
  // ==========================================================

  readonly orders =
    signal<Order[]>([]);


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal<string | null>(null);


  readonly expandedOrderId =
    signal<number | null>(null);


  // ==========================================================
  // PAGINATION STATE
  // ==========================================================

  readonly pageIndex =
    signal(0);


  readonly pageSize =
    signal(10);


  readonly pageSizeOptions =
    [5, 10, 25, 50];


  // ==========================================================
  // PAGINATED ORDERS
  // ==========================================================

  readonly paginatedOrders =
    computed(() => {

      const allOrders =
        this.orders();

      const start =
        this.pageIndex() *
        this.pageSize();

      const end =
        start +
        this.pageSize();

      return allOrders.slice(
        start,
        end
      );

    });


  // ==========================================================
  // TOTAL ORDERS
  // ==========================================================

  readonly totalOrders =
    computed(() =>
      this.orders().length
    );


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadOrders();

  }


  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  loadOrders(): void {

    this.loading.set(true);

    this.errorMessage.set(null);


    this.orderService
      .getOrders()
      .subscribe({

        next: (orders) => {

          const result =
            Array.isArray(orders)
              ? orders
              : [];


          this.orders.set(
            result
          );


          /*
           * Reset pagination whenever
           * orders are loaded again.
           */

          this.pageIndex.set(0);


          /*
           * Close any expanded order
           * after refreshing.
           */

          this.expandedOrderId.set(
            null
          );


          this.loading.set(false);

        },


        error: (error) => {

          console.error(
            'Load orders error:',
            error
          );


          this.orders.set([]);

          this.loading.set(false);


          this.errorMessage.set(

            error?.error?.message ||

            error?.message ||

            'Failed to load orders.'

          );

        }

      });

  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  onPageChange(
    event: PageEvent
  ): void {

    this.pageIndex.set(
      event.pageIndex
    );


    this.pageSize.set(
      event.pageSize
    );


    /*
     * Close expanded order when
     * changing page.
     */

    this.expandedOrderId.set(
      null
    );

  }


  // ==========================================================
  // TOGGLE ORDER
  // ==========================================================

  toggleOrder(
    orderId: number
  ): void {

    this.expandedOrderId.update(
      currentId =>
        currentId === orderId
          ? null
          : orderId
    );

  }


  // ==========================================================
  // CHECK EXPANDED
  // ==========================================================

  isExpanded(
    orderId: number
  ): boolean {

    return (
      this.expandedOrderId() ===
      orderId
    );

  }


  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  updateStatus(
    order: Order,
    status: string
  ): void {

    if (
      !status ||
      status === order.status
    ) {

      return;

    }


    const previousStatus =
      order.status;


    /*
     * Optimistic update.
     */

    this.orders.update(
      orders =>
        orders.map(
          currentOrder =>
            currentOrder.id === order.id
              ? {
                  ...currentOrder,
                  status
                }
              : currentOrder
        )
    );


    this.orderService
      .updateStatus(
        order.id,
        status
      )
      .subscribe({

        error: (error) => {

          console.error(
            'Update order status error:',
            error
          );


          /*
           * Rollback.
           */

          this.orders.update(
            orders =>
              orders.map(
                currentOrder =>
                  currentOrder.id === order.id
                    ? {
                        ...currentOrder,
                        status: previousStatus
                      }
                    : currentOrder
              )
          );


          this.errorMessage.set(

            error?.error?.message ||

            'Failed to update order status.'

          );

        }

      });

  }


  // ==========================================================
  // CANCEL ORDER
  // ==========================================================

  cancelOrder(
    order: Order
  ): void {

    if (
      order.status?.toLowerCase() ===
      'cancelled'
    ) {

      return;

    }


    const confirmed =
      confirm(
        `Are you sure you want to cancel Order #${order.id}?`
      );


    if (!confirmed) {

      return;

    }


    this.orderService
      .cancelOrder(
        order.id
      )
      .subscribe({

        next: () => {

          this.orders.update(
            orders =>
              orders.map(
                currentOrder =>
                  currentOrder.id === order.id
                    ? {
                        ...currentOrder,
                        status: 'Cancelled'
                      }
                    : currentOrder
              )
          );

        },


        error: (error) => {

          console.error(
            'Cancel order error:',
            error
          );


          this.errorMessage.set(

            error?.error?.message ||

            'Failed to cancel order.'

          );

        }

      });

  }


  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  getStatusClass(
    status: string
  ): string {

    return (
      `status-${
        status?.toLowerCase() ||
        'default'
      }`
    );

  }


  // ==========================================================
  // ITEMS COUNT
  // ==========================================================

  getItemsCount(
    order: Order
  ): number {

    return (
      order.items?.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      ) || 0
    );

  }


  // ==========================================================
  // IMAGE URL
  // ==========================================================
api=environment.imageBaseUrl;
  getImageUrl(
    imageUrl: string | null
  ): string {

    if (!imageUrl) {

      return '';

    }


    return imageUrl.startsWith('http')

      ? imageUrl

      : `${this.api}${imageUrl}`;

  }


  // ==========================================================
  // TRACK ORDER
  // ==========================================================

  trackByOrderId(
    _: number,
    order: Order
  ): number {

    return order.id;

  }


  // ==========================================================
  // TRACK ORDER ITEM
  // ==========================================================

  trackByItemId(
    _: number,
    item: OrderItem
  ): number {

    return item.id;

  }

}
