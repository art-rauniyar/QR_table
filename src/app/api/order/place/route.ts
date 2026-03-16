import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import connectDB from '#utils/database/connect';
import { Menus, TMenu } from '#utils/database/models/menu';
import { Orders, TOrder, TProduct } from '#utils/database/models/order';
import { authOptions } from '#utils/helper/authHelper';
import { CatchNextResponse } from '#utils/helper/common';
import { orderLimiter } from '#utils/helper/rateLimiter';

const MAX_ORDER_ITEMS = 50;
const MAX_QUANTITY = 99;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export async function POST (req: Request) {
	try {
		// --- Rate Limiting ---
		const forwarded = req.headers.get('x-forwarded-for');
		const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
		if (!orderLimiter.check(ip)) {
			return NextResponse.json(
				{ message: 'Too many requests. Please wait a moment.', status: 429 },
				{ status: 429 },
			);
		}

		const session = await getServerSession(authOptions);
		const body = await req.json();

		if (!session) throw { status: 401, message: 'Authentication Required' };
		if (!Array.isArray(body?.products) || !body.products.length) {
			throw { status: 400, message: 'Can\'t place order on empty cart' };
		}
		if (body.products.length > MAX_ORDER_ITEMS) {
			throw { status: 400, message: `Order cannot exceed ${MAX_ORDER_ITEMS} items` };
		}

		// --- Input Validation ---
		for (const product of body.products) {
			if (!product?._id || !OBJECT_ID_REGEX.test(String(product._id))) {
				throw { status: 400, message: 'Invalid product identifier' };
			}
			const qty = Number(product?.quantity);
			if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
				throw { status: 400, message: `Quantity must be between 1 and ${MAX_QUANTITY}` };
			}
		}

		await connectDB();
		const products: TProduct[] = await Promise.all(body?.products?.map(async (product: TProduct & {_id: string}) => {
			const menuItem = await Menus.findById<TMenu>(product?._id).lean();

			if (!menuItem) throw { status: 404, message: 'Ordered product(s) not found.' };
			return {
				product: product?._id,
				quantity: product?.quantity,
				price: menuItem?.price,
				tax: (menuItem?.price * menuItem?.taxPercent / 100).toFixed(2),
			};
		}));

		const restaurantID = session?.restaurant?.username;
		const table = session?.restaurant?.table;
		const customer = session?.customer?._id;
		const order = await Orders.findOne<TOrder>({ restaurantID, customer, state: 'active' });

		if (order) {
			order.products = [...order.products, ...products];
			await order.save();

			return NextResponse.json({ status: 200, message: 'Additional items ordered successfully' });
		}

		const newOrder = new Orders({ restaurantID, table, customer, products: products });
		await newOrder.save();

		return NextResponse.json({ status: 200, message: 'Order placed successfully' });

	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = 'force-dynamic';
