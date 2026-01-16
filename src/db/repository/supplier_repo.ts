import { Supplier } from "../models";
import { Database } from "bun:sqlite";
import { logger } from "../../logger";
import { buildUpdateQuery } from "./product_repo";

export type SupplierDetails = Omit<Supplier, "supplier_id" | "created_at" | "updated_at"> 
export type RecordId = number
type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

interface SupplierRepo {

    create_supplier(db: Database, supplier_details: SupplierDetails): RecordId | { error: string }
    update_supplier(db: Database, supplier_id: number, updated_details: Partial<SupplierDetails>): boolean
    get_suppliers_by_company_name(db: Database, company_name: string): DbResult<Array<Supplier>> 
    get_suppliers_by_phone(db: Database, phone: number): DbResult<Array<Supplier>> 
    get_suppliers_by_tin(db: Database, tin: number): DbResult<Array<Supplier>> 
    get_active_suppliers(db: Database): DbResult<Array<Supplier>>
    get_all_suppliers(db: Database): DbResult<Array<Supplier>>
    delete_supplier(db: Database, id: number): void

}

export class SupplierRepository implements SupplierRepo {
    create_supplier(db: Database, supplier_details: SupplierDetails): RecordId | { error: string; } {
        const queryString = `
            INSERT INTO suppliers (
                company_name, contact_name, email, 
                phone_number, tin, address, is_active
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        try {
            const query = db.query(queryString);
            
            const res = query.run(
                supplier_details.company_name,
                supplier_details.contact_name,
                supplier_details.email,
                supplier_details.phone_number,
                supplier_details.tin,
                supplier_details.address,
                supplier_details.is_active,
            );
            
            logger.info("successfully created supplier :" + supplier_details.company_name);
            return res.lastInsertRowid as number;
            
        } catch (error: any) {
            
            logger.error("Database error inserting supplier: ", error);
            return { error: "Failed to create suuplier" };
        }
    }

    update_supplier(db: Database, supplier_id: number, updated_details: Partial<SupplierDetails>): boolean {
        const { query, values } = buildUpdateQuery('suppliers', updated_details, { supplier_id })

        if (!query) return false 
        
        const stmt = db.query(query)
        const res = stmt.run(...values)
        
        return res.changes > 0
    }

    get_suppliers_by_company_name(db: Database, company_name: string): DbResult<Array<Supplier>> {
        const suppliers = db.query("SELECT * FROM suppliers where company_name = ?").all(company_name) as Supplier[]
        return { success: true, data: suppliers }
    }

    get_suppliers_by_phone(db: Database, phone_number: number): DbResult<Array<Supplier>> {
        const suppliers = db.query("SELECT * FROM suppliers where phone_name = ?").all(phone_number) as Supplier[]
        return { success: true, data: suppliers }
    }

    get_suppliers_by_tin(db: Database, tin: number): DbResult<Array<Supplier>> {
        const suppliers = db.query("SELECT * FROM suppliers where tin = ?").all(tin) as Supplier[]
        return { success: true, data: suppliers }
    }

    get_active_suppliers(db: Database): DbResult<Array<Supplier>> {
        const suppliers = db.query("SELECT * FROM suppliers where is_active = ?").all(true) as Supplier[]
        return { success: true, data: suppliers }
    }

    get_all_suppliers(db: Database): DbResult<Array<Supplier>> {
        const suppliers = db.query("SELECT * FROM suppliers").all() as Supplier[]
        return { success: true, data: suppliers }
    }

    // use id or name ?
    delete_supplier(db: Database, id: number): void {
       const query = db.query("DELETE * FROM products WHERE id = ?")
       query.run(id)
    }

}