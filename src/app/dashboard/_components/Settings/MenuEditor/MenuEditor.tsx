import React, { useState, useRef, UIEvent } from 'react';

import { toast } from 'react-toastify';
import { Button, Icon, Spinner, Textfield } from 'xtreme-ui';

import { useAdmin } from '#components/context/useContext';
import { TMenu } from '#utils/database/models/menu';

import MenuEditorItem from './MenuEditorItem';
import './menuEditor.scss';

const MenuEditor = () => {
	const { profile, menus, profileLoading, profileMutate } = useAdmin();
	const [modalState, setModalState] = useState('');
	const [editItem, setEditItem] = useState<TMenu>();
	const [hideSettingsLoading, setHideSettingsLoading] = useState<string[]>([]);
	const [category, setCategory] = useState(0);
	const [categoryLoading, setCategoryLoading] = useState(false);

	// Form state for modal
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		category: '',
		price: '',
		taxPercent: '',
		foodType: '',
		veg: 'veg',
		image: '',
		hidden: false,
	});
	const [saveLoading, setSaveLoading] = useState(false);

	const categories = useRef<HTMLDivElement>(null);

	const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
	const [rightCategoryScroll, setRightCategoryScroll] = useState(true);

	const onCategoryScroll = (event: UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		if (target.scrollLeft > 50) setLeftCategoryScroll(true);
		else setLeftCategoryScroll(false);

		if (Math.round(target.scrollWidth - target.scrollLeft) - 50 > target.clientWidth) setRightCategoryScroll(true);
		else setRightCategoryScroll(false);
	};
	const categoryScrollLeft = () => {
		if (categories?.current)
			categories.current.scrollLeft -= 400;
	};
	const categoryScrollRight = () => {
		if (categories?.current)
			categories.current.scrollLeft += 400;
	};
	const onHide = async (itemId: string, hidden: boolean) => {
		setHideSettingsLoading((v) => ([...v, itemId]));
		const req = await fetch('/api/admin/menu/hidden', {
			method: 'POST',
			body: JSON.stringify({ itemId, hidden }),
		});
		const res = await req.json();

		if (res?.status !== 200) toast.error(res?.message);

		await profileMutate();
		setHideSettingsLoading((v) => v.filter((item) => item !== itemId));
	};

	const onAddCategory = async () => {
		const newCategory = window.prompt('Enter new category name:');
		if (!newCategory || !newCategory.trim()) return;

		setCategoryLoading(true);
		try {
			const res = await fetch('/api/admin/profile/category', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category: newCategory }),
			});
			const data = await res.json();
			if (data.status === 200) {
				toast.success(data.message);
				await profileMutate();
			} else {
				toast.error(data.message || 'Failed to add category');
			}
		} catch (error) {
			toast.error('Error adding category');
		} finally {
			setCategoryLoading(false);
		}
	};

	const onRemoveCategory = async (catName: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!window.confirm(`Are you sure you want to remove the '${catName}' category? Items inside will not be deleted, but they might lose their category mapping.`)) return;

		setCategoryLoading(true);
		try {
			const res = await fetch('/api/admin/profile/category', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category: catName }),
			});
			const data = await res.json();
			if (data.status === 200) {
				toast.success(data.message);
				if (category >= profile?.categories?.length! - 1) setCategory(0);
				await profileMutate();
			} else {
				toast.error(data.message || 'Failed to remove category');
			}
		} catch (error) {
			toast.error('Error removing category');
		} finally {
			setCategoryLoading(false);
		}
	};
	const onEdit = (item: TMenu) => {
		setEditItem(item);
		setFormData({
			name: item.name || '',
			description: item.description || '',
			category: item.category || '',
			price: item.price?.toString() || '',
			taxPercent: item.taxPercent?.toString() || '',
			foodType: item.foodType || '',
			veg: item.veg || 'veg',
			image: item.image || '',
			hidden: item.hidden || false,
		});
		setModalState('menuItemEditState');
	};

	const openAddModal = () => {
		setEditItem(undefined);
		setFormData({
			name: '',
			description: '',
			category: profile?.categories?.[0] || '',
			price: '',
			taxPercent: '',
			foodType: '',
			veg: 'veg',
			image: '',
			hidden: false,
		});
		setModalState('newState');
	};

	const closeModal = () => {
		setModalState('');
		setEditItem(undefined);
	};

	const handleSave = async () => {
		// Validation
		if (!formData.name.trim()) {
			toast.error('Menu item name is required');
			return;
		}
		if (!formData.category) {
			toast.error('Category is required');
			return;
		}
		if (!formData.price || isNaN(Number(formData.price))) {
			toast.error('Valid price is required');
			return;
		}
		if (!formData.taxPercent || isNaN(Number(formData.taxPercent))) {
			toast.error('Valid tax percentage is required');
			return;
		}

		setSaveLoading(true);
		try {
			const method = modalState === 'newState' ? 'POST' : 'PUT';
			const payload = {
				...formData,
				...(modalState === 'menuItemEditState' && { itemId: editItem?._id }),
			};

			const res = await fetch('/api/admin/menu', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const data = await res.json();

			if (data.status === 200) {
				toast.success(data.message);
				closeModal();
				await profileMutate(); // Refresh menu list
			} else {
				toast.error(data.message || 'Failed to save menu item');
			}
		} catch (error) {
			toast.error('Error saving menu item');
		} finally {
			setSaveLoading(false);
		}
	};

	if (profileLoading) return <Spinner fullpage label='Loading Menu...' />;

	const activeCategory = profile?.categories?.[category];
	const displayedMenus = activeCategory ? menus.filter(m => m.category === activeCategory) : menus;

	return (
		<div className='menuEditor'>
			<div className='menuCategoryEditor'>
				<div className='menuCategoryHeader'>
					<h1 className='menuCategoryHeading'>Menu Categories</h1>
					<div className='menuCategoryOptions'>
						<Button 
							size='mini' 
							icon='2b' 
							iconType='solid' 
							label='Add Category' 
							onClick={onAddCategory} 
							loading={categoryLoading} 
						/>
					</div>
				</div>
				<div className='menuCategoryContainer' ref={categories} onScroll={onCategoryScroll}>
					{
						profile?.categories?.map((item, i) => (
							<div
								key={i}
								className={`menuCategory ${category === i ? 'active' : ''}`}
								onClick={() => setCategory(i)}
							>
								<span className='title'>{item}</span>
								{
									category === i &&
									<div className='removeCategoryBtn' onClick={(e) => onRemoveCategory(item, e)}>
										<Icon code='f00d' type='solid' size={12} />
									</div>
								}
							</div>
						))
					}
					<div className='space' />
				</div>
				<div className={`scrollLeft ${leftCategoryScroll ? 'show' : ''}`} onClick={categoryScrollLeft}>
					<Icon code='f053' type='solid' />
				</div>
				<div className={`scrollRight ${rightCategoryScroll ? 'show' : ''}`} onClick={categoryScrollRight}>
					<Icon code='f054' type='solid' />
				</div>
			</div>
			<div className='menuItemEditor'>
				<div className='menuItemHeader'>
					<h1 className='menuItemHeading'>Menu Items</h1>
					<div className='menuItemOptions' />
				</div>
				<div className='menuItemContainer'>
					{
						displayedMenus.length > 0 ? displayedMenus.map((item, id) => (
							<MenuEditorItem
								key={id}
								item={item}
								onEdit={onEdit}
								onHide={onHide}
								hideSettingsLoading={hideSettingsLoading.includes(item._id.toString())}
							/>
						)) : <p style={{ color: 'var(--colorContentTertiary)', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>No items found in this category.</p>}
				</div>
			</div>
			<Button
				className={`menuEditorAdd ${modalState ? 'active' : ''}`}
				onClick={openAddModal}
				icon='2b'
				iconType='solid'
				label='Add Item'
				size='large'
			/>

			{/* Modal for Add/Edit Menu Item */}
			{modalState && (
				<div className='modalOverlay' onClick={closeModal}>
					<div className='modalBox menuItemModal' onClick={(e) => e.stopPropagation()}>
						<h2>{modalState === 'newState' ? 'Add New Menu Item' : 'Edit Menu Item'}</h2>
						<div className='modalContent'>
							<div className='formField'>
								<label>Item Name *</label>
								<Textfield
									placeholder='e.g., Cappuccino'
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									autoFocus
								/>
							</div>
							<div className='formField'>
								<label>Description</label>
								<Textfield
									placeholder='Brief description of the item'
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								/>
							</div>
							<div className='formRow'>
								<div className='formField'>
									<label>Category *</label>
									<select
										value={formData.category}
										onChange={(e) => setFormData({ ...formData, category: e.target.value })}
									>
										<option value=''>Select category</option>
										{profile?.categories?.map((cat, i) => (
											<option key={i} value={cat}>{cat}</option>
										))}
									</select>
								</div>
								<div className='formField'>
									<label>Veg/Non-Veg *</label>
									<select
										value={formData.veg}
										onChange={(e) => setFormData({ ...formData, veg: e.target.value })}
									>
										<option value='veg'>Vegetarian</option>
										<option value='non-veg'>Non-Vegetarian</option>
										<option value='contains-egg'>Contains Egg</option>
									</select>
								</div>
							</div>
							<div className='formRow'>
								<div className='formField'>
									<label>Price *</label>
									<Textfield
										placeholder='0.00'
										value={formData.price}
										onChange={(e) => setFormData({ ...formData, price: e.target.value })}
										type='number'
									/>
								</div>
								<div className='formField'>
									<label>Tax % *</label>
									<Textfield
										placeholder='e.g., 8'
										value={formData.taxPercent}
										onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
										type='number'
									/>
								</div>
							</div>
							<div className='formField'>
								<label>Food Type (Optional)</label>
								<select
									value={formData.foodType}
									onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
								>
									<option value=''>None</option>
									<option value='spicy'>Spicy</option>
									<option value='extra-spicy'>Extra Spicy</option>
									<option value='sweet'>Sweet</option>
								</select>
							</div>
							<div className='formField'>
								<label>Image URL (Optional)</label>
								<Textfield
									placeholder='https://example.com/image.jpg'
									value={formData.image}
									onChange={(e) => setFormData({ ...formData, image: e.target.value })}
								/>
							</div>
							<div className='formCheckbox'>
								<input
									type='checkbox'
									id='hiddenCheckbox'
									checked={formData.hidden}
									onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
								/>
								<label htmlFor='hiddenCheckbox'>Hide from customer menu</label>
							</div>
						</div>
						<div className='modalActions'>
							<Button label='Cancel' type='secondary' onClick={closeModal} />
							<Button
								label={modalState === 'newState' ? 'Create Item' : 'Save Changes'}
								onClick={handleSave}
								loading={saveLoading}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MenuEditor;
