import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function BillingPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are currently on the Free plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Free Plan</h3>
              <p className="text-muted-foreground text-sm">Perfect for getting started with Parquet file analysis</p>
            </div>
            <Badge>Active</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm">Features included:</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Unlimited file uploads</li>
              <li>Up to 10M rows per file</li>
              <li>Basic analytics and visualizations</li>
              <li>SQL query interface</li>
            </ul>
          </div>
          <Button>Upgrade Plan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No payment method on file</p>
          <Button variant="outline" className="mt-4 bg-transparent">
            Add Payment Method
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
