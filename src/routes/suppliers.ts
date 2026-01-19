import { Hono } from 'hono'
import { db } from '../db_service'
import { authMiddleware } from '../middleware/authenticate'
import { logger as pinologger } from '../logger'

const supplier_services = db.supplier_service()
const suppliers = new Hono()

suppliers
    .get("/suppliers/all", async (c) => {
        const response = supplier_services.getAllSuppliers(db.database)
        pinologger.info("matched /suppliers/all")

        if (typeof(response) == 'string'){
            return c.json({
                success: false,
                error: response,
                timestamp: new Date().toISOString()
            })
        } else {
            return c.json({
                success: true,
                data: response,
                timestamp: new Date().toISOString()
            })
        }
    })

suppliers
    .get("/suppliers/active", async (c) => {
        const response = supplier_services.getActiveSuppliers(db.database)
        pinologger.info("matched /suppliers/active")
        if (typeof(response) == 'string'){
            return c.json({
                success: false,
                error: response,
                timestamp: new Date().toISOString()
            })
        } else {
            return c.json({
                success: true,
                data: response,
                timestamp: new Date().toISOString()
            })
        }
    })

suppliers
    .get("/suppliers", async (c) => {
        const tin      = c.req.query('tin') as string
        const phone    = c.req.query('phone') as string
        const company  = c.req.query('company') as string

        if (tin == ''){
            return c.json({
                success: false,
                error: "please enter the tax identification number",
                timestamp: new Date().toISOString()
            })
        } else if (phone == ''){
            return c.json({
                success: false,
                error: "please enter the supplier's phone",
                timestamp: new Date().toISOString()
            })
        } else if (company == ''){
            return c.json({
                success: false,
                error: "please enter the company's name",
                timestamp: new Date().toISOString()
            })
        }

        if (tin) {
            pinologger.info("matched /suppliers?tin=23")
            const tin = c.req.query('tin') as unknown as number
            const response = supplier_services.getSuppliersByTin(db.database, tin)

            if (typeof(response) == 'string'){
                return c.json({
                    success: false,
                    error: response,
                    timestamp: new Date().toISOString()
                })
            } else {
                return c.json({
                    success: true,
                    data: response,
                    timestamp: new Date().toISOString()
                })
            }
        }

        if (phone) {
            pinologger.info("matched /suppliers?phone=23")
            const phone = c.req.query('phone') as unknown as number
            const response = supplier_services.getSuppliersByPhone(db.database, phone)

            if (typeof(response) == 'string'){
                return c.json({
                    success: false,
                    error: response,
                    timestamp: new Date().toISOString()
                })
            } else {
                return c.json({
                    success: true,
                    data: response,
                    timestamp: new Date().toISOString()
                })
            }
        }

        if (company) {
            pinologger.info("matched /suppliers?company=23")
            const company = c.req.query('company') as string
            const response = supplier_services.getSuppliersByCompanyName(db.database, company)

            if (typeof(response) == 'string'){
                return c.json({
                    success: false,
                    error: response,
                    timestamp: new Date().toISOString()
                })
            } else {
                return c.json({
                    success: true,
                    data: response,
                    timestamp: new Date().toISOString()
                })
            }
        }

    })

suppliers
    .patch("/suppliers/update", async (c) => {
        
    })

suppliers
    .delete("/suppliers/delete/:id", async (c) => {
        pinologger.info("matched /suppliers/delete/:id")
        const id = c.req.param('id') as unknown as number

        const res = supplier_services.deleteSupplier(db.database, id)

        return c.json({
            success: true,
            timestamp: new Date().toISOString()
        })
    })

export default suppliers