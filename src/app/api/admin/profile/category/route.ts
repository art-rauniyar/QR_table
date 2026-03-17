import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import connectDB from '#utils/database/connect';
import { Profiles, TProfile } from '#utils/database/models/profile';
import { authOptions } from '#utils/helper/authHelper';
import { CatchNextResponse } from '#utils/helper/common';

// Add a category
export async function POST(req: NextRequest) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session || session.role !== 'admin') throw { status: 401, message: 'Authentication required' };

		const { category } = await req.json();
		if (!category || typeof category !== 'string' || !category.trim()) {
			throw { status: 400, message: 'Invalid category name' };
		}
		const cleanCategory = category.trim().toLowerCase();

		const profile = await Profiles.findOneAndUpdate(
			{ restaurantID: session.username },
			{ $addToSet: { categories: cleanCategory } },
			{ new: true }
		);

		if (!profile) throw { status: 404, message: 'Profile not found' };

		return NextResponse.json({ status: 200, message: 'Category added successfully', categories: profile.categories });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

// Remove a category
export async function DELETE(req: NextRequest) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session || session.role !== 'admin') throw { status: 401, message: 'Authentication required' };

		const { category } = await req.json();
		if (!category || typeof category !== 'string') {
			throw { status: 400, message: 'Invalid category name' };
		}
		const cleanCategory = category.trim().toLowerCase();

		const profile = await Profiles.findOneAndUpdate(
			{ restaurantID: session.username },
			{ $pull: { categories: cleanCategory } },
			{ new: true }
		);

		if (!profile) throw { status: 404, message: 'Profile not found' };

		return NextResponse.json({ status: 200, message: 'Category removed successfully', categories: profile.categories });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
