import { ProductRepository, ProductDetails, ProductResponse } from "../repository/product_repo"
import { Database  } from "bun:sqlite"
import { Product } from "../models"


// what kind of details need for the list view
type ProductDetailsForListView = {

}

// DONE
export class ProductService  { 

    private repo: ProductRepository

    constructor(){
        this.repo = new ProductRepository()
    }

    // services 
    createProduct(db: Database, productDetails: ProductDetails): number | string {
        const res = this.repo.createProduct(db, productDetails)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getAllProducts(db: Database){
        const res =  this.repo.get_all_products(db)
        if (res.success == true){
            return res
        } else {
            return res.error
        }
    }

    //this returns products but user must filter for a unique product 
    getProductsByCode(db: Database, product_code: string): ProductResponse[] | string {
        const res = this.repo.get_products_by_code(db, product_code)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsByBarCode(db: Database, bar_code: string): ProductResponse[] | string {
        const res = this.repo.get_products_by_barcode(db, bar_code)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsByCategory(db: Database, category: string): ProductResponse[] | string {
        // create an SQL view for this: where you get products by category 
        const category_id = 1
        const res = this.repo.get_products_by_category(db, category_id)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }

    }

    getProductsBySupplier(db: Database, supplier_name: string): ProductResponse[] | string {
        // create an SQL view for this: where you get a supplier's products
        const supplier_id = 1
        const res = this.repo.get_products_by_supplier(db, supplier_id)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }

    }

    getActiveProducts(db: Database): ProductResponse[] | string {
        const res = this.repo.get_active_products(db)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    updateProduct(
        db: Database, 
        product_id: number, 
        updated_details: Partial<ProductDetails>
    ){
        const res = this.repo.update_product(db, product_id, updated_details)
        return res
    }

    deleteProduct(db: Database) {

    }

}