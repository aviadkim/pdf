# Page snapshot

```yaml
- banner:
  - link "📄 Phase 3 PDF Platform":
    - /url: dashboard.html
  - navigation:
    - link "Dashboard":
      - /url: dashboard.html
    - link "History":
      - /url: history.html
    - link "Templates":
      - /url: templates.html
    - link "Analytics":
      - /url: analytics.html
    - link "Logout":
      - /url: "#"
- main:
  - heading "Processing Templates" [level=1]
  - button "📥 Import Template"
  - button "✏️ Create Template"
  - heading "Categories" [level=3]
  - text: All Templates Swiss Banks Portfolio Reports Securities Lists Bank Statements Custom
  - heading "Swiss Portfolio Standard" [level=3]
  - paragraph: Standard template for Swiss bank portfolio reports with securities extraction
  - text: "📊 99.5% accuracy 👥 247 uses { \"extraction_rules\": { \"securities_table\": { \"start_markers\": [ \"ISIN\", \"Valor\", \"Denomination\" ], \"end_markers\": [ \"Total Portfolio\", \"Total Value\" ], \"columns\": [ \"isin\", \"name\", \"quantity\", \"price\", \"value\" ] }, \"validation\": { \"required_fields\": [ \"isin\", \"name\", \"value\" ], \"mathematical_consistency\": true, \"sum_validation\": true } }, \"processing_mode\": \"aggressive\", \"timeout\": 30 } builtin popular"
  - button "🚀"
  - heading "Messos Bank Format" [level=3]
  - paragraph: Specialized template for Messos bank PDF documents
  - text: "📊 98.7% accuracy 👥 156 uses { \"extraction_rules\": { \"header_detection\": { \"patterns\": [ \"Messos\", \"Portfolio\", \"Übersicht\" ] }, \"securities_extraction\": { \"table_detection\": \"auto\", \"coordinate_calibration\": true } } } builtin popular"
  - button "🚀"
  - heading "Generic Securities List" [level=3]
  - paragraph: Universal template for securities lists from various sources
  - text: "📊 94.2% accuracy 👥 89 uses { \"extraction_rules\": { \"flexible_columns\": true, \"auto_detect_headers\": true, \"column_mapping\": { \"isin\": [ \"ISIN\", \"International Securities ID\", \"Security ID\" ], \"name\": [ \"Name\", \"Security Name\", \"Description\", \"Instrument\" ], \"quantity\": [ \"Quantity\", \"Units\", \"Shares\", \"Amount\" ], \"price\": [ \"Price\", \"Unit Price\", \"Market Price\", \"Value per Unit\" ], \"value\": [ \"Total Value\", \"Market Value\", \"Total\", \"Amount\" ] } } } builtin"
  - button "🚀"
```