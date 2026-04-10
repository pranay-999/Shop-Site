"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { Search, Eye, Printer, Edit, Trash2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog"
import { NavigationHeader } from "@/app/components/navigation-header"

export default function BillsPage() {
  const [exportType, setExportType] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [printBillOpen, setPrintBillOpen] = useState(false)
  const [printOption, setPrintOption] = useState<string>("")
  const [printBillNumber, setPrintBillNumber] = useState("")

  const bills = [
    {
      id: "1",
      bill_number: "INV-20250115-001",
      customer_name: "Rajesh Kumar",
      customer_phone: "+91 98765 43210",
      total_amount: 5015,
      payment_method: "Cash",
      status: "active",
      created_at: "2025-01-15 10:30 AM",
    },
    {
      id: "2",
      bill_number: "INV-20250114-005",
      customer_name: "Priya Sharma",
      customer_phone: "+91 87654 32109",
      total_amount: 12450,
      payment_method: "UPI",
      status: "active",
      created_at: "2025-01-14 03:15 PM",
    },
    {
      id: "3",
      bill_number: "INV-20250113-003",
      customer_name: "Amit Patel",
      customer_phone: "+91 76543 21098",
      total_amount: 8920,
      payment_method: "Card",
      status: "returned",
      created_at: "2025-01-13 11:45 AM",
    },
  ]

  const handleExport = () => {
    alert(`Exporting bills for: ${exportType}${startDate && endDate ? ` from ${startDate} to ${endDate}` : ""}`)
    // In real app, this would trigger download
  }

  const handlePrint = () => {
    if (printOption === "bill_number" && !printBillNumber.trim()) {
      alert("Please enter a bill number")
      return
    }

    if (printOption === "custom" && (!startDate || !endDate)) {
      alert("Please select both start and end dates")
      return
    }

    alert(`Printing bills for: ${printOption}`)
    setPrintBillOpen(false)
    // In real app, generate and print PDF
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Bills & Invoices" }]}
        title="Bills & Invoices"
        description="View and manage customer invoices"
      />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Bills</CardTitle>
                <CardDescription>View and manage customer invoices</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPrintBillOpen(true)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bills
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Bills
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Export Bills</h4>
                        <p className="text-sm text-muted-foreground">Download bills in Excel format</p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="export_type">Export By</Label>
                          <Select value={exportType} onValueChange={setExportType}>
                            <SelectTrigger id="export_type">
                              <SelectValue placeholder="Select export type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Bills</SelectItem>
                              <SelectItem value="month">Past Month</SelectItem>
                              <SelectItem value="year">Past Year</SelectItem>
                              <SelectItem value="custom">Custom Date Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {exportType === "custom" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="start_date">Start Date</Label>
                              <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end_date">End Date</Label>
                              <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                              />
                            </div>
                          </>
                        )}

                        <Button className="w-full" onClick={handleExport} disabled={!exportType}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Excel
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by bill number..." className="pl-9" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono font-medium">{bill.bill_number}</TableCell>
                      <TableCell>{bill.customer_name}</TableCell>
                      <TableCell>{bill.customer_phone}</TableCell>
                      <TableCell className="text-right font-medium">₹{bill.total_amount.toLocaleString()}</TableCell>
                      <TableCell>{bill.payment_method}</TableCell>
                      <TableCell>
                        {bill.status === "active" ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Active
                          </Badge>
                        ) : bill.status === "returned" ? (
                          <Badge variant="destructive">Returned</Badge>
                        ) : (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            Exchanged
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{bill.created_at}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" title="View Bill">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Print Bill">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Link href={`/bills/edit/${bill.id}`}>
                            <Button size="icon" variant="ghost" title="Edit Bill">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="icon" variant="ghost" title="Delete Bill">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Bills</p>
                <p className="text-2xl font-bold">{bills.length}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Active Bills</p>
                <p className="text-2xl font-bold text-green-600">{bills.filter((b) => b.status === "active").length}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₹{bills.reduce((acc, b) => acc + b.total_amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={printBillOpen} onOpenChange={setPrintBillOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Print Bills</DialogTitle>
            <DialogDescription>Select which bills to print</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="print_option">Print Option</Label>
              <Select value={printOption} onValueChange={setPrintOption}>
                <SelectTrigger id="print_option">
                  <SelectValue placeholder="Select print option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bill_number">Specific Bill Number</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="six_months">Past 6 Months</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {printOption === "bill_number" && (
              <div className="space-y-2">
                <Label htmlFor="print_bill_number">Bill Number</Label>
                <Input
                  id="print_bill_number"
                  placeholder="Enter bill number"
                  value={printBillNumber}
                  onChange={(e) => setPrintBillNumber(e.target.value)}
                />
              </div>
            )}

            {printOption === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="print_start_date">Start Date</Label>
                  <Input
                    id="print_start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="print_end_date">End Date</Label>
                  <Input id="print_end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setPrintBillOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handlePrint} disabled={!printOption}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
