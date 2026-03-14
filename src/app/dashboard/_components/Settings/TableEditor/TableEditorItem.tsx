import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import { Button, Icon, Spinner } from 'xtreme-ui';

import { TTable } from '#utils/database/models/table';

const TableEditorItem = (props: TTableEditorItemProps) => {
	const { table, onDelete } = props;
	const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
	const [qrLoading, setQrLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		fetchQRCode();
	}, [table._id]);

	const fetchQRCode = async () => {
		setQrLoading(true);
		try {
			const res = await fetch('/api/admin/tables/qrcode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tableId: table._id }),
			});
			const data = await res.json();

			if (data.status === 200) {
				setQrCodeDataURL(data.qrCode);
			} else {
				toast.error(data.message || 'Failed to generate QR code');
			}
		} catch (error) {
			toast.error('Error generating QR code');
		} finally {
			setQrLoading(false);
		}
	};

	const handleDownload = () => {
		if (!qrCodeDataURL) return;

		const link = document.createElement('a');
		link.href = qrCodeDataURL;
		link.download = `${table.restaurantID}-table-${table.username}-qr.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success('QR code downloaded!');
	};

	const handleDelete = async () => {
		if (!confirm(`Are you sure you want to delete "${table.name}"?`)) return;

		setDeleteLoading(true);
		try {
			const res = await fetch('/api/admin/tables', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tableId: table._id }),
			});
			const data = await res.json();

			if (data.status === 200) {
				toast.success('Table deleted successfully');
				onDelete(table._id.toString());
			} else {
				toast.error(data.message || 'Failed to delete table');
			}
		} catch (error) {
			toast.error('Error deleting table');
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<div className='tableCard'>
			<div className='tableCardHeader'>
				<div className='tableInfo'>
					<h3>{table.name}</h3>
					<p className='tableId'>ID: {table.username}</p>
				</div>
				<div className='deleteButton' onClick={handleDelete}>
					{deleteLoading ? <Spinner size='mini' /> : <Icon code='f2ed' type='solid' />}
				</div>
			</div>

			<div className='qrCodeContainer'>
				{qrLoading ? (
					<Spinner label='Generating QR...' />
				) : qrCodeDataURL ? (
					<img src={qrCodeDataURL} alt={`QR code for ${table.name}`} />
				) : (
					<p>QR code unavailable</p>
				)}
			</div>

			<div className='tableCardActions'>
				<Button
					label='Download QR'
					icon='f019'
					iconType='solid'
					size='small'
					onClick={handleDownload}
					disabled={!qrCodeDataURL || qrLoading}
				/>
			</div>
		</div>
	);
};

export default TableEditorItem;

type TTableEditorItemProps = {
	table: TTable & { _id: any };
	onDelete: (tableId: string) => void;
}
