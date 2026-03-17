import { useState, useEffect } from 'react';

import { Button } from 'xtreme-ui';

import './invoice.scss';

const InvoiceBillItem = (props) => {
	return (<div className='invoiceBillItem'>
		<p className='billName'>{props.name + (props.taxPercent ? ` (${props.taxPercent}%)` : '')}</p>
		<p className='billAmount rupee'>{props.amount}</p>
	</div>);
};

const Invoice = (props: TInvoiceProps) => {
	const [taxList, setTaxList] = useState([]);
	const [orderList, setOrderList] = useState([]);
	const [subTotal, setSubTotal] = useState(0);
	const [grandTotal, setGrandTotal] = useState(0);

	useEffect(() => {
		if (props.order) {
			setOrderList(props.order.products);
			setSubTotal(props.order.total);
			setGrandTotal(props.order.orderTotal);
			setTaxList(props.order.taxes);
		}
	}, [props.order]);

	return (
		<div className='invoiceWrapper'>
			<div className='invoice'>
				<div className='invoiceItems'>
					<h6 className='invoiceItemsHeading'>Your Order Summary</h6>
					<hr />
					<h6 align='left' className='invoiceHeadingDetails'>Invoice Number: <span>{props.order.invoiceNumber}</span></h6>
					<h6 align='left' className='invoiceHeadingDetails'>Customer Name: <span>{props?.order?.customer?.fname} {props?.order?.customer?.lname}</span></h6>
					<h6 align='left' className='invoiceHeadingDetails'>Contact: <span>{props?.order?.customer?.phone}</span></h6>
					<h6 align='left' className='invoiceHeadingDetails'>Order Status: <span style={{ textTransform: 'capitalize' }}>{props?.order?.state}</span></h6>
<hr />
<div className="orderTimeline">
{props.order.createdAt && (
<h6 className="invoiceHeadingDetails">
Order Requested: <span>{new Date(props.order.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
</h6>
)}
{props.order.acceptedAt && (
<h6 className="invoiceHeadingDetails">
Accepted by Restaurant: <span>{new Date(props.order.acceptedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
</h6>
)}
{props.order.completedAt && (
<h6 className="invoiceHeadingDetails">
Order Completed: <span>{new Date(props.order.completedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
</h6>
)}
{props.order.state === 'cancel' && props.order.updatedAt && (
<h6 className="invoiceHeadingDetails">
Order Cancelled: <span>{new Date(props.order.updatedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
</h6>
)}
{props.order.state === 'reject' && props.order.updatedAt && (
<h6 className="invoiceHeadingDetails">
Order Rejected: <span>{new Date(props.order.updatedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
</h6>
)}
</div>
					{
						orderList.map((item, key) => (
							<div className='invoiceItemCard' key={key}>
								<p className='invoiceItemName'>{item.name}</p>
								<div className='invoiceItemPrice'>
									<p className='rupee'>{item.price}<span>✕</span>{item.quantity}</p>
									<p className='rupee'>{item.price * item.quantity}</p>
								</div>
							</div>
						))
					}
				</div>
				<div className='invoiceBill'>
					<InvoiceBillItem name='Sub Total' amount={subTotal} />
					<div className='invoiceTaxes'>
						{
							taxList?.map?.((taxName, key) => {
								return (<InvoiceBillItem key={key} name={taxName.name} taxPercent={taxName.value} amount={taxName.calculatedTax} />);
							})
						}
					</div>
					<InvoiceBillItem name='Grand Total' amount={grandTotal} />
				</div>
			</div>
		</div>
	);
};

export default Invoice;

type TInvoiceProps = {
	order: TOrder
}

type TOrder = {

	// products:
	// total
	// orderTotal
	// taxes
	// invoiceNumber
	// customer
}
