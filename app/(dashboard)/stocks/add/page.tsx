"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, Plus, Download, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { useCategory } from "@/context/CategoryContext"
import { createStock, uploadStockExcel } from "@/lib/services/stocks"

export default function AddStockPage() {
  const router = useRouter()
  const { selectedCategory, selectedCategoryId } = useCategory()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    designName: "",
    type: "",
    size: "",
    totalBoxes: "",
    pricePerBox: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!formData.designName.trim()) {
      setError("Design name is required")
      return
    }
    if (!formData.type.trim()) {
      setError("Type is required")
      return
    }
    if (!formData.size.trim()) {
      setError("Size is required")
      return
    }
    if (!formData.totalBoxes || Number(formData.totalBoxes) <= 0) {
      setError("Number of boxes must be greater than 0")
      return
    }
    if (!formData.pricePerBox || Number(formData.pricePerBox) <= 0) {
      setError("Price per box must be greater than 0")
      return
    }

    setLoading(true)

    try {
      const stockData = {
        designName: formData.designName.trim(),
        type: formData.type.trim(),
        size: formData.size.trim(),
        totalBoxes: Number(formData.totalBoxes),
        pricePerBox: Number(formData.pricePerBox),
        categoryId: selectedCategoryId,
      }

      await createStock(stockData)
      setSuccess(`✅ Stock "${formData.designName}" added successfully!`)

      // Reset form
      setFormData({
        designName: "",
        type: "",
        size: "",
        totalBoxes: "",
        pricePerBox: "",
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/stocks")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stock")
    } finally {
      setLoading(false)
    }
  }

  const handleExcelUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await uploadStockExcel(file, selectedCategoryId)
      setSuccess("✅ Excel file uploaded successfully!")
      setFile(null)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/stocks")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload Excel file")
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = "design_name,type,size,total_boxes,price_per_box\n"
      + "Premium Marble Tile,Ceramic,12x12,150,250.00\n"
      + "Granite Tile,Natural Stone,18x18,100,450.00\n"
      + "Porcelain White,Porcelain,24x24,200,350.00"

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock-template-${selectedCategory}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <NavigationHeader
        items={[{ label: "Stock Management", href: "/stocks" }, { label: "Add New Stock" }]}
        title="Add New Stock"
        description="Add inventory using manual entry or Excel upload"
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Manual Entry</TabsTrigger>
            <TabsTrigger value="excel">Excel Upload</TabsTrigger>
          </TabsList>

          {/* Manual Form Entry */}
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>Add Stock Manually</CardTitle>
                <CardDescription>Enter stock details using the form below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Alert Messages */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Display Selected Category */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-muted-foreground">Adding Stock for Category:</p>
                    <p className="font-semibold text-lg text-blue-700">{selectedCategory.toUpperCase()}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="design_name">Design Name *</Label>
                      <Input
                        id="design_name"
                        placeholder="e.g., Premium Marble Tile"
                        value={formData.designName}
                        onChange={(e) => setFormData({ ...formData, designName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Input
                        id="type"
                        placeholder="e.g., Ceramic, Natural Stone, Acrylic"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="size">Size/Model *</Label>
                      <Input
                        id="size"
                        placeholder="e.g., 12x12, 600x600mm"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_boxes">Number of Boxes *</Label>
                      <Input
                        id="total_boxes"
                        type="number"
                        placeholder="e.g., 100"
                        value={formData.totalBoxes}
                        onChange={(e) => setFormData({ ...formData, totalBoxes: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price_per_box">Price per Box (₹) *</Label>
                      <Input
                        id="price_per_box"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 250.00"
                        value={formData.pricePerBox}
                        onChange={(e) => setFormData({ ...formData, pricePerBox: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      <Plus className="mr-2 h-4 w-4" />
                      {loading ? "Adding..." : "Add Stock"}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/stocks">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Excel Upload */}
          <TabsContent value="excel">
            <Card>
              <CardHeader>
                <CardTitle>Upload Excel File</CardTitle>
                <CardDescription>
                  Upload an Excel file with stock data. Download the template to see the required format.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alert Messages */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Download Template */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">Excel Template</p>
                      <p className="text-sm text-muted-foreground">Download template with sample data</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    id="excel-upload"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">{file ? file.name : "Click to upload or drag and drop"}</p>
                    <p className="text-sm text-muted-foreground">CSV or Excel files (.csv, .xlsx, .xls)</p>
                  </label>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Required Columns (CSV Format):</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">design_name</th>
                          <th className="text-left p-2">type</th>
                          <th className="text-left p-2">size</th>
                          <th className="text-left p-2">total_boxes</th>
                          <th className="text-left p-2">price_per_box</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-muted-foreground">
                          <td className="p-2">Premium Marble</td>
                          <td className="p-2">Ceramic</td>
                          <td className="p-2">12x12</td>
                          <td className="p-2">150</td>
                          <td className="p-2">250.00</td>
                        </tr>
                        <tr className="text-muted-foreground">
                          <td className="p-2">Granite Tile</td>
                          <td className="p-2">Natural Stone</td>
                          <td className="p-2">18x18</td>
                          <td className="p-2">100</td>
                          <td className="p-2">450.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button className="w-full" onClick={handleExcelUpload} disabled={!file || loading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? "Uploading..." : "Upload and Import Stock"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
