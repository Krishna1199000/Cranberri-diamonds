import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { diamonds } = await request.json()
    
    // Transform data for Excel
    const excelData = diamonds.map((diamond: any) => ({
      'Stock ID': diamond.stockId,
      'Certificate No': diamond.certificateNo,
      'Shape': diamond.shape,
      'Carat': diamond.size,
      'Color': diamond.color,
      'Clarity': diamond.clarity,
      'Cut': diamond.cut,
      'Polish': diamond.polish,
      'Symmetry': diamond.sym,
      'Fluorescence': diamond.floro,
      'Lab': diamond.lab,
      'Measurements': diamond.measurement,
      'Table %': diamond.table,
      'Depth %': diamond.depth,
      'Ratio': diamond.ratio,
      'Rap Price': diamond.rapPrice,
      'Rap Amount': diamond.rapAmount,
      'Discount %': diamond.discount,
      'Price/Ct': diamond.pricePerCarat,
      'Amount': diamond.finalAmount,
      'Location': diamond.location
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Diamonds')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return the Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="diamonds.xlsx"'
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export diamonds' }, { status: 500 })
  }
}