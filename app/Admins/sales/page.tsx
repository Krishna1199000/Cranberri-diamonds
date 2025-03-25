"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AdminSalesPage() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [period, setPeriod] = useState('7');
  const [salesData, setSalesData] = useState<{ 
    id: string; 
    date: string; 
    profit: number; 
    sale: number; 
    employeeName: string; 
    carat?: number; 
    color?: string; 
    clarity?: string; 
    cut?: string; 
    totalSaleValue?: number; 
    totalProfit?: number; 
  }[]>([]);
  const [editingEntry, setEditingEntry] = useState<{
    id: string;
    date: string;
    profit: number;
    sale: number;
    employeeName: string;
    carat?: number;
    color?: string;
    clarity?: string;
    cut?: string;
    totalSaleValue?: number;
    totalProfit?: number;
  } | null>(null);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await fetch(`/api/sales?period=${period}&employeeId=${selectedEmployee}`);
      const data = await response.json();
      if (data.success) {
        const formattedData = data.entries.map(entry => ({
          id: entry.id,
          date: new Date(entry.createdAt).toLocaleDateString(),
          profit: entry.totalProfit,
          sale: entry.totalSaleValue,
          employeeName: entry.employee.name,
          ...entry
        }));
        setSalesData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee || period) {
      fetchSalesData();
    }
  }, [selectedEmployee, period]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch('/api/sales', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchSalesData();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sales', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingEntry)
      });

      if (response.ok) {
        setEditingEntry(null);
        fetchSalesData();
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        <div className="flex gap-4">
          <Select value={selectedEmployee} onValueChange={(value) => setSelectedEmployee(value)}>
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </Select>
          <Select value={period} onValueChange={(value) => setPeriod(value)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </Select>
        </div>
      </div>

      <Card className="p-6 mb-8">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                name="Profit"
              />
              <Line
                type="monotone"
                dataKey="sale"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                name="Sale"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salesData.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.employeeName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.carat}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.color} / {entry.clarity} / {entry.cut}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${entry.totalSaleValue}</td>
                <td className="px-6 py-4 whitespace-nowrap">${entry.totalProfit}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => setEditingEntry(entry)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Carat</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingEntry.carat}
                  onChange={(e) => setEditingEntry({...editingEntry, carat: parseFloat(e.target.value)})}
                />
              </div>
              
              {/* Add similar fields for color, clarity, cut, etc. */}
              
              <div>
                <label className="block text-sm font-medium mb-1">Total Sale Value</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingEntry.totalSaleValue}
                  onChange={(e) => setEditingEntry({...editingEntry, totalSaleValue: parseFloat(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Total Profit</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingEntry.totalProfit}
                  onChange={(e) => setEditingEntry({...editingEntry, totalProfit: parseFloat(e.target.value)})}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}