type User = {
    user_id: number
    username: string
    password_hash: string
    first_name: string
    last_name: string
    email: string 
    role_name: string
    is_active: boolean
    last_login: Date | null
    created_at: Date | null
    updated_at: Date | null
}

type Role = {
    role_id: number
    role_name: string
    role_description: string | null
    permissions: string | null
    created_at: Date
    updated_at: Date
}

type PasswordReset = {
    reset_id: number
    user_id: number
    email: string
    token: string
    expires_at: number
    created_at: Date
    used_at: Date
}

type PasswordResetRequestForm = {
    user_id: number
    email: string
    token: string
}

type Client = {
    client_id: number
    first_name: string
    last_name: string
    phone_number: string
    email: string
    tin: string
    client_type: string
    business_name: string | null
    business_address: string | null
    business_type: string
    is_active: boolean
    created_at: Date
    updated_at: Date
    deleted_at: Date
}

type Category = {
    category_id: number
    category_name: string
    category_code: string | null
    description: string
    created_at: Date
    updated_at: Date
}

type Supplier = {
    supplier_id: number
    company_name: string
    contact_name: string
    email: string
    phone_number: string
    tin: string
    address: string
    is_active: boolean
    created_at: Date
    updated_at: Date
}

type Product = {
    product_id: number
    product_name: string 
    product_code: string | null
    barcode: string | null
    category_id: number | null
    supplier_id: number | null
    image_url: string | null
    description: string | null
    unit_purchase_price: string
    unit_selling_price: string
    current_stock: number
    reorder_level: number
    product_type: string
    tax_rate: number
    is_taxable: boolean
    is_tax_inclusive: boolean
    is_active: boolean
    created_at: Date
    updated_at: Date
    deleted_at: Date
}

type Sale = {
    sale_id: number
    invoice_number: string 
    sale_date: string
    client_id: number
    biller_id: number
    subtotal: number
    discount_amount: number
    tax_amount: number
    grand_total: number
    amount_paid: number
    change_given: number
    sale_status: string
    payment_method: string
    momo_reference: string
    notes: string
    created_at: Date
    updated_at: Date
}

type Sale_Item = {
    sale_item_id: number
    sale_id: number
    product_id: number
    quantity: number
    unit_price: string
    discount_amount: string
    tax_rate: string
    tax_amount: string
    subtotal: string
    line_total: string
    created_at: Date
    updated_at: Date
}

type Purchase = {
    sale_item_id: number
    sale_id: number
    product_id: number
    quantity: number
    unit_price: string
    discount_amount: string
    tax_rate: string
    tax_amount: string
    subtotal: string
    line_total: string
    created_at: Date
    updated_at: Date
}

type Purchase_Items = {
    purchase_item_id: number
    purchase_id: number
    product_id: number
    quantity: number
    unit_cost: number
    subtotal: number
    created_at: Date
}

type Payment = {
    payment_id: number
    payment_date: string
    transaction_type: string
    reference_id: number
    amount: number
    payment_method: string
    payment_reference: string
    momo_provider: string
    momo_number: string
    notes: string
    processed_by: string
    created_at: string
}

type Audit_Log = {
    audit_id: number
    user_id: number
    action: string
    description: string
    table_name: string
    created_at: string
}

type Report = {
    report_id: number
    report_type: string
    report_title: string
    generated_by: number
    start_datinge: string
    end_date: string
    filters: string
    file_format: string
    status: string
    created_at: string
}

export {
    User, Role, Client, Supplier, 
    Product, Sale, Sale_Item,
    Purchase_Items, Purchase,
    Payment, Report, Audit_Log,
    Category, PasswordReset, PasswordResetRequestForm
}