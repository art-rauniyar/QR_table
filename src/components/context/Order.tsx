import { createContext, ReactNode, useEffect, useState } from 'react';

import noop from 'lodash/noop';
import pick from 'lodash/pick';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import useSWR from 'swr';

import { TMenu } from '#utils/database/models/menu';
import { TOrder } from '#utils/database/models/order';
import { fetcher } from '#utils/helper/common';

const OrderDefault: TOrderInitialType = {
	order: undefined,
	loading: false,
	placeOrder: () => new Promise(noop),
	placingOrder: false,
	cancelOrder: noop,
	cancelingOrder: false,
	selectedProducts: [],
	increaseProductQuantity: noop,
	decreaseProductQuantity: noop,
	resetSelectedProducts: noop,
};

export const OrderContext = createContext(OrderDefault);
export const OrderProvider = ({ children }: TOrderProviderProps) => {
	const session = useSession();
	const authenticated = session.status === 'authenticated';
	const { data: order, isLoading: loading, mutate } = useSWR(authenticated ? '/api/order' : null, fetcher, { refreshInterval: 5000 });

	const [placingOrder, setPlacingOrder] = useState(false);
	const [cancelingOrder, setCancelingOrder] = useState(false);
	const [selectedProducts, setSelectedProducts] = useState<Array<TMenuCustom>>([]);

	const increaseProductQuantity = (product: TMenuCustom) => {
		const selection = [...selectedProducts];
		if (selectedProducts.some((item) => item._id === product._id)) {
			selection.forEach((item) => {
				if (product._id === item._id) item.quantity++;
			});
		} else {
			product.quantity = 1;
			selection.push(product);
		}
		setSelectedProducts(selection);
	};
	const decreaseProductQuantity = (product: TMenuCustom) => {
		let selection = [...selectedProducts];
		selection.forEach((item) => {
			if (product._id === item._id) {
				item.quantity--;
				if (item.quantity === 0) {
					const filter = selection.filter((tempItem) => tempItem._id !== product._id);
					selection = [...filter];
				}
			}
		});
		setSelectedProducts(selection);
	};
	const resetSelectedProducts = () => setSelectedProducts([]);

	const placeOrder = async (products: Array<TMenuCustom>) => {
		setPlacingOrder(true);
		const req = await fetch('/api/order/place', { method: 'POST', body: JSON.stringify({
			products: products.map((product) => pick(product, ['_id', 'quantity'])),
		}) });
		const res = await req.json();

		if (!req.ok) toast.error(res?.message);
		await mutate();
		setPlacingOrder(false);
	};
	const cancelOrder = async () => {
		setCancelingOrder(true);
		const req = await fetch('/api/order/cancel', { method: 'POST' });
		const res = await req.json();

		if (!req.ok) toast.error(res?.message);
		await mutate();
		setCancelingOrder(false);
	};

	useEffect(() => {
		mutate();
	}, [mutate, session.status]);

	return (
		<OrderContext.Provider value={{ 
			order, loading, placeOrder, placingOrder, cancelOrder, cancelingOrder,
			selectedProducts, increaseProductQuantity, decreaseProductQuantity, resetSelectedProducts
		}}>
			{children}
		</OrderContext.Provider>
	);
};

export type TOrderProviderProps = {
    children?: ReactNode
}

export type TOrderInitialType = {
	order?: TOrder,
	loading: boolean,
	placeOrder: (products: Array<TMenuCustom>) => Promise<void>
	placingOrder: boolean,
	cancelOrder: () => void,
	cancelingOrder: boolean,
	selectedProducts: Array<TMenuCustom>,
	increaseProductQuantity: (product: TMenuCustom) => void,
	decreaseProductQuantity: (product: TMenuCustom) => void,
	resetSelectedProducts: () => void,
}
type TMenuCustom = TMenu & {quantity: number}
