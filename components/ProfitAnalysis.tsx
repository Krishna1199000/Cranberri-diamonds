"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calculator, ArrowRight} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { SaleEntry } from "@/types/sales"

interface ProfitAnalysisProps {
  salesData: SaleEntry[]
  purchaseValue: string
  setPurchaseValue: (value: string) => void
  profitAnalysis: {
    totalSales: number
    totalPurchase: number
    totalProfit: number
    profitMargin: number
    entriesWithProfit: number
    entriesWithLoss: number
  }
  showProfitAnalysis: boolean
  setShowProfitAnalysis: (show: boolean) => void
  calculateProfit: () => void
  calculateAllEntryProfits: () => void
}

export default function ProfitAnalysis({
  salesData,
  purchaseValue,
  setPurchaseValue,
  profitAnalysis,
  showProfitAnalysis,
  calculateProfit,
  calculateAllEntryProfits,
}: ProfitAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overall' | 'entries'>('overall');

  const getProfitDistributionData = () => {
    if (activeTab === 'overall') {
      return [
        { name: 'Sales', value: profitAnalysis.totalSales, color: '#1d4ed8' },
        { name: 'Purchase', value: profitAnalysis.totalPurchase, color: '#7e22ce' },
      ];
    } else {
      return [
        { name: 'Profitable Items', value: profitAnalysis.entriesWithProfit, color: '#16a34a' },
        { name: 'Loss-making Items', value: profitAnalysis.entriesWithLoss, color: '#dc2626' },
        { name: 'Neutral/Unknown', value: salesData.filter(item => !item.isNoSale && (item.profit === null || item.profit === undefined)).length, color: '#9ca3af' },
      ];
    }
  };

  const chartData = getProfitDistributionData();

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Profit Analysis</h2>
        <span className="p-2 bg-amber-100 rounded-full">
          <Calculator className="h-5 w-5 text-amber-600" />
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overall' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Overall Analysis
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'entries' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Entry-based Analysis
          </button>
        </div>
      
        {activeTab === 'overall' ? (
          <div>
            <label className="block text-sm font-medium mb-1">Total Purchase Value</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                placeholder="Enter total purchase value"
                className="w-full"
              />
              <Button onClick={calculateProfit}>Calculate</Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-2">
              Calculate profit for each entry based on individual purchase values
            </p>
            <Button 
              onClick={calculateAllEntryProfits}
              className="w-full"
              variant="outline"
            >
              Generate All Profits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Only entries with purchase values will be calculated
            </p>
          </div>
        )}
        
        {showProfitAnalysis && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales Value</p>
                <p className="text-xl font-bold">{formatCurrency(profitAnalysis.totalSales)}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'overall' ? 'Purchase Value' : 'Total Purchase Cost'}
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(profitAnalysis.totalPurchase)}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Profit</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(profitAnalysis.totalProfit)}
              </p>
              <div className="mt-2 flex items-center">
                <div 
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    profitAnalysis.profitMargin >= 0 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {profitAnalysis.profitMargin.toFixed(2)}% margin
                </div>
                {activeTab === 'entries' && (
                  <div className="ml-2 text-sm text-gray-500">
                    ({profitAnalysis.entriesWithProfit} profitable / {profitAnalysis.entriesWithLoss} loss-making)
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-[180px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      activeTab === 'overall' ? formatCurrency(value as number) : value, 
                      name
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {profitAnalysis.totalProfit > 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-800 dark:text-green-300 text-sm">
                {activeTab === 'overall' ? (
                  <>This period shows a healthy profit margin of {profitAnalysis.profitMargin.toFixed(2)}%.</>
                ) : (
                  <>
                    Analysis shows {profitAnalysis.entriesWithProfit} profitable entries with an overall margin of {profitAnalysis.profitMargin.toFixed(2)}%.
                  </>
                )}
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-800 dark:text-red-300 text-sm">
                {activeTab === 'overall' ? (
                  <>This period shows a loss of {formatCurrency(Math.abs(profitAnalysis.totalProfit))}.</>
                ) : (
                  <>
                    Analysis shows more loss-making entries ({profitAnalysis.entriesWithLoss}) than profitable ones ({profitAnalysis.entriesWithProfit}).
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}