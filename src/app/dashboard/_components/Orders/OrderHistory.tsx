import { UIEvent, useEffect, useState } from 'react';

import SideSheet from '#components/base/SideSheet';
import { useAdmin } from '#components/context/useContext';
import Invoice from '#components/layout/Invoice';
import NoContent from '#components/layout/NoContent';
import { TOrder } from '#utils/database/models/order';

import OrdersCard from './OrdersCard';

const OrderHistory = (props: TOrderHistoryProps) => {
	const { onScroll } = props;
	const { orderHistory = [] } = useAdmin();

	const [activeCardID, setActiveCardID] = useState<string>();
	const [activeCardData, setActiveCardData] = useState<TOrder>();
	const [sideSheetOpen, setSideSheetOpen] = useState(false);
	const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

	// Filter orders based on selected filter
	const filteredOrders = orderHistory.filter((order) => {
		if (filter === 'completed') return order.state === 'complete';
		if (filter === 'cancelled') return order.state === 'cancel' || order.state === 'reject';
		return true; // 'all'
	});

	useEffect(() => {
		if (filteredOrders?.length === 0) {
			setActiveCardID(undefined);
			setActiveCardData(undefined);
		}
		else if (!filteredOrders.some(({ _id }) => _id.toString() === activeCardID)) {
			setActiveCardID(filteredOrders[0]?._id.toString());
			setActiveCardData(filteredOrders[0]);
		}
	}, [activeCardID, activeCardData, filteredOrders]);

	return (
		<div className='orders'>
			{
				orderHistory.length === 0 ? <NoContent label='No order history' animationName='GhostNoContent' />
					: <div className='ordersContent'>
						<div className='list' onScroll={onScroll}>
							<div className='filterButtons'>
								<button
									className={filter === 'all' ? 'active' : ''}
									onClick={() => setFilter('all')}
								>
									All
								</button>
								<button
									className={filter === 'completed' ? 'active' : ''}
									onClick={() => setFilter('completed')}
								>
									Completed
								</button>
								<button
									className={filter === 'cancelled' ? 'active' : ''}
									onClick={() => setFilter('cancelled')}
								>
									Cancelled
								</button>
							</div>
							{
								filteredOrders.map((data, i) => (
									<OrdersCard
										key={i}
										history
										data={data}
										showDetails={setSideSheetOpen}
										active={activeCardID === data._id.toString()}
										activate={(orderID) => {
											setActiveCardID(orderID);
											setActiveCardData(filteredOrders.find((order) => order._id.toString() === orderID));
										}}
									/>
								))
							}
						</div>
						<div className='details'>
							{!activeCardData
								? <NoContent label='No orders yet' animationName='GhostNoContent' size={200} />
								: <Invoice order={activeCardData} />}
						</div>
					</div>
			}
			<SideSheet title={['Invoice']} open={sideSheetOpen} setOpen={setSideSheetOpen}>
				{
					activeCardData && <Invoice order={activeCardData} />
				}
			</SideSheet>
		</div>
	);
};

export default OrderHistory;

export type TOrderHistoryProps = {
	onScroll: (event: UIEvent<HTMLDivElement>) => void
}
