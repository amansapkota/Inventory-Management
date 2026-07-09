import Link from 'next/link'
import {
  ShoppingBag, Package, ShoppingCart, BarChart3, Users, Truck, Warehouse,
  Receipt, DollarSign, UserCheck, Bell, Store, ArrowRight, Star, Shield,
  Zap, TrendingUp, Clock, Smartphone, CheckCircle, ChevronRight,
  Coffee, Building2, Globe, Layers, ScanLine, QrCode, Wifi, RefreshCw,
  Network, Lock, BarChart, FileText, Headphones,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: ShoppingCart, title: 'Point of Sale', description: 'Lightning-fast POS with barcode scanning, split payments, and instant thermal receipts.' },
  { icon: ScanLine, title: 'Barcode Scanning', description: 'Supports all scanner types: USB keyboard wedge, Bluetooth, and mobile camera. Auto-detect & add to cart.' },
  { icon: Package, title: 'Product Catalog', description: 'Smart catalog with variants, barcodes, bulk import/export, and auto-tagging.' },
  { icon: Warehouse, title: 'Inventory Control', description: 'Real-time stock sync, low-stock alerts, multi-warehouse transfers, and cycle counts.' },
  { icon: Truck, title: 'Purchase Orders', description: 'Automated PO generation, goods receipt with batch/expiry tracking, and supplier scorecards.' },
  { icon: Receipt, title: 'Sales Analytics', description: 'Interactive dashboards with profit margins, trends, and AI-powered forecasts.' },
  { icon: Users, title: 'CRM & Loyalty', description: 'Customer profiles, tiered memberships (Silver/Gold/Diamond/VIP), points, and auto-coupons.' },
  { icon: UserCheck, title: 'HR & Payroll', description: 'Attendance, leave management, payroll processing, and role-based permissions.' },
  { icon: DollarSign, title: 'Accounting', description: 'Double-entry bookkeeping, P&L, balance sheets, and automated tax reports.' },
  { icon: Globe, title: 'Multi-Branch', description: 'Centralized or decentralized control across unlimited locations with real-time consolidation.' },
  { icon: Bell, title: 'Smart Alerts', description: 'Real-time notifications for low stock, expiry, daily sales, and system events via in-app, email, or SMS.' },
  { icon: Layers, title: 'Multi-Tenant Ready', description: 'Single or multi-company setup. Each tenant gets isolated data with cross-company reporting.' },
  { icon: Network, title: 'API & Integrations', description: 'RESTful APIs, webhooks, and pre-built integrations with e-commerce, payment gateways, and accounting software.' },
  { icon: Shield, title: 'Role-Based Access', description: 'Granular permissions: SUPER_ADMIN, COMPANY_OWNER, BRANCH_MANAGER, CASHIER, and more.' },
  { icon: BarChart, title: 'Custom Reports', description: 'Drag-and-drop report builder with one-click Excel, PDF export, and auto-scheduled email delivery.' },
  { icon: FileText, title: 'Tax Compliance', description: 'Automated VAT/PAN billing, sales tax reports, and multi-currency support for cross-border transactions.' },
]

const testimonials = [
  { name: 'Rajesh Hamal', role: 'Owner, City Mart — Kathmandu', content: 'We run 3 locations with 50+ staff. RetailPro handles everything — POS, inventory, payroll, and accounting. The barcode scanner reduced checkout time by 60%. We\'ve never been more efficient.', rating: 5 },
  { name: 'Sita Devi', role: 'Operations Manager, MegaStore — Pokhara', content: 'Started as a single shop, now managing 5 branches from one dashboard. Multi-branch support is incredible. Real-time stock visibility across all locations is a game changer.', rating: 5 },
  { name: 'Anil Gurung', role: 'CFO, Retail Hub Group', content: 'The accounting module alone saved us 20 hours a week. Auto-reconciliation, tax reports at the click of a button, and the audit trail gives us complete confidence.', rating: 5 },
  { name: 'Maya Tamang', role: 'Owner, Himalayan Tea House', content: 'Finally, a system designed for small businesses too! The interface is simple, barcode scanning just works, and my team picked it up in a day. Affordable pricing for startups.', rating: 5 },
]

const planCards = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for small shops and tea stalls testing the waters',
    features: ['Up to 500 products', 'Single branch', '1 warehouse', 'Basic POS & inventory', 'Barcode scanning', 'Email support'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$29',
    period: '/month',
    description: 'For growing retail stores and mid-size chains',
    features: ['Up to 10,000 products', 'Up to 5 branches', '5 warehouses', 'Full POS + barcode', 'Multi-branch reports', 'HR & payroll', 'Phone & chat support'],
    cta: 'Start Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For large retail chains and multi-company groups',
    features: ['Unlimited products', 'Unlimited branches', 'Unlimited warehouses', 'Multi-company (tenants)', 'API & webhooks', 'Custom reports', 'Dedicated account manager', 'SLA guarantee', 'Priority support 24/7'],
    cta: 'Contact Sales',
    popular: false,
  },
]

const stats = [
  { value: '10,000+', label: 'Active Businesses' },
  { value: '50M+', label: 'Transactions Processed' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '4.9/5', label: 'User Rating' },
  { value: '150+', label: 'Countries' },
  { value: '24/7', label: 'Support' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <ShoppingBag className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">RetailPro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-foreground transition-colors">Solutions</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-8 border border-blue-200">
                <Zap size={14} />
                Trusted by 10,000+ retailers in 150+ countries
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
                The All-in-One
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Retail Operating System
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-muted-foreground font-normal mt-2">
                  From tea shops to supermarket chains
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                One platform to manage sales, inventory, staff, customers, and finances. 
                Works for every business size — single store, multi-branch, or multi-company groups.
                No IT team required.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-base px-10 py-6 h-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="text-base px-10 py-6 h-auto border-2">
                    <Smartphone className="mr-2" size={18} />
                    See Features
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Free setup & training
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Cancel anytime
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  24/7 support
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl border bg-white/80 backdrop-blur-sm shadow-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">demo.retailpro.com</div>
                  </div>
                  <div className="border rounded-xl p-5 space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">$48,290</div>
                        <div className="text-sm text-green-600 font-medium">+12.5% vs last week</div>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <TrendingUp className="text-white" size={24} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/80 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">Today&apos;s Orders</div>
                        <div className="text-lg font-bold">284</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">Items Sold</div>
                        <div className="text-lg font-bold">1,247</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">Returns</div>
                        <div className="text-lg font-bold text-red-500">12</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Inventory capacity</span>
                        <span>75%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/80 overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-xl p-4 flex items-center gap-4 bg-green-50/50">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Bell size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Low stock alert: Basmati Rice</div>
                      <div className="text-xs text-muted-foreground">Only 8 units remaining — reorder now</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">2m ago</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 -z-10 w-full h-full rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions - Multi-tenant focus */}
      <section id="solutions" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6 border border-indigo-200">
              <Layers size={14} />
              Built for every business size
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              One platform. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Three ways to grow.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you run a single tea shop, a multi-branch supermarket chain, or a group of companies — RetailPro adapts to you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border-2 border-blue-100 p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-6 shadow-md">
                <Coffee className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Single Shop / Tea Stall</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Simple, fast, and affordable. Start selling in minutes with barcode scanning, 
                cash/card/QR payments, and automatic inventory tracking.
              </p>
              <ul className="space-y-3 text-sm">
                {['Plug-and-play barcode scanner', 'Cashier mode with receipt printing', 'Auto stock deduction on every sale', 'Daily sales report', 'Free forever plan'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-indigo-200 p-8 shadow-lg bg-gradient-to-b from-white to-indigo-50/30 hover:shadow-xl transition-all duration-300 scale-105 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-md">
                <Building2 className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Branch / Supermarket</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Centralized control across all locations. Real-time stock visibility, 
                inter-branch transfers, and consolidated reporting.
              </p>
              <ul className="space-y-3 text-sm">
                {['Barcode + QR + RFID scanning', 'Multi-warehouse inventory', 'Inter-branch stock transfers', 'Consolidated P&L reports', 'Staff management & payroll', 'Loyalty & membership programs'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-purple-100 p-8 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-md">
                <Globe className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Enterprise / Multi-Company</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Manage multiple companies under one login. Each tenant is fully isolated 
                with its own data, users, and settings.
              </p>
              <ul className="space-y-3 text-sm">
                {['Multi-company (tenant) architecture', 'Cross-company reporting', 'Dedicated API & webhooks', 'Custom integrations & white-label', '99.99% uptime SLA', '24/7 priority support'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How Barcode Scanning Works */}
      <section className="py-24 bg-gradient-to-b from-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6 border border-blue-200">
              <ScanLine size={14} />
              Barcode Scanning
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Scan. Sell. Done. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">No setup needed.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Any barcode scanner works instantly — USB, Bluetooth, or mobile camera. 
              Point, scan, and the item appears in the cart. Stock updates in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: QrCode, title: '1. Plug & Scan', description: 'Connect any USB barcode scanner — it works like a keyboard. No drivers, no software. Supports all common barcode formats (EAN, UPC, Code128, QR).' },
              { icon: Wifi, title: '2. Instant Add to Cart', description: 'Scan a product and it appears instantly in the POS cart. Auto-detects product, price, and updates quantity if scanned again. No clicking needed.' },
              { icon: RefreshCw, title: '3. Stock Updates Automatically', description: 'Every sale deducts from real inventory in a database transaction. Low stock alerts fire immediately. Batch & expiry tracking supported.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center p-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6 border border-blue-200">
              <Zap size={14} />
              16 powerful modules
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">scale your business</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From POS to accounting, inventory to HR — it&apos;s all included.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-xl border bg-white p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                    <Icon className="text-white" size={22} />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple pricing. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">No hidden fees.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free and upgrade as you grow. All plans include core features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {planCards.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-8 flex flex-col ${
                  plan.popular
                    ? 'border-blue-500 shadow-xl bg-gradient-to-b from-white to-blue-50/30 relative'
                    : 'border-gray-200 hover:border-blue-200 transition-colors'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-white to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">thousands</span> of retailers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From single-shop owners to enterprise groups — hear from real customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border bg-white p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to transform your retail business?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 10,000+ retailers already using RetailPro. Start free — no credit card required. 
            Get your first branch and warehouse automatically set up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-200 text-base px-10 py-6 h-auto font-semibold">
                Get Started Free
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 text-base px-10 py-6 h-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <ShoppingBag className="text-white" size={20} />
                </div>
                <span className="font-bold text-xl text-white tracking-tight">RetailPro</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-md">
                The complete retail management platform for modern businesses. 
                From tea shops to enterprise chains — manage everything in one place.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs">
                  <Shield size={14} className="text-blue-400" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Lock size={14} className="text-blue-400" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Headphones size={14} className="text-blue-400" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag size={14} className="text-blue-400" />
              <span>&copy; {new Date().getFullYear()} RetailPro. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
