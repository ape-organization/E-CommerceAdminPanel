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
import {
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';

import { TranslatePipe } from '@ngx-translate/core';

import { MatDialog } from '@angular/material/dialog';

import { OrderService } from '../../services/order.service';

import {
  Order,
  OrderItem
} from '../../models/order.model';

import { environment } from '../../../environments/environment';

import {
  ConfirmDeleteComponent
} from '../../shared/confirm-delete/confirm-delete.component';


@Component({

  selector: 'app-orders',

  standalone: true,

  imports: [

    CommonModule,

    MatIconModule,

    MatButtonModule,

    MatProgressSpinnerModule,

    MatSelectModule,

    MatPaginatorModule,

    TranslatePipe

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


  private readonly dialog =
    inject(MatDialog);


  // ==========================================================
  // ORDERS
  // ==========================================================

  readonly orders =
    signal<Order[]>([]);


  readonly loading =
    signal(false);


  readonly loadingMore =
    signal(false);


  readonly errorMessage =
    signal<string | null>(null);


  readonly expandedOrderId =
    signal<number | null>(null);


  // ==========================================================
  // FILTERS
  // ==========================================================

  /*
   * What the user is currently typing.
   * This does NOT automatically call the API.
   */

  readonly orderIdInput =
    signal('');


  /*
   * The actual order ID sent to the API.
   */

  readonly orderIdFilter =
    signal<number | null>(null);


  /*
   * Empty string means all statuses.
   */

  readonly statusFilter =
    signal('');


  // ==========================================================
  // PAGINATION
  // ==========================================================

  readonly pageIndex =
    signal(0);


  readonly pageSize =
    signal(10);


  readonly pageSizeOptions =
    [5, 10, 25, 50];


  // ==========================================================
  // SERVER PAGINATION
  // ==========================================================

  readonly serverPage =
    signal(1);


  readonly serverPageSize =
    signal(30);


  readonly hasNextPage =
    signal(false);


  // ==========================================================
  // LOCAL PAGINATION
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
  // TOTAL
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

    this.serverPage.set(1);

    this.orderService
      .getOrders(

        1,

        this.serverPageSize(),

        this.orderIdFilter(),

        this.statusFilter() || null

      )
      .subscribe({

        next: (response) => {
console.log(response)
          this.orders.set(
            response.items ?? []
          );


          this.hasNextPage.set(
            response.hasMore
          );


          this.pageIndex.set(0);


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

          this.hasNextPage.set(false);

          this.loading.set(false);


          this.errorMessage.set(
            'Failed to load orders.'
          );

        }

      });

  }


  // ==========================================================
  // LOAD MORE
  // ==========================================================

  loadMoreOrders(): void {

    if (this.loadingMore()) {
      return;
    }


    if (!this.hasNextPage()) {
      return;
    }


    const nextPage =
      this.serverPage() + 1;


    this.loadingMore.set(true);

    this.errorMessage.set(null);


    this.orderService
      .getOrders(

        nextPage,

        this.serverPageSize(),

        this.orderIdFilter(),

        this.statusFilter() || null

      )
      .subscribe({

        next: (response) => {

          this.orders.update(
            currentOrders => [

              ...currentOrders,

              ...(response.items ?? [])

            ]
          );


          this.serverPage.set(
            response.page
          );


          this.hasNextPage.set(
            response.hasMore
          );


          this.loadingMore.set(false);

        },


        error: (error) => {

          console.error(
            'Load more orders error:',
            error
          );


          this.loadingMore.set(false);


          this.errorMessage.set(
            'Failed to load more orders.'
          );

        }

      });

  }


  // ==========================================================
  // ORDER ID INPUT
  // ==========================================================

  onOrderIdInput(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.orderIdInput.set(
      input.value
    );

  }


  // ==========================================================
  // SEARCH ORDER
  // ==========================================================

  searchOrder(): void {

    const value =
      this.orderIdInput()
        .trim();


    /*
     * Empty input means remove
     * the order ID filter.
     */

    if (!value) {

      this.orderIdFilter.set(null);

      this.loadOrders();

      return;

    }


    const orderId =
      Number(value);


    /*
     * Invalid order ID.
     */

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {

      return;

    }


    this.orderIdFilter.set(
      orderId
    );


    this.loadOrders();

  }


  // ==========================================================
  // CLEAR ORDER ID
  // ==========================================================

  clearOrderId(): void {

    this.orderIdInput.set('');

    this.orderIdFilter.set(null);

    this.loadOrders();

  }


  // ==========================================================
  // STATUS FILTER
  // ==========================================================

  onStatusChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;


    this.statusFilter.set(
      select.value
    );


    this.loadOrders();

  }


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  clearFilters(): void {

    this.orderIdInput.set('');

    this.orderIdFilter.set(null);

    this.statusFilter.set('');

    this.loadOrders();

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
      .cancelOrder(
        order.id
      )
      .subscribe({

        error: (error) => {

          console.error(
            'Update order status error:',
            error
          );


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


    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data:
            `Are you sure you want to cancel Order #${order.id}?`
        }
      )
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
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
                'Failed to cancel order.'
              );

            }

          });

      });

  }


  // ==========================================================
  // COMPLETE ORDER
  // ==========================================================

  completeOrder(
    order: Order
  ): void {

    if (
      order.status?.toLowerCase() ===
      'confirmed'
    ) {

      return;

    }


    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data:
            `Are you sure you want to complete Order #${order.id}?`
        }
      )
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }


        this.orderService
          .completeOrder(
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
                            status: 'Confirmed'
                          }
                        : currentOrder
                  )
              );

            },


            error: (error) => {

              console.error(
                'Confirmed order error:',
                error
              );


              this.errorMessage.set(
                'Failed to Confirmed order.'
              );

            }

          });

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

  api =
    environment.imageBaseUrl;


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