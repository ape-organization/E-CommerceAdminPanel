export interface Product {
 id: number;
  name: string;
  description?: string | null;
  price: number;
  discount?: number | null;
  stockQuantity: number;
  isInStock: boolean;
  imageUrl?: string | null;
  brandId?: number | null;
  brand?: any | null;
  subCategories?: SubCategoryResponse[];
}

export interface SubCategoryResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface ProductDto {
 id: number;
  name: string;
  description?: string | null;
  price: number;
  discount?: number | null;
  stockQuantity: number;
  isInStock: boolean;
  imageUrl?: string | null;
  brandId?: number | null;
  brand?: any | null;
  subCategories?: SubCategoryResponse[];
}