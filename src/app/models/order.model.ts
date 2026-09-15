
export interface OrderItem {

  id: number;

  productId: number;

  productName: string;

  imageUrl: string | null;

  quantity: number;

  unitPrice: number;

  totalPrice: number;
}


export interface Order {

  id: number;

  clientId: number;

  clientName: string;

  phoneNumber: string;
  governorate :string;

  address: string | null;

  email: string | null;

  orderDate: string;

  status: string;

  totalAmount: number;

  items: OrderItem[];
}
 export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
  hasPreviousPage: boolean;
}