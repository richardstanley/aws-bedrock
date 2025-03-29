import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Database, FileSpreadsheet, History } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto py-16 px-4">
        <div className="flex flex-col items-center justify-center space-y-12 text-center">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Switchblade Athena API
            </h1>
            <p className="text-xl text-muted-foreground">
              A powerful data analysis platform that combines the flexibility of SQL queries with the ease of CSV uploads.
              Built with AWS Athena and Next.js for seamless data processing.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Data Analysis</CardTitle>
                <CardDescription className="text-base">
                  Execute powerful SQL queries against your data with real-time results and visualizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="group-hover:translate-x-1 transition-transform duration-300">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">CSV Upload</CardTitle>
                <CardDescription className="text-base">
                  Easily upload and process CSV files with automatic schema detection and validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="group-hover:translate-x-1 transition-transform duration-300">
                  Upload Files <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Query History</CardTitle>
                <CardDescription className="text-base">
                  Track and manage your query history with detailed execution metrics and results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="group-hover:translate-x-1 transition-transform duration-300">
                  View History <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-primary/5 border border-primary/10">
            <h2 className="text-2xl font-semibold mb-4">Why Choose Switchblade?</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-left">
              <div className="space-y-2">
                <h3 className="font-medium">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Execute queries in milliseconds with optimized performance</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Secure</h3>
                <p className="text-sm text-muted-foreground">Enterprise-grade security with AWS Cognito authentication</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Scalable</h3>
                <p className="text-sm text-muted-foreground">Handle growing data volumes without performance impact</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">User Friendly</h3>
                <p className="text-sm text-muted-foreground">Intuitive interface for data analysis and management</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Cost Effective</h3>
                <p className="text-sm text-muted-foreground">Pay only for the queries you execute</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Real-time</h3>
                <p className="text-sm text-muted-foreground">Get instant results and visualizations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
