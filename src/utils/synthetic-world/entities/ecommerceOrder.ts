// 8. Ecommerce order — commerce.

import type { EntityDefinition } from '../types';

export const ecommerceOrder: EntityDefinition = {
    id: 'ecommerce-order',
    title: 'Ecommerce Order',
    description: 'A storefront order somewhere in its fulfilment lifecycle.',
    icon: 'shopping-cart',
    strategy: 'deterministic',
    strategyLabel: 'deterministic',
    outputName: 'order',
    modifiers: [
        {
            key: 'product',
            label: 'Product',
            values: ['wireless earbuds', 'a standing desk', 'a cast-iron pan', 'running shoes', 'a mechanical keyboard', 'a yoga mat'],
        },
        {
            key: 'quantity',
            label: 'Quantity',
            values: ['1', '2', '3', '6'],
        },
        {
            key: 'customerType',
            label: 'Customer',
            values: ['first-time', 'returning', 'VIP', 'wholesale'],
        },
        {
            key: 'shippingSpeed',
            label: 'Shipping',
            values: ['standard', 'expedited', 'next-day', 'in-store pickup'],
        },
        {
            key: 'orderState',
            label: 'Order state',
            values: ['placed', 'packed', 'shipped', 'delivered', 'returned', 'refunded', 'cancelled'],
        },
        {
            key: 'paymentMethod',
            label: 'Payment',
            values: ['credit card', 'PayPal', 'Apple Pay', 'gift card', 'buy-now-pay-later'],
        },
        {
            key: 'discount',
            label: 'Discount',
            values: [', no discount', ', with a 10% coupon', ', with free shipping', ', on clearance'],
        },
    ],
    buildTrace: () => [
        { kind: 'comment', text: '# an order is rows in a table — assembled, not written' },
        { kind: 'code', text: 'order = build.order(decisions)' },
    ],
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            orderId: `#${(m.product.length * 811 + m.quantity.length).toString().padStart(6, '0')}`,
            item: `${m.quantity}x ${m.product}`,
            customer: m.customerType,
            shipping: m.shippingSpeed,
            payment: m.paymentMethod,
            discount: m.discount.replace(/^,\s*/, '') || 'none',
            status: m.orderState,
        },
    }),
};
