import { Category } from "../models";
import { Database  } from "bun:sqlite"
import { logger } from "../../logger"
import { buildUpdateQuery } from "./product_repo";


type RecordId = number
type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

interface CategoryRepo {
    insert_category(db: Database, category_details: Category): RecordId | { error: string }
    get_category(db: Database, id: RecordId): DbResult<Category>
    get_all_category(db: Database): DbResult<Array<Category>>
    update_category(db: Database, category_id: RecordId, category_details: Category): boolean
    delete_category(db: Database, category_id: number): void
}

class CategoryRepository implements CategoryRepo {

    insert_category(db: Database, category_details: Category): RecordId | { error: string; } {
        const queryString = `
            INSERT INTO categories (
                category_name,
                category_code,
                description
            )
            VALUES (?, ?, ?)
        `
        try {
            const query = db.query(queryString)

            const res = query.run(
                category_details.category_name,
                category_details.category_code,
                category_details.description
            );

            logger.info("successfully created product :" + category_details.category_name);
            return res.lastInsertRowid as number;

        } catch (error: any) {

            logger.error("Database error inserting category: ", error);
            return { error: "Failed to create category" };
        }
    }

    get_category(db: Database, category_id: RecordId): DbResult<Category> {
        const products = db.query("SELECT * FROM categories where category_id = ?").get(category_id) as Category
        return { success: true, data: products }
    }
    
    get_all_category(db: Database): DbResult<Array<Category>> {
        const categories = db.query("SELECT * FROM categories").all() as Category[]
        return { success: true, data: categories }
    }

    update_category(db: Database, category_id: RecordId, category_details: Category): boolean {
        const { query, values } = buildUpdateQuery('categories', category_details, { category_id })
        
        if (!query) return false
        
        const stmt = db.query(query)
        const res = stmt.run(...values)
        
        return res.changes > 0
    }

    delete_category(db: Database, category_id: number): void {
        db.query("DELETE FROM categories where category_id = ?").run(category_id)
    }
    
}