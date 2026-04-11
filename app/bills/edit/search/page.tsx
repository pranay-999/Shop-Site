"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { NavigationHeader } from "@/app/components/navigation-header"

export default function BillSearchPage() {
  const router = useRouter()
  const [billNumber, setBillNumber] = useState("")

  const handleSearch = () => {
    const trimmed = billNumber.trim()
    if (!trimmed) return
    router.push(`/bills/edit/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Bills", href: "/bills" }, { label: "Edit Bill Search" }]}
        title="Find Bill to Edit"
        description="Enter a bill number to open the edit page."
      />
      <main className="container mx-auto max-w-xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Search by Bill Number</CardTitle>
            <CardDescription>Example: BILL-001</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter bill number"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
            <Button onClick={handleSearch} className="w-full">
              Open Bill
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
