import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import { Button, Spinner, Textfield } from 'xtreme-ui';

import { TTable } from '#utils/database/models/table';

import TableEditorItem from './TableEditorItem';
import './tableEditor.scss';

const TableEditor = () => {
	const [tables, setTables] = useState<(TTable & { _id: any })[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newTableName, setNewTableName] = useState('');
	const [newTableUsername, setNewTableUsername] = useState('');
	const [addLoading, setAddLoading] = useState(false);
	const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false);

	useEffect(() => {
		fetchTables();
	}, []);

	const fetchTables = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/admin/tables');
			const data = await res.json();

			if (Array.isArray(data)) {
				setTables(data);
			} else {
				toast.error('Failed to load tables');
			}
		} catch (error) {
			toast.error('Error loading tables');
		} finally {
			setLoading(false);
		}
	};

	const handleAddTable = async () => {
		if (!newTableName.trim() || !newTableUsername.trim()) {
			toast.error('Please fill in all fields');
			return;
		}

		setAddLoading(true);
		try {
			const res = await fetch('/api/admin/tables', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newTableName,
					username: newTableUsername,
				}),
			});
			const data = await res.json();

			if (data.status === 200) {
				toast.success('Table created successfully');
				setNewTableName('');
				setNewTableUsername('');
				setShowAddModal(false);
				fetchTables(); // Refresh list
			} else {
				toast.error(data.message || 'Failed to create table');
			}
		} catch (error) {
			toast.error('Error creating table');
		} finally {
			setAddLoading(false);
		}
	};

	const handleDeleteTable = (tableId: string) => {
		setTables((prev) => prev.filter((table) => table._id.toString() !== tableId));
	};

	const handleBulkDownload = async () => {
		if (tables.length === 0) {
			toast.error('No tables to download');
			return;
		}

		setBulkDownloadLoading(true);
		try {
			const tableIds = tables.map((table) => table._id);
			const res = await fetch('/api/admin/tables/qrcode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tableIds }),
			});
			const data = await res.json();

			if (data.status === 200 && data.qrCodes) {
				// Download each QR code
				data.qrCodes.forEach((qr: any, index: number) => {
					setTimeout(() => {
						const link = document.createElement('a');
						link.href = qr.qrCode;
						link.download = `${qr.tableName.replace(/\s+/g, '-')}-qr.png`;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}, index * 100); // Stagger downloads
				});
				toast.success(`Downloaded ${data.qrCodes.length} QR codes`);
			} else {
				toast.error(data.message || 'Failed to generate QR codes');
			}
		} catch (error) {
			toast.error('Error downloading QR codes');
		} finally {
			setBulkDownloadLoading(false);
		}
	};

	if (loading) return <Spinner fullpage label='Loading tables...' />;

	return (
		<div className='tableEditor'>
			<div className='tableEditorHeader'>
				<h1>Table Management</h1>
				<div className='tableEditorActions'>
					{tables.length > 0 && (
						<Button
							label='Download All QR Codes'
							icon='f019'
							iconType='solid'
							type='secondary'
							onClick={handleBulkDownload}
							loading={bulkDownloadLoading}
						/>
					)}
					<Button
						label='Add New Table'
						icon='2b'
						iconType='solid'
						onClick={() => setShowAddModal(true)}
					/>
				</div>
			</div>

			{tables.length === 0 ? (
				<div className='emptyState'>
					<h3>No tables yet</h3>
					<p>Create your first table to generate QR codes for customer ordering</p>
					<Button label='Add Table' icon='2b' iconType='solid' onClick={() => setShowAddModal(true)} />
				</div>
			) : (
				<div className='tableGrid'>
					{tables.map((table) => (
						<TableEditorItem
							key={table._id.toString()}
							table={table}
							onDelete={handleDeleteTable}
						/>
					))}
				</div>
			)}

			{/* Add Table Modal */}
			{showAddModal && (
				<div className='modalOverlay' onClick={() => setShowAddModal(false)}>
					<div className='modalBox' onClick={(e) => e.stopPropagation()}>
						<h2>Add New Table</h2>
						<div className='modalContent'>
							<Textfield
								placeholder='Table Name (e.g., Table 6)'
								value={newTableName}
								onChange={(e) => setNewTableName(e.target.value)}
								autoFocus
							/>
							<Textfield
								placeholder='Table ID (e.g., 6)'
								value={newTableUsername}
								onChange={(e) => setNewTableUsername(e.target.value)}
								onEnterKey={handleAddTable}
							/>
						</div>
						<div className='modalActions'>
							<Button label='Cancel' type='secondary' onClick={() => setShowAddModal(false)} />
							<Button label='Create Table' onClick={handleAddTable} loading={addLoading} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TableEditor;
