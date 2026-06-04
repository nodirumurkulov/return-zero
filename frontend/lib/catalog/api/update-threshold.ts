import { updateThreshold } from "@/app/actions";

export type ProductRef = {
  readonly id: string;
};

export type UpdateThresholdInput = {
  readonly product: ProductRef;
  readonly formData: FormData;
};

export async function updateThresholdApi(input: UpdateThresholdInput) {
  return updateThreshold(input.product.id, input.formData);
}
