import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import connectDB from '#utils/database/connect';
import { Menus, TMenu } from '#utils/database/models/menu';
import { authOptions } from '#utils/helper/authHelper';
import { CatchNextResponse } from '#utils/helper/common';

// POST - Create new menu item
export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: 'Authentication Required' };

		const body = await req.json();
		const { name, description, category, price, taxPercent, foodType, veg, image, hidden } = body;

		if (!name) throw { status: 400, message: 'Menu item name is required' };
		if (!category) throw { status: 400, message: 'Category is required' };
		if (price === undefined || price === null) throw { status: 400, message: 'Price is required' };
		if (taxPercent === undefined || taxPercent === null) throw { status: 400, message: 'Tax percentage is required' };
		if (!veg) throw { status: 400, message: 'Veg/Non-Veg classification is required' };

		const newMenuItem = new Menus({
			name,
			restaurantID: session.username,
			description: description || '',
			category,
			price: Number(price),
			taxPercent: Number(taxPercent),
			foodType: foodType || undefined,
			veg,
			image: image || '',
			hidden: hidden !== undefined ? hidden : true,
		});

		await newMenuItem.save();

		return NextResponse.json({
			status: 200,
			message: 'Menu item created successfully',
			item: newMenuItem
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

// PUT - Update existing menu item
export async function PUT(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: 'Authentication Required' };

		const body = await req.json();
		const { itemId, name, description, category, price, taxPercent, foodType, veg, image, hidden } = body;

		if (!itemId) throw { status: 400, message: 'Menu item ID is required' };

		const menuItem = await Menus.findById<TMenu>(itemId);
		if (!menuItem) throw { status: 404, message: `Menu item with id: ${itemId}, not found` };

		// Update fields if provided
		if (name !== undefined) menuItem.name = name;
		if (description !== undefined) menuItem.description = description;
		if (category !== undefined) menuItem.category = category;
		if (price !== undefined) menuItem.price = Number(price);
		if (taxPercent !== undefined) menuItem.taxPercent = Number(taxPercent);
		if (foodType !== undefined) menuItem.foodType = foodType;
		if (veg !== undefined) menuItem.veg = veg;
		if (image !== undefined) menuItem.image = image;
		if (hidden !== undefined) menuItem.hidden = hidden;

		await menuItem.save();

		return NextResponse.json({
			status: 200,
			message: 'Menu item updated successfully',
			item: menuItem
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

// DELETE - Delete menu item
export async function DELETE(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: 'Authentication Required' };

		const { searchParams } = new URL(req.url);
		const itemId = searchParams.get('itemId');

		if (!itemId) throw { status: 400, message: 'Menu item ID is required' };

		const menuItem = await Menus.findByIdAndDelete(itemId);
		if (!menuItem) throw { status: 404, message: `Menu item with id: ${itemId}, not found` };

		return NextResponse.json({
			status: 200,
			message: 'Menu item deleted successfully'
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = 'force-dynamic';
