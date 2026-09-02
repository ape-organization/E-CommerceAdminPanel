import { Brand } from "./Brand.model";
import { Category } from "./category.model";

export interface SubCategoryResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface Product {
id: number;
  nameEn: string;
  descriptionEn?: string | null;
  nameAr: string;
  descriptionAr?: string | null;
  price: number;
  isInStock: boolean;
  discountPercentage?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  brandId?: number | null;
  brand?: Brand | null;
  category?:Category|null;
  subCategories: SubCategoryResponse[];
}

