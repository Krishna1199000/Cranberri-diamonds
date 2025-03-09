
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const { diamonds } = await request.json()
    
    // Transform data for Excel
    interface Diamond {
      stockId: string;
      certificateNo: string;
      shape: string;
      size: number;
      color: string;
      clarity: string;
      cut: string;
      polish: string;
      sym: string;
      floro: string;
      lab: string;
      measurement: string;
      table: number;
      depth: number;
      ratio: number;
      rapPrice: number;
      rapAmount: number;
      discount: number;
      pricePerCarat: number;
      finalAmount: number;
      location: string;
    }

    const excelData = diamonds.map((diamond: Diamond) => ({
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