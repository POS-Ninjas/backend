import { Product } from "../models";
import { Database  } from "bun:sqlite"
import { logger } from "../../logger"


export type ProductDetails  = Omit<Product, "product_id" | "created_at" | "updated_at">
export type ProductResponse = Omit<Product, "deleted_at">

type RecordId = number
type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

interface ProductRepo {
    createProduct(db: Database, product_details: ProductDetails): RecordId | { error: string }
    update_product(db: Database, product_id: number, updated_details: Partial<ProductDetails>): boolean
    get_products_by_code(db: Database, product_code: string): DbResult<Array<ProductResponse>> 
    get_products_by_barcode(db: Database, barcode: string): DbResult<Array<ProductResponse>> 
    get_products_by_category(db: Database, category_id: number): DbResult<Array<ProductResponse>> 
    get_products_by_supplier(db: Database, supplier_id: number): DbResult<Array<ProductResponse>> 
    get_active_products(db: Database): DbResult<Array<ProductResponse>>
    get_all_products(db: Database): DbResult<Array<ProductResponse>> 
    delete_all_products(db: Database): void 
    delete_product(db: Database, product_name: string): void //are there gonna be other deletes too? hard or soft delete 
}

export class ProductRepository implements ProductRepo {

    get_products_by_code(db: Database, product_code: string): DbResult<Array<ProductResponse>>  {
       const products = db.query("SELECT * FROM products where product_code= ?").all(product_code) as ProductResponse[]
       return { success: true, data: products }
    }

    get_products_by_barcode(db: Database, barcode: string): DbResult<Array<ProductResponse>>  {
       const products = db.query("SELECT * FROM products where barcode = ?").all(barcode) as ProductResponse[]
       return { success: true, data: products }
    }

    get_products_by_category(db: Database, category_id: number): DbResult<Array<ProductResponse>> {
       const products = db.query("SELECT * FROM products where category_id = ?").all(category_id) as ProductResponse[]
       return { success: true, data: products }
    }

    get_products_by_supplier(db: Database, supplier_id: number): DbResult<Array<ProductResponse>>  {
       const products = db.query("SELECT * FROM products where supplier_id = ?").all(supplier_id) as ProductResponse[]
       return { success: true, data: products }
    }

    get_active_products(db: Database): DbResult<Array<ProductResponse>> {
       const products = db.query("SELECT * FROM products where is_active = ?").all(true) as ProductResponse[]
       return { success: true, data: products }
    }
    
    createProduct(db: Database, product_details: ProductDetails): RecordId | { error: string } {
        const queryString = `
            INSERT INTO products (
                product_name, product_code,
                barcode, category_id, supplier_id, image_url,
                description, unit_purchase_price, unit_selling_price,
                current_stock, reorder_level, product_type,
                tax_rate, is_taxable, is_tax_inclusive,
                is_active, deleted_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        try {
            const query = db.query(queryString);
            
            const res = query.run(
                product_details.product_name,
                product_details.product_code,
                product_details.barcode,
                product_details.category_id,
                product_details.supplier_id,
                product_details.image_url,
                product_details.description,
                product_details.unit_purchase_price,
                product_details.unit_selling_price,
                product_details.current_stock,
                product_details.reorder_level,
                product_details.product_type,
                product_details.tax_rate,
                product_details.is_taxable,
                product_details.is_tax_inclusive,
                product_details.is_active,
                null
            );
            
            logger.info("successfully created product :" + product_details.product_name);
            return res.lastInsertRowid as number;
            
        } catch (error: any) {
            
            logger.error("Database error inserting product: ", error);
            return { error: "Failed to create product" };
        }
    
    }

    get_single_product(db: Database, product_id: number): DbResult<ProductResponse> { // is this necessary ?
       const products = db.query("SELECT * FROM products where product_id = ?").get(product_id) as ProductResponse
       return { success: true, data: products }
    }

    get_all_products(db: Database): DbResult<Array<ProductResponse>> {
       const products = db.query("SELECT * FROM products").all() as ProductResponse[]
       return { success: true, data: products }
    }

    delete_all_products(db: Database): void {
        throw new Error("Method not implemented.");
    }

    delete_product(db: Database, product_name: string): void {
       const query = db.query("DELETE * FROM products WHERE product_name = ?")
       query.run(product_name)
    }

    update_product(db: Database, product_id: RecordId, updated_details: Partial<ProductDetails>): boolean {
        const { query, values } = buildUpdateQuery('products', updated_details, { product_id })
        
        if (!query) return false 
        
        const stmt = db.query(query)
        const res = stmt.run(...values)
        
        return res.changes > 0
    }

}

export function buildUpdateQuery(
        table: string, 
        updates: Record<string, any>, 
        where: Record<string, any>
    ) {
        const updateFields: string[] = []
        const values: any[] = []
        
        // Add all provided fields
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                updateFields.push(`${key} = ?`)
                values.push(value)
            }
        })
        
        if (updateFields.length === 0) {
            return { query: null, values: [] }
        }
        
        // Always update timestamp
        updateFields.push("updated_at = datetime('now')")
        
        // Build WHERE clause
        const whereFields = Object.keys(where).map(key => `${key} = ?`)
        const whereValues = Object.values(where)
        
        const query = `
            UPDATE ${table}
            SET ${updateFields.join(", ")}
            WHERE ${whereFields.join(" AND ")}
        `
        return { query, values: [...values, ...whereValues] }
    }