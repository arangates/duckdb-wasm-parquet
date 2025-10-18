import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { IconBrandGithub, IconMail, IconBook, IconMessageCircle } from "@tabler/icons-react"

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Get Help</h1>
        <p className="text-muted-foreground mt-2">Find answers and get support for DuckDB Parquet Viewer</p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <IconBook className="mb-2 size-8" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Learn how to use DuckDB Parquet Viewer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Browse our comprehensive documentation to learn about features, SQL queries, and best practices.
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              View Documentation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <IconBrandGithub className="mb-2 size-8" />
            <CardTitle>GitHub Repository</CardTitle>
            <CardDescription>View source code and report issues</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Check out the source code, report bugs, or contribute to the project on GitHub.
            </p>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a href="https://github.com/arangates/duckdb-wasm-parquet" target="_blank" rel="noopener noreferrer">
                Open GitHub
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <IconMessageCircle className="mb-2 size-8" />
            <CardTitle>Community Support</CardTitle>
            <CardDescription>Get help from the community</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Join our community discussions to ask questions and share your experiences.
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              Join Community
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <IconMail className="mb-2 size-8" />
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Reach out to our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Need direct assistance? Contact our support team for personalized help.
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              Contact Us
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">What file formats are supported?</h3>
            <p className="text-muted-foreground text-sm">
              Currently, we support Apache Parquet files with various compression codecs including GZIP, Snappy, and
              uncompressed.
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold">What is the maximum file size?</h3>
            <p className="text-muted-foreground text-sm">
              The application can handle files with millions of rows. Performance depends on your browser and available
              memory.
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold">Can I run custom SQL queries?</h3>
            <p className="text-muted-foreground text-sm">
              Yes! Use the SQL Query interface on the Parquet Viewer page to run custom DuckDB SQL queries on your data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
