"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Package } from "lucide-react"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { getStocks, deleteStock, searchStocks } from "@/lib/api"
import type { Stock } from "@/lib/types"

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Load stocks from Java backend
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const data = await getStocks()
        setStocks(data)
        setFilteredStocks(data)
      } catch (error) {
        console.error("Failed to load stocks:", error)
        alert("Failed to load stocks. Make sure Java backend is running on port 8080")
      } finally {
        setLoading(false)
      }
    }
    loadStocks()
  }, [])

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredStocks(stocks)
    } else {
      try {
        const results = await searchStocks(query)
        setFilteredStocks(results)
      } catch (error) {
        console.error("Search failed:", error)
        setFilteredStocks([])
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this stock?")) return
    try {
      await deleteStock(id)
      setStocks(stocks.filter((s) => s.id !== id))
      setFilteredStocks(filteredStocks.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Failed to delete stock:", error)
      alert("Failed to delete stock")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading stocks...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Stock Management" }]}
        title="Stock Management"
        description="Manage your tiles and sanitary inventory"
        action={
          <Button asChild>
            <Link href="/stocks/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Link>
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Stock Items</CardTitle>
                <CardDescription>Manage your tiles and sanitary inventory</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by design name..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Design Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Initial</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.designName}</TableCell>
                      <TableCell>{stock.type}</TableCell>
                      <TableCell>{stock.size}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">{stock.noOfBoxes}</TableCell>
                      <TableCell className="text-right">₹{stock.price}</TableCell>
                      <TableCell className="text-right">
                        ₹{(stock.noOfBoxes * stock.price).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {stock.noOfBoxes < 10 ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : stock.noOfBoxes < 30 ? (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Medium
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(stock.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-6 flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Total Stock Value:</span>
              </div>
              <span className="text-lg font-bold">
                ₹{stocks.reduce((acc, stock) => acc + stock.noOfBoxes * stock.price, 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
