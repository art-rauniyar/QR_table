import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import connectDB from '#utils/database/connect';
import { Customers } from '#utils/database/models/customer';
import { Menus } from '#utils/database/models/menu';
import { Orders, TOrder } from '#utils/database/models/order';
import { authOptions } from '#utils/helper/authHelper';
import { CatchNextResponse } from '#utils/helper/common';

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);

		if (!session) throw { status: 401, message: 'Authentication Required' };

		const restaurantID = session?.restaurant?.username;
		const customer = session?.customer?._id;
		const order: any = await Orders.findOne<TOrder>({ restaurantID, customer, state: 'active' })
			.populate({ path: 'customer', model: Customers })
			.populate({ path: 'products.product', model: Menus })
			.lean();

		if (order?.products)
			order.products = order?.products?.map((product: any) => {
				// Preserve order-specific fields like adminApproved by reversing spread order
				const mergedProduct = { ...product.product, ...product } as any;
				mergedProduct.product = product?.product?.id;
				return mergedProduct;
			}) as any;

		return NextResponse.json(order);
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = 'force-dynamic';
