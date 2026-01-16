import { Hono } from 'hono'
import { db } from '../db_service'
import { authMiddleware } from '../middleware/authenticate'
import { ProductDetails } from '../db/repository/product_repo'
import { logger as pinologger } from '../logger'

const product_services = db.product_service()
const products = new Hono()

// use middleware
// products.use("*", authMiddleware)

products
    .get("/products/all", async (c) => {
        const allproducts = product_services.getAllProducts(db.database)
        pinologger.info("matched /products/all")
        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products/active", async (c) => {
        pinologger.info("matched /products/active")

        const allproducts = product_services.getActiveProducts(db.database)

        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products/create", async (c) => {
        pinologger.info("matched /products/create")
        const product_details = await c.req.json()
        const allproducts = product_services.getAllProducts(db.database)
        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products/:id", async (c) => {
        pinologger.info("matched /products/:id")
        const id = c.req.param('id') as unknown as number
        const product = product_services.getProductsById(db.database, id)

        if (product == null){
            return c.json({
                success: false,
                error: `product with ${id} not found`,
                timestamp: new Date().toISOString()
            })
        } else {

            return c.json({
                success: true,
                data: product,
                timestamp: new Date().toISOString()
            })
        }
    })

products
    .get("/products/update/:id", async (c) => {
        pinologger.info("matched /products/update/:id")
        const id = c.req.param('id') as unknown as number
        const updated_details = await c.req.json() as ProductDetails
        const product = product_services.updateProduct(db.database, id, updated_details)

        if (product == null){
            return c.json({
                success: false,
                error: `product with ${id} not found`,
                timestamp: new Date().toISOString()
            })
        } else {

            return c.json({
                success: true,
                data: product,
                timestamp: new Date().toISOString()
            })
        }
    })

products
    .get("/products", async (c) => {
        const product_code = c.req.query('code') as string
        const bar_code     = c.req.query('barcode') as string
        const category     = c.req.query('category') as string 
        const supplier     = c.req.query('supplier') as string

        if (product_code == ''){
            return c.json({
                success: false,
                error: "please enter the product code",
                timestamp: new Date().toISOString()
            })
        } else if (bar_code == ''){
            return c.json({
                success: false,
                error: "please enter the bar code",
                timestamp: new Date().toISOString()
            })
        } else if (category == ''){
            return c.json({
                success: false,
                error: "please enter the category",
                timestamp: new Date().toISOString()
            })
        }  else if (supplier == ''){
            return c.json({
                success: false,
                error: "please enter the supplier name",
                timestamp: new Date().toISOString()
            })
        }

        if (product_code) {
            pinologger.info("matched /products?code=12")
            const product = product_services.getProductByCode(db.database, product_code)

            if (product == null){
                return c.json({
                    success: false,
                    error: `product with code ${product_code} not found`,
                    timestamp: new Date().toISOString()
                })
            }

            return c.json({
                success: true,
                data: product,
                timestamp: new Date().toISOString()
            })
        }
        
        if (bar_code) {
            pinologger.info("matched /products?barcode=23")
            const bar_code = c.req.query('barcode') as string
            const products = product_services.getProductsByBarCode(db.database, bar_code)

            return c.json({
                success: true,
                data: products,
                timestamp: new Date().toISOString()
            })
        }
        
        if (category) {
            pinologger.info("matched /products?category=cat_id") // #Ask do i construct the url by category name, get the id or just use the category_id
            const category = c.req.query('category') as unknown as number
            const allproducts = product_services.getProductsByCategory(db.database, category)
            return c.json({
                success: true,
                data: allproducts,
                timestamp: new Date().toISOString()
            })
        }

        if (supplier) {
            pinologger.info("matched /products?supplier=") // #Ask do i construct the url by category name, get the id or just use the category_id
            const supplier = c.req.query('supplier') as unknown as number
            pinologger.info(category)
            const allproducts = product_services.getProductsBySupplier(db.database, supplier)
            return c.json({
                success: true,
                data: allproducts,
                timestamp: new Date().toISOString()
            })
        }
    })

products
    .get("/products/delete/:id", async (c) => {
        pinologger.info("matched /products/delete?name=something")
        const id = c.req.param('id') as unknown as number

        const res = product_services.deleteProduct(db.database, id)

        return c.json({
            success: true,
            timestamp: new Date().toISOString()
        })
    })

export default products