import { Brand } from "./Brand.model";

export interface SubCategoryResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface Product {
id: number;
  name: string;
  description?: string | null;
  price: number;
  isInStock: boolean;
  discountPercentage?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  brandId?: number | null;
  brand?: Brand | null;
  subCategories: SubCategoryResponse[];
}

