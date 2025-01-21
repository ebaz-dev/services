import { BadRequestError, Cart, CartProductDoc, CartStatus } from "@ezdev/core";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";
import { migrateProducts } from "./migrateProducts";

export const cartProductsAdd = async (
  supplierId: Types.ObjectId,
  merchantId: Types.ObjectId,
  userId: Types.ObjectId,
  products: CartProductDoc[],
  clearCart: boolean,
  refOrderId?: Types.ObjectId
): Promise<any> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let cart = await Cart.findOne({
      supplierId,
      merchantId,
      userId,
      status: {
        $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned],
      },
    }).session(session);

    if (cart && cart.status === CartStatus.Pending) {
      throw new BadRequestError("Card is waiting for inventory response");
    }

    if (!cart) {
      cart = new Cart({
        status: CartStatus.Created,
        supplierId,
        merchantId,
        userId: userId,
        products: [],
      });
    }
    const cartProducts = clearCart ? [] : cart.products;

    products.map((product) => {
      const productIndex = cartProducts.findIndex(
        (cartProduct: any) =>
          cartProduct.id.toString() === product.id.toString()
      );

      if (productIndex !== -1) {
        // Update quantity if the product exists
        cartProducts[productIndex].quantity += product.quantity;

        // Remove product if quantity is zero or less
        if (cartProducts[productIndex].quantity <= 0) {
          cartProducts.splice(productIndex, 1);
        }
      } else {
        cartProducts.push(<CartProductDoc>{
          id: new Types.ObjectId(product.id),
          quantity: product.quantity,
        });
      }
    });
    cart.products = cartProducts;
    cart.status = CartStatus.Created;
    if (refOrderId) {
      cart.refOrderId = new Types.ObjectId(refOrderId);
    }
    await cart.save({ session });
    cart = await migrateProducts(cart);
    await session.commitTransaction();
    return cart;
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Product add operation failed", error);
    throw new BadRequestError("product add operation failed");
  } finally {
    session.endSession();
  }
};
