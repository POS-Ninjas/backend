import { ProductRepository, ProductDetails, ProductResponse } from "../db/repository/product_repo"
import { Database  } from "bun:sqlite"

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

    getAllProducts(db: Database): ProductResponse[] | string {
        const res =  this.repo.get_all_products(db)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsById(db: Database, id: number): ProductResponse | string {
        const res = this.repo.get_single_product(db, id)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    //this returns products but user must filter for a unique product 
    getProductByCode(db: Database, product_code: string): ProductResponse | string {
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

    // what will be the criteria?
    getProductsByCategory(db: Database, category_id: number): ProductResponse[] | string {
        const res = this.repo.get_products_by_category(db, category_id)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsBySupplier(db: Database, supplier_id: number): ProductResponse[] | string {
        // create an SQL view for this: where you get a supplier's products
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

    deleteProduct(db: Database, product_id: number) {
        const res = this.deleteProduct(db, product_id)
    }

}