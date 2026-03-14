import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

import { authOptions } from '#utils/helper/authHelper';
import connectDB from '#utils/database/connect';
import { Tables } from '#utils/database/models/table';
import { CatchNextResponse } from '#utils/helper/common';

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.username) throw { status: 401, message: 'Unauthorized' };
		if (session?.role !== 'admin') throw { status: 403, message: 'Forbidden - Admin only' };

		const body = await req.json();
		const { tableId, tableIds } = body;

		await connectDB();

		// Handle single QR code generation
		if (tableId) {
			const table = await Tables.findById(tableId);
			if (!table) throw { status: 404, message: 'Table not found' };
			if (table.restaurantID !== session.username) throw { status: 403, message: 'Forbidden' };

			const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${table.restaurantID}?table=${table.username}`;
			const qrCodeDataURL = await QRCode.toDataURL(url, {
				width: 300,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF',
				},
			});

			return NextResponse.json({
				status: 200,
				qrCode: qrCodeDataURL,
				url,
				tableName: table.name,
			});
		}

		// Handle bulk QR code generation
		if (tableIds && Array.isArray(tableIds)) {
			const tables = await Tables.find({
				_id: { $in: tableIds },
				restaurantID: session.username,
			});

			if (tables.length !== tableIds.length) {
				throw { status: 400, message: 'Some tables not found or forbidden' };
			}

			const qrCodes = await Promise.all(
				tables.map(async (table) => {
					const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${table.restaurantID}?table=${table.username}`;
					const qrCodeDataURL = await QRCode.toDataURL(url, {
						width: 300,
						margin: 2,
						color: {
							dark: '#000000',
							light: '#FFFFFF',
						},
					});

					return {
						tableId: table._id,
						tableName: table.name,
						qrCode: qrCodeDataURL,
						url,
					};
				}),
			);

			return NextResponse.json({
				status: 200,
				qrCodes,
			});
		}

		throw { status: 400, message: 'Either tableId or tableIds must be provided' };
	}
	catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = 'force-dynamic';
