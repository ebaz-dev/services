import { ObjectId } from "../../lib/mongoose";

interface BasProductData {
  productid: number;
  productname: string;
  sectorname: string;
  brandname: string;
  categoryname: string;
  packagename: string;
  flavorname: string;
  capacity: string;
  incase: number;
  barcode: string;
  business?: string;
}

interface ThirdPartyData {
  customerId: ObjectId;
  productId: number;
}

export { BasProductData, ThirdPartyData };
