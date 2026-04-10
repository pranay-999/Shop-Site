import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, Package, ShoppingCart } from "lucide-react"
import { NavigationHeader } from "@/app/components/navigation-header"

export default function AnalyticsPage() {
  // Mock analytics data
  const lowStockItems = [
    { design_name: "Designer Sanitary Ware", size: "Model A23", remaining: 3, threshold: 10 },
    { design_name: "Premium Marble Tile", size: "600x600mm", remaining: 8, threshold: 10 },
    { design_name: "Luxury Floor Tile", size: "800x800mm", remaining: 5, threshold: 15 },
  ]

  const topSelling = [
    { design_name: "Classic Floor Tile", sold: 120, revenue: 54000 },
    { design_name: "Premium Marble Tile", sold: 45, revenue: 38250 },
    { design_name: "Designer Sanitary Ware", sold: 47, revenue: 56400 },
  ]

  const salesTrends = [
    { period: "Today", sales: 12, revenue: 18500 },
    { period: "This Week", sales: 45, revenue: 85200 },
    { period: "This Month", sales: 212, revenue: 425430 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Analytics & Reports" }]}
        title="Analytics & Reports"
        description="Track performance metrics and insights"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Sales Trends */}
          <div className="grid gap-4 md:grid-cols-3">
            {salesTrends.map((trend, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">{trend.period}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sales</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{trend.sales}</span>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="text-lg font-semibold">₹{trend.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Low Stock Alerts */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Items that need immediate restocking</CardDescription>
                </div>
                <Badge variant="destructive">{lowStockItems.length} Items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-destructive" />
                      <div>
                        <p className="font-medium">{item.design_name}</p>
                        <p className="text-sm text-muted-foreground">{item.size}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-destructive">{item.remaining}</p>
                      <p className="text-xs text-muted-foreground">boxes left</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
              <CardDescription>Best performers this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSelling.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.design_name}</p>
                        <p className="text-sm text-muted-foreground">{item.sold} boxes sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">₹{item.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stock Value Overview</CardTitle>
                <CardDescription>Current inventory value breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Stock Value</span>
                    <span className="text-xl font-bold">₹2,35,000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Items</span>
                    <span className="text-xl font-bold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">In Stock</span>
                    <span className="text-xl font-bold text-green-600">1,201</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <span className="text-sm font-medium">Low Stock</span>
                    <span className="text-xl font-bold text-destructive">23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Sales Growth</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">+12%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Revenue Growth</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">+18%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Stock Turnover</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">-5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Avg. Sale Value</span>
                    </div>
                    <span className="text-xl font-bold">₹2,005</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
