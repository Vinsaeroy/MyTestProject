export interface Product {
    id: string;
    name: string;
    price: number;
    desc: string;
    snk: string;
    account: string[];
}

export interface Products {
    [key: string]: Product;
}

export interface ProductView {
    id: string[];
}

export interface ProductViews {
    [key: string]: ProductView;
}

export interface Transaction {
    reffId: string;
    productId: string;
    productName: string;
    userId: string;
    quantity: number;
    totalAmount: number;
    status: 'completed' | 'pending';
    paymentMethod: string;
    createdAt: string;
    accountData?: string[];
}

export interface User {
    id: string;
    name: string;
    role: string;
    balance: number;
    username?: string;
}

export interface Stats {
    totalPcs: number;
    totalPendapatan: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface BotData {
    product: Products;
    product_view: ProductViews;
}
