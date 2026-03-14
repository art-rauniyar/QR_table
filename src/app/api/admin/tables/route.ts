import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '#utils/helper/authHelper';
import connectDB from '#utils/database/connect';
import { Tables, TTable } from '#utils/database/models/table';
import { Accounts } from '#utils/database/models/account';
import { CatchNextResponse } from '#utils/helper/common';

export async function GET () {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.username) throw { status: 401, message: 'Unauthorized' };
		if (session?.role !== 'admin') throw { status: 403, message: 'Forbidden - Admin only' };

		await connectDB();
		const tables = await Tables.find<TTable>({ restaurantID: session.username });

		return NextResponse.json(tables);
	}
	catch (err) {
		return CatchNextResponse(err);
	}
}

export async function POST (req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.username) throw { status: 401, message: 'Unauthorized' };
		if (session?.role !== 'admin') throw { status: 403, message: 'Forbidden - Admin only' };

		const body = await req.json();
		const { name, username } = body;

		if (!name) throw { status: 400, message: 'Table name is required' };
		if (!username) throw { status: 400, message: 'Table username is required' };

		await connectDB();

		// Check if table username already exists for this restaurant
		const existingTable = await Tables.findOne({ restaurantID: session.username, username });
		if (existingTable) throw { status: 400, message: 'Table ID already exists' };

		const newTable = await new Tables({
			name,
			username,
			restaurantID: session.username,
		}).save();

		return NextResponse.json({ status: 200, message: 'Table created successfully', table: newTable });
	}
	catch (err) {
		return CatchNextResponse(err);
	}
}

export async function DELETE (req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.username) throw { status: 401, message: 'Unauthorized' };
		if (session?.role !== 'admin') throw { status: 403, message: 'Forbidden - Admin only' };

		const body = await req.json();
		const { tableId } = body;

		if (!tableId) throw { status: 400, message: 'Table ID is required' };

		await connectDB();

		// Verify table belongs to this restaurant
		const table = await Tables.findById(tableId);
		if (!table) throw { status: 404, message: 'Table not found' };
		if (table.restaurantID !== session.username) throw { status: 403, message: 'Forbidden' };

		await Tables.findByIdAndDelete(tableId);

		// Remove from account's tables array
		await Accounts.updateOne(
			{ username: session.username },
			{ $pull: { tables: tableId } },
		);

		return NextResponse.json({ status: 200, message: 'Table deleted successfully' });
	}
	catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = 'force-dynamic';
