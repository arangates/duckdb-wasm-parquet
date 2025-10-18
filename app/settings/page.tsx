import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your application preferences and settings</p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input id="app-name" defaultValue="DuckDB Parquet Viewer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-rows">Default Rows Per Page</Label>
            <Input id="default-rows" type="number" defaultValue="1000" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Processing</CardTitle>
          <CardDescription>Configure how data is processed and displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-memory">Maximum Memory (MB)</Label>
            <Input id="max-memory" type="number" defaultValue="512" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cache-size">Cache Size (MB)</Label>
            <Input id="cache-size" type="number" defaultValue="256" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  )
}
