"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, Plus, Download, CheckCircle, AlertCircle, Trash2, Pencil } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { useCategory } from "@/context/CategoryContext"
import { createStock, uploadStockExcel } from "@/lib/services/stocks"

type PreviewRow = {
  design_name: string
  type: string
  size: string
  total_boxes: string
}

export default function AddStockPage() {
  const { selectedCategory, selectedCategoryId } = useCategory()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Manual form
  const [formData, setFormData] = useState({
    designName: "",
    type: "",
    size: "",
    totalBoxes: "",
  })

  // CSV preview
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)

  // ── Manual submit ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.designName.trim()) return setError("Design name is required")
    if (!formData.type.trim()) return setError("Type is required")
    if (!formData.size.trim()) return setError("Size is required")
    if (!formData.totalBoxes || Number(formData.totalBoxes) <= 0)
      return setError("Number of boxes must be greater than 0")

    setLoading(true)
    try {
      await createStock({
        designName: formData.designName.trim(),
        type: formData.type.trim(),
        size: formData.size.trim(),
        totalBoxes: Number(formData.totalBoxes),
        pricePerBox: 0,   // price not collected here
        categoryId: selectedCategoryId,
      })
      setSuccess(`✅ Stock "${formData.designName}" added successfully!`)
      setFormData({ designName: "", type: "", size: "", totalBoxes: "" })
      // Stay on page — no redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stock")
    } finally {
      setLoading(false)
    }
  }

  // ── CSV parse → preview ────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setPreviewRows([])
    setError("")
    setSuccess("")

    if (!f) return
    if (!f.name.endsWith(".csv")) {
      setError("Only .csv files are supported.")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      if (rows.length < 2) { setError("CSV has no data rows."); return }

      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase())
      const required = ["design_name", "type", "size", "total_boxes"]
      const missing = required.filter((k) => !headers.includes(k))
      if (missing.length > 0) { setError(`Missing columns: ${missing.join(", ")}`); return }

      const idx = (n: string) => headers.indexOf(n)
      const parsed: PreviewRow[] = rows.slice(1).map((row) => {
        const cols = row.split(",").map((c) => c.trim())
        return {
          design_name: cols[idx("design_name")] ?? "",
          type: cols[idx("type")] ?? "",
          size: cols[idx("size")] ?? "",
          total_boxes: cols[idx("total_boxes")] ?? "",
        }
      })
      setPreviewRows(parsed)
    }
    reader.readAsText(f)
  }

  // ── Edit preview row ───────────────────────────────────────────
  const updateRow = (i: number, field: keyof PreviewRow, value: string) => {
    setPreviewRows((prev) => {
      const copy = [...prev]
      copy[i] = { ...copy[i], [field]: value }
      return copy
    })
  }

  const deleteRow = (i: number) => {
    setPreviewRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  // ── Upload confirmed preview rows ──────────────────────────────
  const handleUpload = async () => {
    if (previewRows.length === 0) { setError("No rows to upload."); return }
    setError("")
    setSuccess("")
    setLoading(true)

    let inserted = 0
    const errors: string[] = []

    for (const row of previewRows) {
      if (!row.design_name || !row.type || !row.size || !row.total_boxes) {
        errors.push(`Row "${row.design_name || "unnamed"}": missing required fields`)
        continue
      }
      try {
        await createStock({
          designName: row.design_name,
          type: row.type,
          size: row.size,
          totalBoxes: Number(row.total_boxes),
          pricePerBox: 0,
          categoryId: selectedCategoryId,
        })
        inserted++
      } catch (err) {
        errors.push(`"${row.design_name}": ${err instanceof Error ? err.message : "failed"}`)
      }
    }

    setLoading(false)
    if (inserted > 0) {
      setSuccess(`✅ ${inserted} stock item(s) uploaded successfully!${errors.length > 0 ? ` (${errors.length} failed)` : ""}`)
      setPreviewRows([])
      setFile(null)
    }
    if (errors.length > 0 && inserted === 0) {
      setError(`All rows failed:\n${errors.join("\n")}`)
    }
  }

  // ── Download template (4 columns only) ────────────────────────
  const downloadTemplate = () => {
    const csv = "design_name,type,size,total_boxes\n"
      + "Premium Marble Tile,Ceramic,12x12,150\n"
      + "Granite Tile,Natural Stone,18x18,100\n"
      + "Porcelain White,Porcelain,24x24,200"

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
      <NavigationHeader
        items={[{ label: "Stock Management", href: "/stocks" }, { label: "Add New Stock" }]}
        title="Add New Stock"
        description="Add inventory using manual entry or CSV upload"
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Manual Entry</TabsTrigger>
            <TabsTrigger value="excel">Excel Upload</TabsTrigger>
          </TabsList>

          {/* ── Manual Entry ── */}
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>Add Stock Manually</CardTitle>
                <CardDescription>Enter stock details using the form below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Input
                        id="type"
                        placeholder="e.g., Ceramic, Natural Stone"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="size">Size/Model *</Label>
                      <Input
                        id="size"
                        placeholder="e.g., 12x12, 600x600mm"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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

          {/* ── CSV Upload with Preview ── */}
          <TabsContent value="excel">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>Upload a CSV file, preview and edit the data, then confirm upload.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription style={{ whiteSpace: "pre-line" }}>{error}</AlertDescription>
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
                      <p className="font-medium">CSV Template</p>
                      <p className="text-sm text-muted-foreground">4 columns: design_name, type, size, total_boxes</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* File picker */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer block">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">{file ? file.name : "Click to select a CSV file"}</p>
                    <p className="text-sm text-muted-foreground">Only .csv files supported</p>
                  </label>
                </div>

                {/* Preview Table */}
                {previewRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Preview — {previewRows.length} rows</h4>
                      <p className="text-sm text-muted-foreground">Click ✏️ to edit a row before uploading</p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 pl-3">#</th>
                            <th className="text-left p-2">Design Name</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Size</th>
                            <th className="text-left p-2">Boxes</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, i) => (
                            <tr key={i} className="border-t hover:bg-muted/40">
                              <td className="p-2 pl-3 text-muted-foreground">{i + 1}</td>
                              {editingRow === i ? (
                                <>
                                  <td className="p-1">
                                    <Input
                                      value={row.design_name}
                                      onChange={(e) => updateRow(i, "design_name", e.target.value)}
                                      className="h-7 text-sm"
                                    />
                                  </td>
                                  <td className="p-1">
                                    <Input
                                      value={row.type}
                                      onChange={(e) => updateRow(i, "type", e.target.value)}
                                      className="h-7 text-sm"
                                    />
                                  </td>
                                  <td className="p-1">
                                    <Input
                                      value={row.size}
                                      onChange={(e) => updateRow(i, "size", e.target.value)}
                                      className="h-7 text-sm"
                                    />
                                  </td>
                                  <td className="p-1">
                                    <Input
                                      value={row.total_boxes}
                                      onChange={(e) => updateRow(i, "total_boxes", e.target.value)}
                                      className="h-7 text-sm w-20"
                                    />
                                  </td>
                                  <td className="p-1">
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingRow(null)}>
                                      Done
                                    </Button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-2">{row.design_name}</td>
                                  <td className="p-2">{row.type}</td>
                                  <td className="p-2">{row.size}</td>
                                  <td className="p-2">{row.total_boxes}</td>
                                  <td className="p-2 flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingRow(i)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteRow(i)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button className="w-full" onClick={handleUpload} disabled={loading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {loading ? "Uploading..." : `Confirm & Upload ${previewRows.length} Items`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}